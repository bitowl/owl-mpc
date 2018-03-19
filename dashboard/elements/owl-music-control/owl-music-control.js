(function () {
    'use strict';

    class OwlMusicControl extends Polymer.Element {
        static get is() {
            return 'owl-music-control';
        }

        ready() {
            super.ready();
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
    }
    customElements.define(OwlMusicControl.is, OwlMusicControl);
})();