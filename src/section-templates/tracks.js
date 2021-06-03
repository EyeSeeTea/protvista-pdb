const { html } = require("lit-html");
import { styleMap } from 'lit-html/directives/style-map.js';

function PDBePvTracksSection(ctx) {
    return html `${ctx.viewerData.tracks.map((trackData, trackIndex) => html`
        <div class="protvistaRow pvTrackRow pvTracks_${trackIndex}">
            <div class="protvistaCol1 category-label" data-label-index="${trackIndex}" @click=${e => ctx.layoutHelper.showSubtracks(trackIndex)} 
            style=${styleMap(trackData.labelColor ? {backgroundColor: trackData.labelColor, borderBottom: '1px solid lightgrey'} : {})}>
                <span class="pvTrackLabel_${trackIndex}"></span>
                <span class="protvistaResetSectionIcon pvResetSection_${trackIndex}" @click=${e => {e.stopPropagation();ctx.layoutHelper.resetSection(trackIndex)}} title="Reset section">
                <i class="icon icon-functional" data-icon="R"></i>
                </span>
                ${help("track-help", trackData.help)}
                ${renderAddButton(ctx, trackData)}
            </div>
            <div class="protvistaCol2 aggregate-track-content" style=${styleMap(trackData.labelColor ? {borderBottom: '1px solid lightgrey'} : {})}>
                <protvista-pdb-track class="pvTrack" length="${ctx.viewerData.length}" layout="${ctx.layoutHelper.getTrackLayout(trackData.overlapping)}" height="${ctx.layoutHelper.getTrackHeight(trackData.length, trackData.overlapping)}"></protvista-pdb-track>
            </div>
        </div>
        <!-- Subtrack Rows Start -->
        <div class="protvistaRowGroup pvSubtracks_${trackIndex}">
            ${trackData.data.map((subtrackData, subtrackIndex) => html`
                <div class="protvistaRow pvSubtrackRow_${trackIndex}_${subtrackIndex}">
                    <div class="protvistaCol1 track-label" style=${styleMap(subtrackData.labelColor ? {backgroundColor: subtrackData.labelColor, borderBottom: '1px solid lightgrey'} : {})}
                    @mouseover=${e => {e.stopPropagation();ctx.layoutHelper.showLabelTooltip(e)}} @mouseout=${e => {e.stopPropagation();ctx.layoutHelper.hideLabelTooltip()}}>
                        <span class="icon icon-functional hideLabelIcon" data-icon="x" @click=${e => {e.stopPropagation();ctx.layoutHelper.hideSubTrack(trackIndex, subtrackIndex)}} 
                        title="Hide this section"></span> 
                        <div class="pvSubtrackLabel_${trackIndex}_${subtrackIndex}" style="word-break: break-all;"></div>

                        <span
                            class="icon icon-functional ${getHighlightClass(ctx, trackIndex, subtrackIndex)}"
                            data-icon="4"
                            @click=${(ev) => highlightSubtrackFragments(ctx, trackIndex, subtrackIndex, subtrackData)}
                            title="Click to highlight all fragments in subtrack"
                        ></span>

                        <span class="icon icon-functional labelZoomIconRight pvZoomIcon_${trackIndex}_${subtrackIndex}" data-icon="1" @click="${e => { ctx.layoutHelper.zoomTrack({start:1, end: null, trackData: subtrackData}, trackIndex+'_'+subtrackIndex); }}
                        title="Click to zoom-out this section"></span>

                        ${subtrackData.labelTooltip ? html`
                            <span class="labelTooltipContent" style="display:none;">${subtrackData.labelTooltip}</span>
                        ` : ``}
                        ${help("subtrack-help", subtrackData.help)}
                    </div>
                    <div class="protvistaCol2 track-content" style=${styleMap(trackData.labelColor ? {borderBottom: '1px solid lightgrey'} : {})}>
                        <protvista-pdb-track class="pvSubtrack_${trackIndex}" length="${ctx.viewerData.length}" layout="${ctx.layoutHelper.getTrackLayout(subtrackData.overlapping)}" height="${ctx.layoutHelper.getTrackHeight(subtrackData.locations.length, subtrackData.overlapping)}"></protvista-pdb-track>
                    </div>
                </div>`
            )}
        </div>
        <!-- Subrack Rows End -->
    `)}`
}

function highlightSubtrackFragments(ctx, trackIndex, subtrackIndex, subtrackData) {
    const buttonEl = ctx.querySelector(`.pvHighlight_${trackIndex}_${subtrackIndex}`);
    const isEnabled = buttonEl ? !buttonEl.classList.contains("enabled") : true;
    ctx.setSubtrackFragmentsSelection({ isEnabled, trackIndex, subtrackIndex, subtrackData })

}

function renderAddButton(ctx, trackData) {
    const actions = trackData.actions || {};
    if (!actions.add) return;

    return html`
        <button
            class="track-action-add"
            title="${actions.add.title}"
            @click=${(ev) => onAddEvent(ctx, trackData, ev)}
        >+</button>
    `;
}

function getHighlightClass(ctx, trackIndex, subtrackIndex) {
    const { highlightedSubtrack } = ctx;
    const isHighlighted = highlightedSubtrack.trackIndex === trackIndex &&
        highlightedSubtrack.subtrackIndex === subtrackIndex;

    const classes = [
        "labelHighlightRight",
        `pvHighlight_${trackIndex}_${subtrackIndex}`,
        isHighlighted ? "enabled" : "",
    ]

    return classes.filter(Boolean).join(" ");
}

function onAddEvent(ctx, trackData, ev) {
    stopEvent(ev);
    ctx.fireActionEvent({ type: "add", trackId: trackData.id });
}

function help(className, message) {
    if (!message) return;

    return html`
        <button
            class="${className}"
            title="${message}"
            @click=${stopEvent}
        >?</button>
    `;
}

function stopEvent(ev) {
    ev.stopPropagation();
}

export default PDBePvTracksSection;
