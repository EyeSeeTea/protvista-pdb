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
  
  connectedCallback() {
    this.style.display = 'block';
    this.style.width = '100%';
    this.width = this.offsetWidth;

    this._offset = parseFloat(this.getAttribute('offset')) || 0;

    this._length = parseFloat(this.getAttribute('length'));
    this._displaystart = parseFloat(this.getAttribute('displaystart')) || (this._offset > 0) ? this._offset : 1;
    this._displayend = parseFloat(this.getAttribute('displayend')) || (this._offset > 0) ? (this._length + this._offset - 1) : this._length;
    this._highlightStart = parseFloat(this.getAttribute('highlightStart'));
    this._highlightEnd = parseFloat(this.getAttribute('highlightEnd'));
    this._highlightFragments = [];

    this._onResize = this._onResize.bind(this);
    this.highlightInterval = this.highlightInterval.bind(this);
    this.highlightFragments = this.highlightFragments.bind(this);

    this._createNavRuler();
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

    const resize = () => { this._onResize(); this.highlightInterval(); };

    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(resize);
      this._ro.observe(this);
    }
    window.addEventListener("resize", resize);
    window.addEventListener("protvista-highlight-interval", ev => this.highlightInterval(ev));
    window.addEventListener("protvista-highlight-fragments", ev => this.highlightFragments(ev));
    window.addEventListener("protvista-remove-highlight", () => this.removeHighlightInterval());
    window.addEventListener("protvista-remove-fragments", () => this.removeHighlightFragments());
  }

  highlightInterval(ev) {
    if (ev) {
      if (!(ev.detail.start >= 0 && ev.detail.end >= 0)) return;
      this._highlightStart = ev.detail.start;
      this._highlightEnd = ev.detail.end;
    } else if (!(this._highlightStart >= 0 && this._highlightEnd >= 0)) return;
    if (this._x(this._highlightEnd) - this._x(this._highlightStart) < 0) return;
    const width = Math.max(1, this._x(this._highlightEnd) - this._x(this._highlightStart));
    this._highlighted
      .attr("y", 0)
      .attr("x", this._x(this._highlightStart))
      .attr("width", width)
      .attr("fill", width === 1 ? "rgb(0, 0, 0)" : "rgb(255, 235, 59)");
  }

  removeHighlightInterval() {
    this._highlighted
      .attr("y", undefined)
      .attr("x", undefined)
      .attr("width", undefined);
  }

  removeHighlightFragments() {
    if (this._highlightFragments && this._highlightFragments.length > 0)
      this._highlightFragments.forEach(rect => rect.remove());
  }

  highlightFragments(ev) {
    const intervalsString = (ev.detail.intervalsString || "").split(":")[1] || "";
    if (!Boolean(intervalsString)) return;

    const intervals = intervalsString.split(",").filter(Boolean).map(ns => {
      const [start, end] = ns.split("-").map(s => parseInt(s));
      return { start, end };
    });

    this.removeHighlightFragments();

    this._highlightFragments = intervals.map(({ start, end }) => {
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
  }

}

export default ProtvistaPdbNavigation;
