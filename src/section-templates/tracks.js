const { html } = require("lit-html");
import { styleMap } from 'lit-html/directives/style-map.js';

function PDBePvTracksSection(ctx) {
    return html `${ctx.viewerData.tracks.map((trackData, trackIndex) => html`
        <div class="protvistaRow pvTrackRow pvTracks_${trackIndex}">
            <div class="protvistaCol1 category-label" data-label-index="${trackIndex}" @click=${e => ctx.layoutHelper.showSubtracks(trackIndex)} 
            style=${styleMap(trackData.labelColor ? {backgroundColor: trackData.labelColor, borderBottom: '1px solid lightgrey'} : {})}
            title="${trackData.label}: ${trackData.help}">
                <span class="pvTrackLabel_${trackIndex}"></span>
                <span class="protvistaResetSectionIcon pvResetSection_${trackIndex}" @click=${e => {e.stopPropagation();ctx.layoutHelper.resetSection(trackIndex)}} title="Reset section">
                    <i class="icon icon-functional" data-icon="R"></i>
                </span>
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
                    <div class="protvistaCol1 track-label" style=${styleMap(subtrackData.labelColor ? {backgroundColor: subtrackData.labelColor, borderBottom: '1px solid lightgrey'} : {})}>
                        <div class="pvSubtrackLabel_${trackIndex}_${subtrackIndex}" title="${subtrackData.label}"></div>
                        <button type="button" class="more-options" title="Show options" @click=${e => ctx.layoutHelper.openMoreOptions(trackIndex, subtrackIndex)}><i class="icon icon-common icon-ellipsis-h"></i></button>
                        <!--More options menu-->
                        <div class="moreOptionsMenu viewMenuBox moreOptionsMenu_${trackIndex}_${subtrackIndex}" style="display:none">
                            <button type="button" class="more-options-action ${getHighlightClass(ctx, trackIndex, subtrackIndex)}" @click=${(ev) => highlightSubtrackFragments(ev, ctx, trackIndex, subtrackIndex, subtrackData)}>
                                <span class="icon icon-common icon-star"></span>
                                <span>Highlight fragments</span>
                            </button>
                            <button type="button" class="more-options-action pvZoomIcon_${trackIndex}_${subtrackIndex}" @click=${e => { ctx.layoutHelper.zoomTrack({start:1, end: null, trackData: subtrackData}, trackIndex+'_'+subtrackIndex); }}>
                                <span class="icon icon-common icon-search-plus"></span>
                                <span>Zoom in</span>
                            </button>
                            ${subtrackData.help ? html`<button type="button" class="more-options-action infoAction_${trackIndex}_${subtrackIndex}" @click=${e => ctx.layoutHelper.showInfoTooltip(trackIndex, subtrackIndex)}>
                                <span class="icon icon-common icon-info"></span>
                                More info
                            </button>` : ""}
                            <button type="button" class="more-options-action" @click=${e => {e.stopPropagation();ctx.layoutHelper.hideSubTrack(trackIndex, subtrackIndex)}}>
                                <span class="icon icon-common icon-eye-slash"></span>
                                Hide
                            </button>
                        </div>
                        <!--More options menu end-->
                        <!--Info tooltip-->
                            <div class="infoTooltip viewMenuBox infoTooltip_${trackIndex}_${subtrackIndex}">
                                <div class="info-header"><span class="title">${subtrackData.label}</span><span class="icon icon-common icon-close" title="Close" @click=${e => ctx.layoutHelper.hideInfoTooltips()}></span></div>
                                ${subtrackData.help}
                            </div>
                        <!--Info tooltip end-->
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

function highlightSubtrackFragments(ev, ctx, trackIndex, subtrackIndex, subtrackData) {
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

function stopEvent(ev) {
    ev.stopPropagation();
}

export default PDBePvTracksSection;
