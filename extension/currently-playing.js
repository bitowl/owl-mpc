'use strict';

var MPC = require('mpc-js').MPC;

module.exports = function (nodecg) {
    const mpcReplicant = nodecg.Replicant('mpc', {defaultValue:{
        song: '',
        playing: false
    }, persistent: false});

    var mpc = new MPC();
    mpc.connectTCP('localhost', 6600).then(value => { 
        nodecg.log.info('Connected to MPD server');
    }).catch(reason => {
        nodecg.log.error('Couldn\'t connect to MPD server', reason);
    });
    mpc.on('changed-player', () => { 
        mpc.status.status().then(status => { 
            if (status.state == 'play') { 
                mpc.status.currentSong().then(song => {
                    mpcReplicant.value.artist = song.artist;
                    mpcReplicant.value.title = song.title;
                    mpcReplicant.value.playing = true;
                });
            } else {
                mpcReplicant.value.playing = false;
            }
        });
    });
    

    nodecg.listenFor('play', function() {
        mpc.playback.play();
    });

    nodecg.listenFor('pause', function() {
        mpc.playback.pause();
    });

    nodecg.listenFor('next', function() {
        mpc.playback.next();
    });
};
