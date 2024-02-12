const { html } = require("lit-html")

function PDBePvSeqSection(ctx) {
    return html `<div class="protvistaRow">
                    
    <!-- Top Menu Toolbar -->
    <div class="protvistaCol1 protvistaToolbar" style="position:relative; align-items: flex-start; margin-bottom: 8px; padding: 0">

        <!-- View menu -->
        <span class="protvistaToolbarIcon" title="View region" @click=${e => ctx.layoutHelper.toggleViewRangeMenu()}>
            <i class="icon icon-common icon-search-plus"></i>
        </span>
        <div class="viewRangeMenu viewMenuBox" style="display:none">
            <div class="protvistaRangeMenuTitle">
                <div>View region</div>
                <span class="icon icon-functional protvistaMenuClose" data-icon="x" title="Close" @click=${e => { e.stopPropagation(); ctx.layoutHelper.toggleViewRangeMenu() }}></span>
            </div>
            <div class="protvistaForm rangeForm" style="width:170px;">
                <div class="inputs">
                    <div>
                        From
                        <input type="number" class="pvViewRangeMenuStart" value="0" min="1" max="${ctx.viewerData.length}" step="1" />
                    </div>
                    <div>
                        To
                        <input type="number" class="pvViewRangeMenuEnd" value="0" min="1" max="${ctx.viewerData.length}" step="1" />
                    </div>
                </div>
                <button class="button tiny" @click=${e => ctx.layoutHelper.pvViewRangeMenuSubmit()}>Submit</button>
            </div>
        </div>
        <!-- View menu -->
        
        <!-- Highlight menu -->
        <span class="protvistaToolbarIcon highlightToolbarIcon" title="Highlight region" @click=${e => ctx.highlightActive ? ctx.setSubtrackFragmentsSelection({ isEnabled: false }) : ctx.layoutHelper.toggleHighlightRangeMenu() }>
            <i class="icon icon-common icon-star"></i>
        </span>
        <div class="highlightRangeMenu viewMenuBox" style="display:none">
            <div class="protvistaRangeMenuTitle">
                <div>Highlight region</div>
                <span class="icon icon-functional protvistaMenuClose" data-icon="x" title="Close" @click=${e => { e.stopPropagation(); ctx.layoutHelper.toggleHighlightRangeMenu() }}></span>
            </div>
            <div class="protvistaForm rangeForm" style="width:170px;">
                <div class="inputs">
                    <div>
                        From
                        <input type="number" class="pvHighlightRangeMenuStart" value="0" min="1" max="${ctx.viewerData.length}" step="1" />
                    </div>
                    <div>
                        To
                        <input type="number" class="pvHighlightRangeMenuEnd" value="0" min="1" max="${ctx.viewerData.length}" step="1" />
                    </div>
                </div>
                <button class="button tiny" @click=${e => ctx.layoutHelper.pvHighlightRangeMenuSubmit()}>Submit</button>
            </div>
        </div>
        <!-- Highlight menu -->
    </div>

        <!-- Navigation Component -->
        <div class="protvistaCol2 pvSeqSection">
            <protvista-pdb-sequence length="${ctx.viewerData.length}" sequence="${ctx.viewerData.sequence}"></protvista-pdb-sequence>
        </div>

    </div>`
        
}

export default PDBePvSeqSection;