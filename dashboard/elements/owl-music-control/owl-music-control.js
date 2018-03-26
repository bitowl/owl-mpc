(function () {
    'use strict';

    class OwlMusicControl extends Polymer.Element {
        static get is() {
            return 'owl-music-control';
        }

        ready() {
            super.ready();
            this.$.volumeSlider.addEventListener('immediate-value-change', this.changeVolume);
            
        }


        playMusic() {
            nodecg.sendMessage('play');
        }

        pauseMusic() {
            nodecg.sendMessage('pause');
        }

        nextMusic() {
            nodecg.sendMessage('next');
        }

        changeVolume() {
            this.value = this.immediateValue;
        }
    }
    customElements.define(OwlMusicControl.is, OwlMusicControl);
})();