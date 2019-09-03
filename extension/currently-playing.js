'use strict';

const {MPC} = require('mpc-js');

module.exports = function (nodecg) {
	const mpcReplicant = nodecg.Replicant('mpc', {
		defaultValue: {
			artist: 'not connected',
			title: 'not connected'
		}, persistent: false
	});

	const connectedRepl = nodecg.Replicant('connected', {
		defaultValue: false,
		persistent: false
	});

	const playingRepl = nodecg.Replicant('playing', {
		defaultValue: false,
		persistent: false
	});

	const volumeRepl = nodecg.Replicant('volume', {
		defaultValue: 100,
		persistent: true
	});

	let currentVolume = nodecg.readReplicant('volume');

	function retrieveCurrentSong() {
		mpc.status.status().then(status => {
			currentVolume = status.volume;
			volumeRepl.value = status.volume;

			if (status.state === 'play') {
				mpc.status.currentSong().then(song => {
					mpcReplicant.value.artist = song.artist;
					mpcReplicant.value.title = song.title;
					playingRepl.value = true;
				}).catch(errorHandler('play'));
			} else {
				playingRepl.value = false;
			}
		}).catch(errorHandler('status'));
	}

	function reconnectToMpd() {
		nodecg.log.info('Trying to reconnect to MDP server...');
		connectToMpd();
	}

	function connectToMpd() {
		mpc.connectTCP(nodecg.bundleConfig.host, nodecg.bundleConfig.port).then(value => {
			nodecg.log.info('Connected to MPD server');
			connectedRepl.value = true;
			retrieveCurrentSong();
		}).catch(reason => {
			mpc.disconnect();
			nodecg.log.warn('Couldn\'t connect to MPD server', reason);
			setTimeout(reconnectToMpd, nodecg.bundleConfig.reconnectTime);
		});
	}

	const mpc = new MPC();
	mpc.on('changed-player', () => {
		retrieveCurrentSong();
	});
	mpc.on('socket-end', () => {
		connectedRepl.value = false;
		mpc.disconnect();
		nodecg.log.error('MPD server closed connection');
		reconnectToMpd();
	});
	connectToMpd();

	nodecg.listenFor('play', () => {
		mpc.playback.play().catch(errorHandler('play2'));
	});

	nodecg.listenFor('pause', () => {
		mpc.playback.pause().catch(errorHandler('pause'));
	});

	nodecg.listenFor('next', () => {
		mpc.playback.next().catch(errorHandler('next'));
	});

	nodecg.listenFor('ban', () => {
		mpc.status.currentSong().then(song => {
			mpc.storedPlaylists.listPlaylistInfo('stream').then(playlist => {
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
	});

	volumeRepl.on('change', volume => {
		if (isNaN(volume)) { // Volume is not yet set
			return;
		}

		// Only call setVolume if the volume was changed by the user
		if (volume !== currentVolume) {
			mpc.playbackOptions.setVolume(volume).catch(errorHandler('setVolume'));
		}
	});

	function errorHandler(name) {
		return function (error) {
			console.log(name);
			console.trace(error);
		};
	}
};
