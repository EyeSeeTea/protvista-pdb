import { select } from 'd3';
import ProtvistaSequence from "protvista-sequence";

const height = 40;

class ProtvistaPdbSequence extends ProtvistaSequence {
  connectedCallback() {
    super.connectedCallback();
    this._highlightintervals = this.getAttribute("highlightintervals");
  }

  static get observedAttributes() {
    return super.observedAttributes.concat("highlightintervals");
  }

  _createSequence() {
    super.svg = select(this)
      .append("div").attr("class", "")
      .append("svg").attr("id", "").attr("width", this.width).attr("height", height);

    this.seq_bg = super.svg.append("g").attr("class", "background");
    this.axis = super.svg.append("g").attr("class", "x axis");
    this.seq_g = super.svg.append("g").attr("class", "sequence").attr("transform", `translate(0,${0.75 * height})`);

    this.seq_g.append("text").attr("class", "base").text("T");
    this.chWidth = this.seq_g.select("text.base").node().getBBox().width * 0.8;
    this.seq_g.select("text.base").remove();

    this.highlighted = super.svg.append("rect").attr("class", "highlighted").attr("fill", "yellow").attr("height", height);
    this._fragmentsGroup = this._svg.append("g");

    this.refresh();
  }

  removeHighlightFragments() {
    if (this._highlightFragments && this._highlightFragments.length > 0)
      this._highlightFragments.forEach(rect => rect.remove());
  }

  refresh() {
    super.refresh();
    if (this._fragmentsGroup) {
      const intervalsString = (this._highlightintervals || "").split(":")[1] || "";
      if (Boolean(intervalsString)) {
        const intervals = intervalsString.split(",").filter(Boolean).map(ns => {
          const [start, end] = ns.split("-").map(s => parseInt(s));
          return { start, end };
        });

        this.removeHighlightFragments();

        this._highlightFragments = intervals.map(({ start, end }) => {
          return this._fragmentsGroup
            .append("rect")
            .attr("fill", "rgba(255, 145, 0, 0.8)")
            .attr("opacity", 0.4)
            .attr("x", super.getXFromSeqPosition(start))
            .attr("y", 0)
            .attr("height", height)
            .attr("width", this.getSingleBaseWidth() * (end - start + 1));
        });
      } else this.removeHighlightFragments();
    }
  }
}

export default ProtvistaPdbSequence;
