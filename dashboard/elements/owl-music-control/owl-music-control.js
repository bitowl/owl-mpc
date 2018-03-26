(function () {
    'use strict';


    const playingRepl = nodecg.Replicant('playing');

    class OwlMusicControl extends Polymer.Element {
        static get is() {
            return 'owl-music-control';
        }

        ready() {
            super.ready();
            this.$.volumeSlider.addEventListener('immediate-value-change', this.changeVolume);
            playingRepl.on('change', value => {
                this.playPauseButtonText = value ? 'Pause' : 'Play';
            });

            if (!nodecg.bundleConfig.showBanButton) {
                this.$.ban.style.display = 'none';
            }
        }


        togglePlaying() {
            if (playingRepl.value) {
                nodecg.sendMessage('pause');
            } else {
                nodecg.sendMessage('play');
            }
        }

        nextMusic() {
            nodecg.sendMessage('next');
        }

        banSong() {
            nodecg.sendMessage('ban');
        }

        changeVolume() {
            this.value = this.immediateValue;
        }

        
    }
    customElements.define(OwlMusicControl.is, OwlMusicControl);
})();