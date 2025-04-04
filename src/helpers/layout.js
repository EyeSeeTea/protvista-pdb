import flatten from "lodash-es/flatten"

class LayoutHelper {

    constructor(ctx) {
        this.ctx = ctx;
        this.handlers = [];
    }

    postProcessLayout() {
        this.getScrollbarWidth(); // get scrollbar width for right spacing

        // apply padding according to the scollbar width to align tracks with scrollbar
        let navSectionEle = this.ctx.querySelectorAll('.pvNavSection')[0];
        if(navSectionEle){ 
            navSectionEle.style.paddingRight = this.ctx.scrollbarWidth+'px';
            setTimeout(() => {
                let navEle = this.ctx.querySelectorAll('protvista-navigation')[0];
                if(navEle) navEle.firstElementChild.firstElementChild.style.width = '100%';
            },100);
        }
        
        let seqSectionEle = this.ctx.querySelectorAll('.pvSeqSection')[0];
        if(seqSectionEle){ 
            seqSectionEle.style.paddingRight = this.ctx.scrollbarWidth+'px';
            setTimeout(() => {
                let seqEle = this.ctx.querySelectorAll('protvista-sequence')[0];
                if (seqEle && seqEle.firstElementChild && seqEle.firstElementChild.firstElementChild) seqEle.firstElementChild.firstElementChild.style.width = '100%';
            },100);
        }

        let pvLineGraphSectionEle = this.ctx.querySelectorAll('.pvLineGraphSection')[0];
        if(pvLineGraphSectionEle){ 
            pvLineGraphSectionEle.style.paddingRight = this.ctx.scrollbarWidth+'px';
        }

        // bind track data and trigger track render
        this.bindTrackData('track', undefined, this.ctx.scrollbarWidth);

        // lazyload variants
        if(this.ctx.viewerData.displayVariants){
            if(this.ctx.viewerData.variants) {
                const hideSectionOptions = { key: 'variationOption', index: this.ctx.viewerData.tracks.length + 1, label: 'Variation' };
                this.addDynamicTrackSection(this.ctx.viewerData.variants, '.pvVariantGraphRow', '.pvVariantGraphSection', '.pvVariantPlotSection', hideSectionOptions);
            } else { 
                this.ctx.dataHelper.getPDBeApiDataByName('variation').then(resultData => {
                    const hideSectionOptions = { key: 'variationOption', index: this.ctx.viewerData.tracks.length + 1, label: 'Variation' };
                    this.addDynamicTrackSection(resultData, '.pvVariantGraphRow', '.pvVariantGraphSection', '.pvVariantPlotSection', hideSectionOptions);
                });
            }
        }

        // lazyload sequence conservation
        if(this.ctx.viewerData.displayConservation){
            if(this.ctx.viewerData.sequenceConservation) {
                const hideSectionOptions = { key: 'scOption', index: this.ctx.viewerData.tracks.length, label: 'Sequence conservation' };
                this.addDynamicTrackSection(this.ctx.viewerData.sequenceConservation, '.pvConsHistoRow', '.pvConservationHistoSection', '.pvConservationPlotSection', hideSectionOptions, true);
            } else {
                this.ctx.dataHelper.getPDBeApiDataByName('sequence_conservation').then(resultData => {
                    const hideSectionOptions = { key: 'scOption', index: this.ctx.viewerData.tracks.length, label: 'Sequence conservation' };
                    this.addDynamicTrackSection(resultData, '.pvConsHistoRow', '.pvConservationHistoSection', '.pvConservationPlotSection', hideSectionOptions, true);
                });
            }
        }

        // subscribe to other PDBe web-component events
        if(this.ctx.subscribeEvents) this.addEventSubscription();
    }

    addDynamicTrackSection(resultData, rowClass, aggregatedTrackClass, trackClass, sectionOptions, borderBottom) {
        if(resultData && Object.keys(resultData).length > 0){
            this.ctx.querySelector(rowClass).style.display = 'flex';
            let trackSectionEle = this.ctx.querySelectorAll(aggregatedTrackClass)[0];
            if(trackSectionEle){ 
                trackSectionEle.style.paddingRight = this.ctx.scrollbarWidth+'px';
                if(borderBottom) trackSectionEle.style.borderBottom = '1px solid lightgrey';
                trackSectionEle.firstElementChild.data = resultData;
            }

            let trackEle = this.ctx.querySelectorAll(trackClass)[0];
            if(trackEle){ 
                trackEle.style.paddingRight = this.ctx.scrollbarWidth+'px';
                if(borderBottom) trackEle.style.borderBottom = '1px solid lightgrey';
                trackEle.firstElementChild.data = resultData;
            }

            this.addHideOptions(sectionOptions.key, sectionOptions.index, sectionOptions.label);
        }
    }

    getScrollbarWidth() {
        let divWithScroll = this.ctx.querySelectorAll('.divWithScroll')[0];
        let divWithoutScroll = this.ctx.querySelectorAll('.divWithoutScroll')[0];
        this.ctx.scrollbarWidth = (divWithoutScroll.clientWidth - divWithScroll.clientWidth);

        divWithScroll.remove();
        divWithoutScroll.remove();
    }

    getTrackLayout(isOverlapping){
        let layout = isOverlapping ? 'overlapping' : 'non-overlapping';
        return layout
    }

    getTrackHeight(trackDataLength, isOverlapping){
        let eleHt = (trackDataLength > 2) ? 74 : 44
        return eleHt;
    }

    showSubtracks(trackIndex){
        let subTrackEle = this.ctx.querySelectorAll('.pvSubtracks_'+trackIndex)[0];
        let trackEle = this.ctx.querySelectorAll('.pvTracks_'+trackIndex)[0];
        if(trackEle.classList.contains('expanded')){
            subTrackEle.style.display = 'none';
            trackEle.querySelectorAll('.pvTrack')[0].style.display = 'block';
            trackEle.classList.remove('expanded');
        }else{
            trackEle.querySelectorAll('.pvTrack')[0].style.display = 'none';
            subTrackEle.style.display = 'block';
            if(this.ctx.formattedSubTracks.indexOf(trackIndex) == -1){
                this.bindTrackData('subtrack', trackIndex, this.ctx.scrollbarWidth);
                this.ctx.formattedSubTracks.push(trackIndex);
            }
            trackEle.classList.add('expanded');
        }
    }

    hideSubtracks(trackIndex){
        this.ctx.querySelectorAll('.pvSubtracks_'+trackIndex)[0].style.display = 'none';
        this.ctx.querySelectorAll('.pvTracks_'+trackIndex)[0].style.display = 'flex';
    }

    addHideOptions(optionClass, tIndex, label){
        let optionEle = this.ctx.querySelector('.'+optionClass);
        optionEle.innerHTML =`<tr>
            <td style="width:10%;vertical-align:top;"><input type="checkbox" class="pvSectionChkBox" name="cb_${tIndex}" style="margin:0" /></td>
            <td style="padding-bottom:5px;">${label}</td>
        </tr>`;
        optionEle.style.display = "flex";
    }

    handleExtEvents(e){
        if(typeof e.eventData !== 'undefined' && typeof e.eventData.residueNumber !== 'undefined'){
            let protvistaParam = {start: e.eventData.residueNumber, end: e.eventData.residueNumber, highlight: true};
            this.resetZoom(protvistaParam);
        }
    }

    bindTrackData(type, mainTrackIndex, scrollbarWidthVal){
        let trackSelector = '.pvTrack';
        if(type == 'subtrack') trackSelector = '.pvSubtrack_'+mainTrackIndex;
    
        let trackEles = this.ctx.querySelectorAll(trackSelector);
        if(trackEles && trackEles.length > 0){
          trackEles.forEach((trackEle, trackIndex) => {

            let trackModel = this.ctx.viewerData.tracks[trackIndex];
            let labelSelector = '.pvTrackLabel_'+trackIndex;
            if(type == 'subtrack'){ 
                labelSelector = '.pvSubtrackLabel_'+mainTrackIndex+'_'+trackIndex;
                trackModel = this.ctx.viewerData.tracks[mainTrackIndex].data[trackIndex];
            }

            //Add label
            let labelDetails = this.getLabel(trackModel.labelType, trackModel.label);
            let labelEle = this.ctx.querySelectorAll(labelSelector)[0];
            labelEle.innerHTML = labelDetails;

            let transform = '';
            let trackData = trackModel.data;
            if(type == 'subtrack'){
              trackData = [trackModel];
              transform = 'transform:translate(0px,-5px)'
            }

            if(type == 'subtrack'){
                const subtrackData = flatten(
                    trackData
                        .map((subtrack) => subtrack.locations
                        .map((location, idx) => ({
                            ...subtrack,
                            accession: subtrack.accession + "-" + idx,
                            locations: [location],
                        })))
                );
                trackEle.data = subtrackData;

                if(this.ctx.viewerData.tracks[mainTrackIndex].data.length > 4){
                    trackEle.parentNode.style.paddingRight = '0px';
                }else{
                    trackEle.parentNode.style.paddingRight = scrollbarWidthVal+'px';
                }
            }else{
                const trackDataFlatten = trackData
                    .map((track) => ({
                        ...track,
                        locations: [
                            { fragments: flatten(track.locations.map(loc => loc.fragments)) }
                        ]})
                    )
                trackEle.data = trackDataFlatten;
                trackEle.parentNode.style.paddingRight = scrollbarWidthVal+'px';
            }
    
            const { expandFirstTrack = true } = this.ctx.viewerData;

            if(type == 'track' && trackIndex == 0 && expandFirstTrack){
              this.ctx.querySelectorAll('.pvTracks_0')[0].classList.add("expanded");
              this.ctx.querySelectorAll('.pvTracks_0')[0].querySelectorAll('.pvTrack')[0].style.display = 'none';
              this.ctx.querySelectorAll('.pvSubtracks_0')[0].style.display = 'block';
              this.bindTrackData('subtrack', 0, scrollbarWidthVal);
              this.ctx.formattedSubTracks.push(trackIndex);
            }
    
          });
        }
        
    }

    getLabel(type, value) {
        if (type !== 'pdbIcons') {
            return value;
        } else {
          let iconCode = {
            'experiments': {class: 'icon icon-generic', dataIcon: ';'},
            'complex': {class: 'icon icon-conceptual', dataIcon: 'y'},
            'nucleicAcids': {class: 'icon icon-conceptual', dataIcon: 'd'},
            'ligands': {class: 'icon icon-conceptual', dataIcon: 'b'},
            'literature': {class: 'icon icon-generic', dataIcon: 'P'}
          };
          let labelElements = [];
          labelElements.push('<strong><a class="pdbIconsId" href="' + value.url + '" target="_blank">' + value.id + '</a></strong><span class="pdbIconsWrapper">');
          value.icons.forEach(iconData => {
    
            let rotateClass = '';
            if (iconData.type == 'nucleicAcids') rotateClass = '';//rotateClass = ' rotate';
    
            let iconHtml = '<span class="pdbIconslogo" style="background-color:' + iconData.background + '" title="' + iconData.tooltipContent + '" ><i class="' + iconCode[iconData.type].class + '" data-icon="' + iconCode[iconData.type].dataIcon + '" style="color: #fff;"></i></span>';
            if (typeof iconData.url != 'undefined' && iconData.url != '') iconHtml = '<a class="pdbIconslogoA" href="' + iconData.url + '" target="_blank">' + iconHtml + '</a>';
            labelElements.push(iconHtml);
          });
    
          if (value.resolution) labelElements.push('<strong style="color:#555">' + value.resolution + '&Aring;</strong></span>');
          return labelElements.join(' ');
        }
    }

    resetSection(trackIndex){
        this.ctx.querySelector(`.pvResetSection_${trackIndex}`).style.display = 'none';
        this.ctx.hiddenSubtracks[trackIndex].forEach((subtrackIndex) => {
            this.ctx.querySelector(`.pvSubtrackRow_${trackIndex}_${subtrackIndex}`).style.display = 'flex';
        });
        delete this.ctx.hiddenSubtracks[trackIndex];
    }

    hideSection(trackIndex){

        let totalTracks = this.ctx.viewerData.tracks.length;
        let trackClasses = [];
        if(trackIndex < totalTracks){
            trackClasses.push(`.pvTracks_${trackIndex}`, `.pvSubtracks_${trackIndex}`);
        }else{
            if(trackIndex == totalTracks){
                trackClasses.push(`.pvConsHistoRow`, `.pvConservationPlotRow`);
            }else{
                trackClasses.push(`.pvVariantGraphRow`, `.pvVariantPlotRow`);
            }
        }

        for(let trackClass of trackClasses) {
            let trackEle = this.ctx.querySelector(trackClass);
            if(trackEle) trackEle.style.display = 'none';
        }

        this.ctx.hiddenSections.push(trackIndex);
    }

    showSection(trackIndex){

        let totalTracks = this.ctx.viewerData.tracks.length;
        if(trackIndex < totalTracks){
            let pvTracksEle = this.ctx.querySelector(`.pvTracks_${trackIndex}`);
            pvTracksEle.style.display = 'flex';

            if(pvTracksEle.classList.contains('expanded')){
                let pvSbTrkEle = this.ctx.querySelector(`.pvSubtracks_${trackIndex}`);
                pvSbTrkEle.style.display = 'block';
                if(typeof this.ctx.hiddenSubtracks[trackIndex] != 'undefined' && this.ctx.hiddenSubtracks[trackIndex].length == pvSbTrkEle.children.length){
                    this.resetSection(trackIndex);
                }
            }
        }else{

            if(trackIndex == totalTracks){
                let consHistoSectionEle = this.ctx.querySelector('.pvConsHistoRow');
                if(consHistoSectionEle) consHistoSectionEle.style.display = 'flex';

                if(consHistoSectionEle.classList.contains('expanded')){
                    let pvConservationPlotSectionEle = this.ctx.querySelector('.pvConservationPlotRow');
                    if(pvConservationPlotSectionEle) pvConservationPlotSectionEle.style.display = 'block';
                }
            }else{
                let variantGraphSectionEle = this.ctx.querySelector('.pvVariantGraphRow');
                if(variantGraphSectionEle) variantGraphSectionEle.style.display = 'flex';
                if(variantGraphSectionEle.classList.contains('expanded')){
                    let pvVariantPlotSectionEle = this.ctx.querySelector('.pvVariantPlotRow');
                    if(pvVariantPlotSectionEle) pvVariantPlotSectionEle.style.display = 'block';
                }
            }

        }

        this.ctx.hiddenSections.splice(this.ctx.hiddenSections.indexOf(trackIndex),1);
    
    }

    hideSubTrack(trackIndex, subtrackIndex){

        //Add subtrack index details
        if(typeof this.ctx.hiddenSubtracks[trackIndex] == 'undefined'){
            this.ctx.hiddenSubtracks[trackIndex] = [subtrackIndex];
        }else{
            this.ctx.hiddenSubtracks[trackIndex].push(subtrackIndex);
        }

        //hide dom
        this.ctx.querySelector(`.pvSubtrackRow_${trackIndex}_${subtrackIndex}`).style.display = 'none';
        this.ctx.querySelector(`.pvResetSection_${trackIndex}`).style.display = 'inline-block';
        
        if(this.ctx.hiddenSubtracks[trackIndex].length == this.ctx.viewerData.tracks[trackIndex].data.length){
            this.hideSection(trackIndex);
        }
    }

    resetZoom(param){
        let currentStartVal = null;
        let currentEndVal = null;
        let navEle = this.ctx.querySelectorAll('.pvTrack')[0];
        if (!navEle) return;
        
        if(typeof param === 'undefined'){
          currentStartVal = navEle.getAttribute('displaystart');
          currentEndVal = navEle.getAttribute('displayend');
        }else if(typeof param.trackData != 'undefined'){
          if(param.trackData.start && param.trackData.end){
            currentStartVal = param.trackData.start;
            currentEndVal = param.trackData.end;
          }else if(param.trackData.locations && param.trackData.locations.length > 0){
            currentStartVal = param.trackData.locations[0].fragments[0].start;
            let lastLocationIndex = param.trackData.locations.length - 1;
            let lastFragmentIndex = param.trackData.locations[lastLocationIndex].fragments.length - 1;
            currentEndVal = param.trackData.locations[lastLocationIndex].fragments[lastFragmentIndex].end;
          }
        }else{
          currentStartVal = param.start;
          currentEndVal = param.end;
        }
      
        if(param && param.start == null && param.end == null){

        }else{
            if (currentStartVal == null) currentStartVal = '1';
            if (currentEndVal == null) currentEndVal = this.ctx.viewerData.length;
        }
    
        if(typeof param !== 'undefined' && typeof param.highlight !== 'undefined' && param.highlight){
            navEle.dispatchEvent(new CustomEvent('change', {
                detail: {
                    highlightstart: currentStartVal,
                    highlightend: currentEndVal
                }, bubbles: true, cancelable: true
            }));


        } else {

            // set displaystart and displayend
            navEle.dispatchEvent(new CustomEvent('change', {
                detail: {
                    displaystart: currentStartVal,
                    displayend: currentEndVal
                }, bubbles: true, cancelable: true
            }));

            // remove highlights
            navEle.dispatchEvent(new CustomEvent('change', {
                detail: {
                    highlightstart: null,
                    highlightend: null
                }, bubbles: true, cancelable: true
            }));

        }
        
    }

    zoomTrack(data, currentZoomTrack) {
        const changeIcon = (el, zoom) => {
            if (zoom) el.classList.add('active');
            else el.classList.remove('active');
            const icon = el.children[0];
            const text = el.children[1];
            if (icon && text) {
                icon.classList.add(zoom ? "icon-search-minus" : "icon-search-plus");
                icon.classList.remove(zoom ? "icon-search-plus" : "icon-search-minus");
                text.innerText = zoom ? "Zoom out" : "Zoom in";
            }
        }

        if (this.ctx.zoomedTrack != '')
            changeIcon(this.ctx.querySelector('.pvZoomIcon_' + this.ctx.zoomedTrack), false);

        if (this.ctx.zoomedTrack != currentZoomTrack) {
            changeIcon(this.ctx.querySelector('.pvZoomIcon_' + currentZoomTrack), true);
            this.ctx.zoomedTrack = currentZoomTrack;
            this.resetZoom(data);
        } else {
            this.ctx.zoomedTrack = '';
            this.resetZoom({ start: 1, end: null });
        }
    }

    hideTooltips() {
        this.ctx.querySelector('.settingsMenu').style.display = 'none';
        this.ctx.querySelector('.viewRangeMenu').style.display = 'none';
        this.ctx.querySelector('.highlightRangeMenu').style.display = 'none';
        [...this.ctx.querySelectorAll('.moreOptionsMenu')].forEach(m => m.style.display = 'none');
        [...this.ctx.querySelectorAll('.infoTooltip')].forEach(m => m.style.display = 'none');
    }

    resetView() {

        //Close open menus
        this.hideTooltips();

        //Reset zoom
        if(this.ctx.zoomedTrack != ''){
            let prevZoomIconEle = this.ctx.querySelector('.pvZoomIcon_'+this.ctx.zoomedTrack);
            prevZoomIconEle.classList.remove('active');
        }

        this.ctx.zoomedTrack = '';
        this.resetZoom({start:1, end: null});

        //Reset expanded tracks
        this.ctx.querySelectorAll(`.expanded`).forEach(trackSection => {
            trackSection.classList.remove('expanded');
            let expTrackEle = trackSection.querySelector(`.pvTrack`);
            if(expTrackEle) expTrackEle.style.display = 'block';
        });
        let firstTrackSection = this.ctx.querySelector(`.pvTracks_0`);
        firstTrackSection.style.display = 'flex';
        // if(!firstTrackSection.classList.contains('expanded')) firstTrackSection.classList.add('expanded');
        // firstTrackSection.querySelector(`.pvTrack`).style.display = 'none';
        this.ctx.querySelectorAll(`.protvistaRowGroup`).forEach((trackSubSection, subSectionIndex) => {
            trackSubSection.style.display = 'none';
            //Reset hidden subtracks
            if(typeof this.ctx.hiddenSubtracks[subSectionIndex] != 'undefined') this.resetSection(subSectionIndex);
        });
        // this.ctx.querySelector(`.pvSubtracks_0`).style.display = 'block';
        this.ctx.querySelector(`.pvResetSection_0`).style.display = 'none';

        let variantTrackEle = this.ctx.querySelector(".pvVariantPlotRow");
        if(variantTrackEle) variantTrackEle.style.display = 'none';
        let seqConTrackEle = this.ctx.querySelector(`.pvConservationPlotRow`);
        if(seqConTrackEle) seqConTrackEle.style.display = 'none';
        
        //Display hidden sections
        if(this.ctx.hiddenSections.length > 0){
            let totalTracks = this.ctx.viewerData.tracks.length;
            this.ctx.hiddenSections.forEach(trackIndex => {

                if(trackIndex > 0 && trackIndex < totalTracks){
                    let trackSection = this.ctx.querySelector(`.pvTracks_${trackIndex}`);
                    trackSection.style.display = 'flex';
                    if(trackSection.classList.contains('expanded')) trackSection.classList.remove('expanded');
                    trackSection.querySelector(`.pvTrack`).style.display = 'block';
                }else if(trackIndex >= totalTracks){

                    if(trackIndex == totalTracks){

                        let consHistoSectionEle = this.ctx.querySelector('.pvConsHistoRow');
                        if(consHistoSectionEle) consHistoSectionEle.style.display = 'flex';
        
                        if(consHistoSectionEle.classList.contains('expanded')) consHistoSectionEle.classList.remove('expanded');
                        let pvConservationPlotSectionEle = this.ctx.querySelector('.pvConservationPlotRow');
                        if(pvConservationPlotSectionEle) pvConservationPlotSectionEle.style.display = 'none';
                        
        
                    }else{
        
                        let variantGraphSectionEle = this.ctx.querySelector('.pvVariantGraphRow');
                        if(variantGraphSectionEle) variantGraphSectionEle.style.display = 'flex';
        
                        if(variantGraphSectionEle.classList.contains('expanded')) variantGraphSectionEle.classList.remove('expanded');
                        let pvVariantPlotSectionEle = this.ctx.querySelector('.pvVariantPlotRow');
                        if(pvVariantPlotSectionEle) pvVariantPlotSectionEle.style.display = 'none';
                        
        
                    }
                }

            });

        }

        this.ctx.hiddenSections = [];
        this.ctx.hiddenSubtracks = Object.assign({},{});
          
        this.ctx.setSubtrackFragmentsSelection({ isEnabled: false });
    }

    toggleTooltip(className, top, callback) {
        const menu = this.ctx.querySelector(className);
        const isHidden = menu.style.display == 'none';
        //Close all open menus
        this.hideTooltips();
        if (isHidden) {
            const actionSource = menu.previousElementSibling.getBoundingClientRect();
            menu.style.left = (actionSource.x + actionSource.width + 16) + 'px';
            menu.style.top = (actionSource.y + top) + 'px';
            menu.style.display = 'block';
            if (callback) callback(menu, this.ctx);
            return { state: "visible" };
        } else {
            menu.style.display = 'none';
            return { state: "hidden" };
        }
    }

    rangeMenu(startEl, endEl) {
        return function rangeMenu(_menu, ctx) {
            if (startEl.value == 0 || endEl.value == 0) {
                let currentStartVal = 1;
                let currentEndVal = ctx.viewerData.length;

                let navEle = ctx.querySelectorAll('.pvTrack')[0];
                if (navEle) {
                    currentStartVal = navEle.getAttribute('displaystart');
                    currentEndVal = navEle.getAttribute('displayend');
                }

                startEl.value = parseInt(currentStartVal);
                endEl.value = parseInt(currentEndVal);
            }
        }
    }    

    toggleViewRangeMenu() {
        let startEl = this.ctx.querySelector('.pvViewRangeMenuStart');
        let endEl = this.ctx.querySelector('.pvViewRangeMenuEnd');
        this.toggleTooltip(".viewRangeMenu", -16, this.rangeMenu(startEl, endEl));
    }

    toggleHighlightRangeMenu() {
        let startEl = this.ctx.querySelector('.pvHighlightRangeMenuStart');
        let endEl = this.ctx.querySelector('.pvHighlightRangeMenuEnd');
        this.toggleTooltip(".highlightRangeMenu", -16, this.rangeMenu(startEl, endEl));
    }

    submitRangeMenu(start, end, callback) {
        if (start != '' && end != '') {
            start = parseInt(start);
            end = parseInt(end);
            if (end >= start) {
                if (end > this.ctx.viewerData.length) {
                    end = this.ctx.viewerData.length;
                }

                callback(start, end);
            }
        }
    }

    pvViewRangeMenuSubmit() {
        let startVal = this.ctx.querySelector('.pvViewRangeMenuStart').value;
        let endVal = this.ctx.querySelector('.pvViewRangeMenuEnd').value;
        this.submitRangeMenu(startVal, endVal, (start, end) => {
            let resetParam = { start: parseInt(start), end: parseInt(end), highlight: false }
            this.resetZoom(resetParam);
            this.toggleViewRangeMenu();
        });
    }

    pvHighlightRangeMenuSubmit() {
        let startVal = this.ctx.querySelector('.pvHighlightRangeMenuStart').value;
        let endVal = this.ctx.querySelector('.pvHighlightRangeMenuEnd').value;
        this.submitRangeMenu(startVal, endVal, (start, end) => {
            const fragment = { start: parseInt(start), end: parseInt(end), feature: { bestChainId: this.ctx.chainId } }
            document.dispatchEvent(
                new CustomEvent("protvista-click", {
                    detail: fragment,
                    bubbles: true,
                    cancelable: true
                })
            );

            this.ctx.setSubtrackFragmentsSelection({ isEnabled: true, fragment });
            this.toggleHighlightRangeMenu();
        });
    }

    toggleMoreOptions(trackIndex, subtrackIndex) {
        this.toggleTooltip(`.moreOptionsMenu_${trackIndex}_${subtrackIndex}`, -16);
    }

    showInfoTooltip(trackIndex, subtrackIndex) {
        const tooltipBox = this.ctx.querySelector(`.infoTooltip_${trackIndex}_${subtrackIndex}`);
        const { x, y } = this.ctx.querySelector(`.infoAction_${trackIndex}_${subtrackIndex}`).getBoundingClientRect();
        //hide after retrieving the position of the action source
        this.hideTooltips();
        tooltipBox.style.left = (x + 24) + 'px';
        tooltipBox.style.top = (y + -32) + 'px';
        tooltipBox.style.display = 'block';
    }

    toggleCategorySettingsMenu() {
        function settingsMenu(menu, ctx) {
            menu.querySelectorAll('.pvSectionChkBox').forEach((chkBox, chkBoxIndex) => {
                chkBox.checked = ctx.hiddenSections.indexOf(chkBoxIndex) > -1;
            });
        }

        this.toggleTooltip(".settingsMenu", -16, settingsMenu);
    }

    pvCategorySettingsMenuSubmit(){
        this.ctx.querySelectorAll('.pvSectionChkBox').forEach((chkBox, chkBoxIndex) => {
            if(chkBox.checked){
                if(this.ctx.hiddenSections.indexOf(chkBoxIndex) == -1){
                    this.hideSection(chkBoxIndex);
                }
            }else{
                if(this.ctx.hiddenSections.indexOf(chkBoxIndex) > -1){
                    this.showSection(chkBoxIndex);
                } 
            }
        });

        this.toggleCategorySettingsMenu();
    }

    showVariantPlot(){
        let variantPlotRowEle = this.ctx.querySelector(".pvVariantPlotRow");
        if(variantPlotRowEle.style.display == "none"){
            variantPlotRowEle.style.display = "block";
            variantPlotRowEle.previousElementSibling.classList.add('expanded');
        }else{
            variantPlotRowEle.style.display = "none";
            variantPlotRowEle.previousElementSibling.classList.remove('expanded');
        }
    }

    showConservationPlot() {
        let conservationPlotRowEle = this.ctx.querySelector(".pvConservationPlotRow");
        if (conservationPlotRowEle.style.display == "none") {
            conservationPlotRowEle.style.display = "block";
            conservationPlotRowEle.previousElementSibling.classList.add('expanded');
        } else {
            conservationPlotRowEle.style.display = "none";
            conservationPlotRowEle.previousElementSibling.classList.remove('expanded');
        }
    }

    filterSc(filtervalue) {
        this.ctx.querySelector('.sc_radio').dispatchEvent(new CustomEvent('sc-change', {
            detail: {
                type: filtervalue
            },
            bubbles: true, cancelable: true
        }));
    }

    addEventListener(name, fn) {
        this.handlers.push({name, fn});
        document.addEventListener(name, fn)
    }

    addEventSubscription() {
        this.addEventListener("PDB.topologyViewer.click", e => {
            this.handleExtEvents(e);
        });

        this.addEventListener("PDB.topologyViewer.mouseover", e => {
            this.handleExtEvents(e);
        });

        this.addEventListener("PDB.topologyViewer.mouseout", e => {
            this.handleExtEvents(e);
        });

        this.addEventListener("PDB.litemol.click", e => {
            this.handleExtEvents(e);
        });

        this.addEventListener("PDB.litemol.mouseover", e => {
            this.handleExtEvents(e);
        });

        this.addEventListener("PDB.molstar.click", e => {
            this.handleExtEvents(e);
        });

        this.addEventListener("PDB.molstar.mouseover", e => {
            this.handleExtEvents(e);
        });
    }


    removeEventSubscription() {
        if(this.ctx.subscribeEvents){
            this.handlers.forEach(handler => {
                document.removeEventListener(handler.name, handler.fn);
            })
        }
    }
}

export default LayoutHelper;
