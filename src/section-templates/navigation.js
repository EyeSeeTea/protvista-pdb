const { html } = require("lit-html")

function PDBePvNavSection(ctx) {
    return html `<div class="protvistaRow">

        <!-- Top Menu Toolbar -->
        <div class="protvistaCol1 protvistaToolbar" style="position:relative; padding: 0">
            <span class="protvistaToolbarIcon" @click=${e => ctx.layoutHelper.resetView()} title="Reset view">
                <i class="icon icon-common icon-history"></i>
            </span>

            <!-- Track categories settings menu -->
            <span class="protvistaToolbarIcon" title="Hide sections" @click=${e => ctx.layoutHelper.toggleCategorySettingsMenu()}>
                <i class="icon icon-common icon-eye-slash"></i>
            </span>
            <div class="settingsMenu viewMenuBox" style="display:none">
                <div class="protvistaRangeMenuTitle">
                    <div>Hide sections</div>
                    <span class="icon icon-functional protvistaMenuClose" data-icon="x" title="Close" @click=${e => { e.stopPropagation(); ctx.layoutHelper.toggleCategorySettingsMenu() }}></span>
                </div>
                <div class="protvistaForm rangeForm" style="width:215px;max-height:400px;">
                    <table style="font-size:inherit;margin-bottom:0" class="pvHideOptionsTable">
                        <tbody>
                        ${ctx.viewerData.tracks.map((trackData, trackIndex) => html`
                            <tr>
                            <td style="width:10%;vertical-align:top;">
                                <input type="checkbox" class="pvSectionChkBox" name="cb_${trackIndex}" style="margin:0" />
                            </td>
                            <td style="padding-bottom:5px;">
                                ${trackData.label}
                            </td>
                            </tr>
                        `)}
                        <tr style="display:none" class="scOption"></tr>
                        <tr style="display:none" class="variationOption"></tr>
                        </tbody>
                    </table>
                    <button class="button tiny" @click=${e => ctx.layoutHelper.pvCategorySettingsMenuSubmit()}>Submit</button>
                </div>
            </div>
            <!-- Track categories settings menu -->
        </div>

        <!-- Navigation Component -->
        <div class="protvistaCol2 pvNavSection">
            <protvista-pdb-navigation length="${ctx.viewerData.length}" offset="${ctx.viewerData.offset}" ></protvista-pdb-navigation>
        </div>

    </div>`
        
}

export default PDBePvNavSection;