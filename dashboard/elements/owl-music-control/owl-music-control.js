(function () {
    'use strict';


    const playingRepl = nodecg.Replicant('playing');
    const connectedRepl = nodecg.Replicant('connected');

    class OwlMusicControl extends Polymer.Element {
        static get is() {
            return 'owl-music-control';
        }

        ready() {
            super.ready();
            this.$.volumeSlider.addEventListener('immediate-value-change', this.changeVolume);
            playingRepl.on('change', value => {
                this.playPauseButtonText = value ? 'Pause' : 'Play';
                this.playPauseButtonIcon = value? 'av:pause' : 'av:play-arrow';
            });

            connectedRepl.on('change', value => {
                this.$.playpause.disabled = !value;
                this.$.next.disabled = !value;
                this.$.ban.disabled = !value;
            });

            if (!nodecg.bundleConfig.showBanButton) {
                this.$.ban.style.display = 'none';
            }
            if (!nodecg.bundleConfig.showVolumeSlider) {
                this.$.volumeField.style.display = 'none';
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

        confirmBanSong() {
            nodecg.getDialog('ban-current-song').open();
        }

        changeVolume() {
            this.value = this.immediateValue;
        }

        
    }
    customElements.define(OwlMusicControl.is, OwlMusicControl);
})();