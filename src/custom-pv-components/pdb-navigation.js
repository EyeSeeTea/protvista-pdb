import {
  scaleLinear,
  axisBottom,
  brushX,
  format,
  select,
  event as d3Event
} from 'd3';
import ProtvistaNavigation from "protvista-navigation";

const height = 40,
  padding = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };

class ProtvistaPdbNavigation extends ProtvistaNavigation {

  getIntAttribute(attribute) {
    return parseInt(this.getAttribute(attribute));
  }

  getFloatAttribute(attribute) {
    return parseFloat(this.getAttribute(attribute));
  }

  connectedCallback() {
    this.style.display = 'block';
    this.style.width = '100%';
    this.width = this.offsetWidth;

    this._offset = this.getFloatAttribute('offset') || 0;
    this._length = this.getIntAttribute('length');
    this._displaystart = this.getIntAttribute('displaystart') || (this._offset > 0) ? this._offset : 1;
    this._displayend = this.getIntAttribute('displayend') || (this._offset > 0) ? (this._length + this._offset - 1) : this._length;
    this._highlightstart = this.getIntAttribute('highlightstart');
    this._highlightend = this.getIntAttribute('highlightend');
    this._highlightintervals = this.getAttribute("highlightintervals");

    this._highlightedFragments = [];

    this._onResize = this._onResize.bind(this);
    this._updateNavRuler = this._updateNavRuler.bind(this);

    this._createNavRuler();
  }

  static get observedAttributes() {
    return ['length', 'displaystart', 'displayend', 'highlightstart', 'highlightend', 'width', 'highlightintervals'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this[`_${name}`] = name === "highlightintervals" ? newValue : name === "offset" ? parseFloat(newValue) : parseInt(newValue);
    this._updateNavRuler();
  }

  _onResize() {
    this.width = this.offsetWidth;
    if (this.width - padding.right < 0) return; //rect cannot have negative width
    this._x = this._x.range([padding.left, this.width - padding.right]);

    this._svg.attr('width', this.width);

    this._axis.call(this._xAxis);

    this._viewport.extent([[padding.left, 0], [this.width - padding.right, height * 0.51]]);

    this._brushG.call(this._viewport);

    this._updateNavRuler();
  }

  _createNavRuler() {

    let scaleStart = (this._offset > 0) ? this._offset : 1;
    let scaleEnd = (this._offset > 0) ? (this._length + this._offset - 1) : this._length;

    this._x = scaleLinear().range([padding.left, this.width - padding.right]);
    this._x.domain([scaleStart, scaleEnd]);

    this._svg = select(this)
      .append('div')
      .attr('class', '')
      .append('svg')
      .attr('id', '')
      .attr('width', this.width)
      .attr('height', (height));

    this._xAxis = axisBottom(this._x);

    this._displaystartLabel = this._svg.append("text")
                        .attr('class', 'start-label')
                        .attr('x', 0)
                        .attr('y', height - padding.bottom);

    this._displayendLabel = this._svg.append("text")
                      .attr('class', 'end-label')
                      .attr('x', this.width)
                      .attr('y', height - padding.bottom)
                      .attr('text-anchor', 'end');
    this._axis = this._svg.append('g')
      .attr('class', 'x axis')
      .call(this._xAxis);

    this._viewport = brushX().extent([
        [padding.left, 0],
        [(this.width - padding.right), height*0.51]
      ])
      .on("brush", () => {
        if (d3Event.selection){
          this._displaystart = format("d")(this._x.invert(d3Event.selection[0]));
          this._displayend = format("d")(this._x.invert(d3Event.selection[1]));
          if (!this.dontDispatch)
            this.dispatchEvent(new CustomEvent("change", {
              detail: {
                displayend: this._displayend, displaystart: this._displaystart,
                extra: {transform: d3Event.transform}
              }, bubbles:true, cancelable: true
            }));
          this._updateLabels();
          this._updatePolygon();
        }
      });

    this._highlighted = this._svg
      .append("rect")
      .attr("class", "highlighted")
      .attr("fill", "rgb(255, 235, 59)")
      .attr("opacity", 0.4)
      .attr("height", height);

    this._fragmentsGroup = this._svg
      .append("g");

    this._brushG = this._svg.append("g")
      .attr("class", "brush")
      .call(this._viewport);

    this._brushG
      .call(this._viewport.move, [this._x(this._displaystart), this._x(this._displayend)]);

    this._brushG.select(".selection").attr('stroke', '');

    this.polygon = this._svg.append("polygon")
      .attr('class', 'zoom-polygon')
      .attr('fill', '#777')
      .attr('fill-opacity','0.3');

    this._updateNavRuler();

    const resize = () => this._onResize();

    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(resize);
      this._ro.observe(this);
    }
    window.addEventListener("resize", resize);
  }

  _updateNavRuler() {
    if (this._x) {
      this._updatePolygon();

      this._updateLabels();

      if (this._brushG) {
        this.dontDispatch = true;

        this._brushG.call(this._viewport.move, [this._x(this._displaystart), this._x(this._displayend)]);

        this.dontDispatch = false;
      }

      this._updateObserveHighlight();
      this._updateActiveHighlight();
    }
  }

  _removeHighlightFragments() {
    if (this._highlightedFragments && this._highlightedFragments.length > 0)
      this._highlightedFragments.forEach(rect => rect.remove());
  }

  _updateActiveHighlight() {
    const intervalsString = (this._highlightintervals || "").split(":")[1] || "";
    if (Boolean(intervalsString)) {

    const intervals = intervalsString.split(",").filter(Boolean).map(ns => {
      const [start, end] = ns.split("-").map(s => parseInt(s));
      return { start, end };
    });

      this._removeHighlightFragments();

      this._highlightedFragments = intervals.map(({ start, end }) => {
      const width = Math.max(1, this._x(end) - this._x(start));
      return this._fragmentsGroup
        .append("rect")
        .attr("fill", "rgba(255, 145, 0, 0.8)")
        .attr("opacity", 0.4)
        .attr("x", this._x(start))
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width);
    });
    } else this._removeHighlightFragments();
  }

  _updateObserveHighlight() {
    if (this._highlightstart >= 0 && this._highlightend >= 0 && this._x(this._highlightend) - this._x(this._highlightstart) >= 0) {
      const width = Math.max(1, this._x(this._highlightend) - this._x(this._highlightstart));
      this._highlighted
        .attr("y", 0)
        .attr("x", this._x(this._highlightstart))
        .attr("width", width)
        .attr("fill", width === 1 ? "rgb(0, 0, 0)" : "rgb(255, 235, 59)");
    } else {
      this._highlighted
        .attr("y", undefined)
        .attr("x", undefined)
        .attr("width", undefined);
    }
  }

}

export default ProtvistaPdbNavigation;
