const { html } = require("lit-html")

function PDBePvSeqSection(ctx) {
    return html `<div class="protvistaRow">
                    
    <!-- Top Menu Toolbar -->
    <div class="protvistaCol1 protvistaToolbar" style="position:relative; align-items: flex-start; margin-bottom: 8px; padding: 0">

        <!-- View menu -->
        <span class="protvistaToolbarIcon" title="View region" @click=${e => ctx.layoutHelper.openViewRangeMenu()}>
            <i class="icon icon-common icon-search-plus"></i>
        </span>
        <div class="viewRangeMenu viewMenuBox" style="display:none">
            <div class="protvistaRangeMenuTitle">
                <div>View region</div>
                <span class="icon icon-functional protvistaMenuClose" data-icon="x" title="Close" @click=${e => { e.stopPropagation(); ctx.layoutHelper.openViewRangeMenu() }}></span>
            </div>
            <div class="protvistaForm rangeForm" style="width:170px;">
                <div style="float:left;width:48%;">
                    From <br>
                    <input type="number" class="pvViewRangeMenuStart" value="0" style="display:inline-block;margin:0;" min="1" max="${ctx.viewerData.length}" step="1" />
                </div>
                <div style="float:right;width:48%;">
                    To <br>
                    <input type="number" class="pvViewRangeMenuEnd" value="0" style="display:inline-block;margin:0;" min="1" max="${ctx.viewerData.length}" step="1" /> <br><br>
                </div>                         
                <button class="button tiny" style="margin:1em 0 0; letter-spacing: 1px;" @click=${e => ctx.layoutHelper.pvViewRangeMenuSubmit()}>Submit</button>
            </div>
        </div>
        <!-- View menu -->
        
        <!-- Highlight menu -->
        <span class="protvistaToolbarIcon" title="Highlight region" @click=${e => ctx.layoutHelper.openHighlightRangeMenu()}>
            <i class="icon icon-common icon-star"></i>
        </span>
        <div class="highlightRangeMenu viewMenuBox" style="display:none">
            <div class="protvistaRangeMenuTitle">
                <div>Highlight region</div>
                <span class="icon icon-functional protvistaMenuClose" data-icon="x" title="Close" @click=${e => { e.stopPropagation(); ctx.layoutHelper.openHighlightRangeMenu() }}></span>
            </div>
            <div class="protvistaForm rangeForm" style="width:170px;">
                <div style="float:left;width:48%;">
                    From <br>
                    <input type="number" class="pvHighlightRangeMenuStart" value="0" style="display:inline-block;margin:0;" min="1" max="${ctx.viewerData.length}" step="1" />
                </div>
                <div style="float:right;width:48%;">
                    To <br>
                    <input type="number" class="pvHighlightRangeMenuEnd" value="0" style="display:inline-block;margin:0;" min="1" max="${ctx.viewerData.length}" step="1" /> <br><br>
                </div>                              
                <button class="button tiny" style="margin:1em 0 0; letter-spacing: 1px;" @click=${e => ctx.layoutHelper.pvHighlightRangeMenuSubmit()}>Submit</button>
            </div>
        </div>
        <!-- Highlight menu -->
    </div>

        <!-- Navigation Component -->
        <div class="protvistaCol2 pvSeqSection">
            <protvista-sequence length="${ctx.viewerData.length}" sequence="${ctx.viewerData.sequence}"></protvista-sequence>
        </div>

    </div>`
        
}

export default PDBePvSeqSection;