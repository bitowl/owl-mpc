'use strict';

var MPC = require('mpc-js').MPC;

module.exports = function (nodecg) {
    const mpcReplicant = nodecg.Replicant('mpc', {defaultValue:{
        song: '',
        playing: false,
        connected: false,
    }, persistent: false});

    function retrieveCurrentSong() {
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
    }

    function reconnectToMpd() {
        nodecg.log.info('Trying to reconnect to MDP server...');
        connectToMpd();
    }

    function connectToMpd() {
        mpc.connectTCP('localhost', 6600).then(value => { 
            nodecg.log.info('Connected to MPD server');
            mpcReplicant.connected = true;
            retrieveCurrentSong();
        }).catch(reason => {
            mpc.disconnect();
            nodecg.log.error('Couldn\'t connect to MPD server', reason);
            setTimeout(reconnectToMpd, 5000);
        });
    }

    var mpc = new MPC();
    mpc.on('changed-player', () => { 
        retrieveCurrentSong();
    });
    mpc.on('socket-end', () => {
        mpcReplicant.connected = false;
        mpc.disconnect();
        nodecg.log.error('MPD server closed connection');
        reconnectToMpd();
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
