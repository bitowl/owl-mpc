'use strict';

var MPC = require('mpc-js').MPC;

module.exports = function (nodecg) {
    const mpcReplicant = nodecg.Replicant('mpc', {defaultValue:{
        song: '',
        connected: false,
    }, persistent: false});

    const playingRepl = nodecg.Replicant('playing', {
        defaultValue: false,
        persistent: false
    });

    const volumeRepl = nodecg.Replicant('volume', {
        defaultValue: 100,
        persistent: true});

    function retrieveCurrentSong() {
        mpc.status.status().then(status => { 
            volumeRepl.value = status.volume;

            if (status.state == 'play') { 
                mpc.status.currentSong().then(song => {
                    mpcReplicant.value.artist = song.artist;
                    mpcReplicant.value.title = song.title;
                    playingRepl.value = true;
                });
            } else {
                playingRepl.value = false;
            }
        });
    }

    function reconnectToMpd() {
        nodecg.log.info('Trying to reconnect to MDP server...');
        connectToMpd();
    }

    function connectToMpd() {
        mpc.connectTCP(nodecg.bundleConfig.host, nodecg.bundleConfig.port).then(value => { 
            nodecg.log.info('Connected to MPD server');
            mpcReplicant.connected = true;
            retrieveCurrentSong();
        }).catch(reason => {
            mpc.disconnect();
            nodecg.log.error('Couldn\'t connect to MPD server', reason);
            setTimeout(reconnectToMpd, nodecg.bundleConfig.reconnectTime);
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

    nodecg.listenFor('ban', () => {
        mpc.status.currentSong().then(song => {
            mpc.storedPlaylists.listPlaylistInfo('stream').then(playlist => {
                console.log(playlist.length);
                for (let i = 0; i < playlist.length; i++) {
                    const element = playlist[i];
                    if (element.path === song.path) {
                        nodecg.log.info('Banned song ' + song.path);
                        mpc.storedPlaylists.playlistDelete('stream', i);
                        mpc.currentPlaylist.deleteId(song.id).catch(() => {
                            nodecg.log.error('Could not delete song from current playlist');
                        });
                        mpc.playback.next();
                        return;
                    }
                }
                nodecg.log.error('Song ' + song.path + ' not found in playlist to ban');
            });
        }).catch(() => {
            nodecg.log.error('No song playing to ban');
        });
        // mpc.p
    });

    volumeRepl.on('change', volume => {
        mpc.playbackOptions.setVolume(volume);
    });

};
