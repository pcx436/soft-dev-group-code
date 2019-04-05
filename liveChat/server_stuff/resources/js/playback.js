var player;

window.onSpotifyWebPlaybackSDKReady = () => {
    //token is used to connect with spotify connect leaving this undone not sure how we want to authorize this
    //have to have spotify premium and get a code which expires every hour
    var token = 'BQB0apmU6rgGHmiOIdCDQhi_W0Zkq1OjRsYUKzexF18C2o6A8YrPHr40J5fDiGeSW5OAZ-jJkR5cJp8GEgqz6HpAKHA5XetwFvC0zmsyWt0O7gdP4h1iYUjhRlbz1ORGoc5jyGi-JSLmX8WT9Tteg5Sp1JTjWdVEOMX0';
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
      document.getElementById("song_title").innerHTML = current_track.name;//sets song name
      document.getElementById("artist_name").innerHTML = current_track.artists[0].name;
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

var toggle = 0;

function playPause(){
    console.log("play/pause button");
    player.togglePlay().then(() => {
      console.log('Toggled playback!');
    });
}