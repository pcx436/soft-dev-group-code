var player;

window.onSpotifyWebPlaybackSDKReady = () => {
    //token is used to connect with spotify connect leaving this undone not sure how we want to authorize this
    //have to have spotify premium and get a code which expires every hour
    var token = 'BQADysFNYIoFATq00BRUYN8cF_x2CEOWgSCNaH-4YsWsVVoNBI3GSwKLT7_FhM9QDjLg9hyIRKhMwQ_yjwHWzdP4htaJaelEU5T8gpKmZPVvjw07QNMFAyBpLgnK3ZWhpFJyafq6yfM0_3mD0nVrftwdgVbM1H4MosZ_';
    player = new Spotify.Player({
    name: 'Tracked Out',
    getOAuthToken: cb => { cb(token); }
    });
    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    //player.addListener('player_state_changed', state => { console.log(state); });
    player.addListener('player_state_changed', ({
      position,
      duration,
      track_window: { current_track }
    }) => {
      console.log('Currently Playing', current_track);
      console.log('Position in Song', position);
      console.log('Duration of Song', duration);
      console.log("Album Image", current_track.album.images[2].url); //The album image url of the currently playing track
      document.getElementById("album").src = current_track.album.images[2].url;//sets the album image
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player
    player.connect();
};

//play/pause the current playing track. Maybe just have it mute?
function playPause(){
    console.log("play/pause button");
    player.togglePlay().then(() => {
      console.log('Toggled playback!');
    });
}