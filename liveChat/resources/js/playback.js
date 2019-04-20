var player;

// WHAT DO WHEN TOKEN EXPIRES??


window.onSpotifyWebPlaybackSDKReady = () => {
    //token is used to connect with spotify connect leaving this undone not sure how we want to authorize this
    //have to have spotify premium and get a code which expires every hour
    var token = Cookies.get('access_token');
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
        $("#song_title").html(current_track.name);//sets song name
        $("#artist_name").html(current_track.artists[0].name);
        $("#album").attr('src', current_track.album.images[2].url);//sets the album image
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
var toggle = 1;

function mute_button(){
    if(toggle === 0){
        player.setVolume(1).then(() => {
            console.log('Volume');
            toggle = 1;
            $('#mute_button').html('<i class="fas fa-volume-up"></i>');
        });
    }else if(toggle === 1){
        player.setVolume(0).then(() => {
            console.log('muted');
            toggle = 0;
            $('#mute_button').html('<i class="fas fa-volume-mute"></i>');
        });
    }
}