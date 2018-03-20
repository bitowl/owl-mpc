'use strict';

var MPC = require('mpc-js').MPC;

module.exports = function (nodecg) {
    const mpcReplicant = nodecg.Replicant('mpc', {defaultValue:{
        song: '',
        playing: false
    }, persistent: false});

    function retrieveCurrentSong() {
        mpc.status.currentSong().then(song => {
            mpcReplicant.value.artist = song.artist;
            mpcReplicant.value.title = song.title;
            mpcReplicant.value.playing = true;
        });
    }

    function connectToMpd() {
        mpc.connectTCP('localhost', 6600).then(value => { 
            nodecg.log.info('Connected to MPD server');
            retrieveCurrentSong();
        }).catch(reason => {
            nodecg.log.error('Couldn\'t connect to MPD server', reason);
            setTimeout(1000, function() {
                nodecg.log.info('Trying to reconnect to MDP server...');
                connectToMpd();
            });
        });
    }

    var mpc = new MPC();
    mpc.on('changed-player', () => { 
        mpc.status.status().then(status => { 
            if (status.state == 'play') { 
                retrieveCurrentSong();
            } else {
                mpcReplicant.value.playing = false;
            }
        });
    });
    connectToMpd();
    

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
