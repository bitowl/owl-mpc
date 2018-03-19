(function () {
    'use strict';


    const mpcReplicant = nodecg.Replicant('mpc');

    class OwlCurrentlyPlaying extends Polymer.Element {
        static get is() {
            return 'owl-currently-playing';
        }

        ready() {
            super.ready();
            mpcReplicant.on('change', newVal => {
                this.artist = newVal.artist;
                this.title = newVal.title;
            });
        }

       
    }
    customElements.define(OwlCurrentlyPlaying.is, OwlCurrentlyPlaying);
})();