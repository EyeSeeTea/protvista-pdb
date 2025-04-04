import * as d3 from "d3";
import ProtvistaTrack from "protvista-track";

const margin = {
  top: 10,
  bottom: 10
};

class ProtvistaPdbTrack extends ProtvistaTrack {

  connectedCallback() {
    super.connectedCallback()
    this._highlightintervals = this.getAttribute("highlightintervals");
  }

  static get observedAttributes() {
    return [...ProtvistaTrack.observedAttributes, "highlightintervals"];
  }

  applyZoomTranslation() {
    if (!this.svg || !this._originXScale) return; // Calculating the scale factor based in the current start/end coordinates and the length of the sequence.

    const k = Math.max(1, // +1 because the displayend base should be included
      this.length / (1 + this._displayend - this._displaystart)); // The deltaX gets calculated using the position of the first base to display in original scale

    const dx = -this._originXScale(this._displaystart);
    this.dontDispatch = true; // This is to avoid infinite loops

    const { height, width } = this.svg.node().getBoundingClientRect();
    if (height <= 0 || width <= 0) return; // Fix d3 error: https://github.com/Webiks/force-horse/issues/19#issuecomment-1242800033

    this.svg.call( // We trigger a zoom action
      this.zoom.transform, d3.zoomIdentity // Identity transformation
        .scale(k) // Scaled by our scaled factor
        .translate(dx, 0) // Translated by the delta
    );
    this.dontDispatch = false;
    this.refresh();
  }

  _createTrack() {
    this._layoutObj.init(this._data);

    d3.select(this)
    .selectAll("svg")
      .remove();
    
    this.svg = d3.select(this)
      .append("div")
      .style("line-height", 0)
      .append("svg")
      .style('width', '100%')
      .style("overflow", "visible")
      .attr("height", this._height);

    this.highlighted = this.svg
      .append("rect")
      .attr("class", "highlighted")
      .attr("fill", "rgba(255, 235, 59, 0.8)")
      .attr('stroke', 'black')
      .attr("height", this._height);


    this.highlightedIntervals = this.svg
      .append("g");

    // this.trackHighlighter.appendHighlightTo(this.svg);

    this.seq_g = this.svg.append("g").attr("class", "sequence-features").attr("transform", "translate(0,-8)");

    this._createFeatures();
    this.refresh();
  }

  _createFeatures() {
    this.featuresG = this.seq_g.selectAll("g.feature-group").data(this._data);

    this.locations = this.featuresG
      .enter()
      .append("g")
      .attr("class", "feature-group")
      .attr("id", d => `g_${d.accession}`)
      .selectAll("g.location-group")
      .data(d =>
        d.locations.map(loc =>
          Object.assign({}, loc, {
            feature: d
          })
        )
      )
      .enter()
      .append("g")
      .attr("class", "location-group");

    this.features = this.locations
      .selectAll("g.fragment-group")
      .data(d =>
        d.fragments.map(loc =>
          Object.assign({}, loc, {
            feature: d.feature
          })
        )
      )
      .enter()
      .append("path")
      .attr("class", "feature")
      .attr("tooltip-trigger", "true")
      .attr("d", f =>
        {  
          return this._featureShape.getFeatureShape(
            this.getSingleBaseWidth(),
            this._layoutObj.getFeatureHeight(f),
            f.end ? f.end - f.start + 1 : 1,
            this._getShape(f)
          )
         } 
      )
      .attr(
        "transform",
        f =>
          "translate(" +
          this.getXFromSeqPosition(f.start) +
          "," +
          (this.margin.top + this._layoutObj.getFeatureYPos(f.feature)) +
          ")"
      )
      .attr("fill", (f, i) => {
        let colorData = f.feature;
        if(f.feature.color) colorData = {color: f.feature.color};
        if(f.feature.locations && f.feature.locations[0].fragments[i] && f.feature.locations[0].fragments[i].color) colorData = {color: f.feature.locations[0].fragments[i].color};
        return this._getFeatureColor(colorData)
      })
      .attr("stroke", (f, i) => {
        let colorData = f.feature;
        if(f.feature.color) colorData = {color: f.feature.color};
        if(f.feature.locations && f.feature.locations[0].fragments[i] && f.feature.locations[0].fragments[i].color) colorData = {color: f.feature.locations[0].fragments[i].color};
        let apiColor = this._getFeatureColor(colorData);
        let lightColor = this.colorMixer(-0.3, apiColor); //lightened by 30%
        return lightColor;
      })
      .on("mouseenter", (f, i) => {
        const self = this;
        const e = d3.event;
  
        const oldToolip = document.querySelectorAll("protvista-tooltip");
        if(oldToolip && oldToolip[0] && oldToolip[0].className == 'click-open'){
          //do nothing
        }else{
          window.setTimeout(function() {
            self.createTooltip(e, f);
          }, 50);
        }
        
        const protvistaPdbs = document.querySelectorAll("protvista-pdb");
        const pdbFirstTracks = Array.from(protvistaPdbs)
          .map(el => el.querySelector("protvista-pdb-track"))
          .filter(Boolean);

        /* This is not the best way to perform this. The event "change"
        already comes from protvista, that listen (`addListeners`) and updates
        each element (`this.protvistaElements` from ProtVistaManager) attributes.
        So in order to update all tracks, we need to fire each event on some track of
        each protvista-pdb instance. Also on 'mouseout'. */
        pdbFirstTracks.forEach(el => el.dispatchEvent(
          new CustomEvent("change", {
            detail: {
              highlightend: f.end,
              highlightstart: f.start
            },
            bubbles: true,
            cancelable: true
          })
        ));

        f.trackIndex = i;
        this.dispatchEvent(
          new CustomEvent("protvista-mouseover", {
            detail: f,
            bubbles: true,
            cancelable: true
          })
        );
      })
      .on("mouseout", () => {
        const self = this;

        const oldToolip = document.querySelectorAll("protvista-tooltip");
        if(oldToolip && oldToolip[0] && oldToolip[0].className == 'click-open'){
          //do nothing
        }else{
          window.setTimeout(function() {
            self.removeAllTooltips();
          }, 50);
        }

        const protvistaPdbs = document.querySelectorAll("protvista-pdb");
        const pdbFirstTracks = Array.from(protvistaPdbs)
          .map(el => el.querySelector("protvista-pdb-track"))
          .filter(Boolean);

        pdbFirstTracks.forEach(el => el.dispatchEvent(
          new CustomEvent("change", {
            detail: {
              highlightend: null,
              highlightstart: null
            },
            bubbles: true,
            cancelable: true
          })
        ));

        this.dispatchEvent(
          new CustomEvent("protvista-mouseout", {
            detail: null,
            bubbles: true,
            cancelable: true
          })
        );
      })
      .on("click", (d, i) => {
        d.trackIndex = i;
        this.createTooltip(d3.event, d, true);
        this.dispatchEvent(
          new CustomEvent("protvista-click", {
            detail: d,
            bubbles: true,
            cancelable: true
          })
        );
        
        this.dispatchEvent(
          new CustomEvent("protvista-unselect", {
            bubbles: true,
            cancelable: true
          })
        );

        this.dispatchEvent(
          new CustomEvent("protvista-highlight-selection", {
            detail: {
              fragment: {
                start: d.start,
                end: d.end,
                color: d.color,
                feature: d.feature
              }
            },
            bubbles: true,
            cancelable: true
          })
        );

        //Remove previous highlight
        const protvistaPdbs = document.querySelectorAll("protvista-pdb");
        const pdbFirstTracks = Array.from(protvistaPdbs)
          .map(el => el.querySelector("protvista-pdb-track"))
          .filter(Boolean);

        pdbFirstTracks.forEach(el => el.dispatchEvent(
          new CustomEvent("change", {
            detail: {
              highlightend: null,
              highlightstart: null
            },
            bubbles: true,
            cancelable: true
          })
        ));
      });
  }

  _getShape(f) {
    if (f.shape) {
      return f.shape;
    } else if (f.feature && f.feature.shape) {
      return f.feature.shape;
    } else if (this._shape) {
      return this._shape;
    } else {
      return "rectangle";
    }
  }

  fireActionEvent(detail) {
    const name = "protvista-pdb.action"
    const ev = new CustomEvent(name, { detail, bubbles: true, cancelable: false });
    this.dispatchEvent(ev);
  }

  createTooltip(e, d, closeable = false) {
    
    this.removeAllTooltips();
    const tooltip = document.createElement("protvista-tooltip");
    
    tooltip.left = e.pageX + 12;
    tooltip.top = e.pageY + 12;
    tooltip.style.marginRight = 32 + 'px';
    tooltip.style.marginLeft = 0;
    tooltip.style.marginTop = 0;
    
    tooltip.title = `${d.feature.type} ${d.start}-${d.end}`;
    // Don't add 'residue' tag when start == end.
    if(d.start == d.end) tooltip.title = `${d.feature.type} ${d.start}`;
    tooltip.closeable = closeable;

    // Passing the content as a property as it can contain HTML
    tooltip.content = d.feature.tooltipContent;
    if(d.tooltipContent) tooltip.content = d.tooltipContent;
    if(e.type == 'click') tooltip.classList.add("click-open");
    document.body.appendChild(tooltip);

    const toolTipEl = d3.select(tooltip).node();
    const tooltipDom = toolTipEl.getBoundingClientRect();
    const bottomSpace = window.innerHeight - e.clientY;
    const rightSpace = document.documentElement.clientWidth - e.clientX; //not window.innerWidth in order to remove possible scrollbars
    
    if (toolTipEl) {
      const button = toolTipEl.querySelector("[data-start]");
      if (button) button.addEventListener("click", () => {
        this.fireActionEvent({ type: "showDialog", start: button.dataset.start, end: button.dataset.end });
        this.removeAllTooltips();
      })
    }

    if (bottomSpace < tooltipDom.height) {
      toolTipEl.style.top = e.pageY - (tooltipDom.height + 8) + 'px';
    }

    if (rightSpace < tooltipDom.width) {
      toolTipEl.style.left = '';
      toolTipEl.style.right = (rightSpace - 12) + 'px';
    }
  }

  //Reference - https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)#stackoverflow-archive-begin
  colorMixer(p,c0,c1,l){
    let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
    if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
    if(!this.pSBCr)this.pSBCr=(d)=>{
      let n=d.length,x={};
      if(n>9){
        [r,g,b,a]=d=d.split(","),n=d.length;
        if(n<3||n>4)return null;
        x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
      }else{
        if(n==8||n==6||n<4)return null;
        if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
        d=i(d.slice(1),16);
        if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
        else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
      }return x};
    h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
    if(!f||!t)return null;
    if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
    else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
    a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
    if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
    else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
  }

  _updateHighlight() {
    super._updateHighlight();

    // this._highlightintervals -> ":10-20,50-60,110-200"
    const intervalsString = (this._highlightintervals || "").split(":")[1] || "";

    const intervals = intervalsString.split(",").filter(Boolean).map(ns => {
      const [start, end] = ns.split("-").map(s => parseInt(s));
      return { start, end };
    })

    if (!this.highlightedIntervals) return;

    const selection = this.highlightedIntervals
      .selectAll("rect.hi")
      .data(intervals)

    selection.exit().remove()

    selection.enter()
      .append("rect")
      .merge(selection)
      .attr("class", "hi")
      .attr("fill", "rgba(255, 145, 0, 0.8)")
      .attr('stroke', 'black')
      .attr("height", this._height)
      .attr("x", interval => this.getXFromSeqPosition(interval.start))
      .style("opacity", 0.3)
      .attr("width", interval => this.getSingleBaseWidth() * (interval.end - interval.start + 1))

  }
}

export default ProtvistaPdbTrack;
