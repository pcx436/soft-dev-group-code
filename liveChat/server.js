/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();

// spotify jazz
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');

var cookieParser = require('cookie-parser');
// var Cookies = require('cookies');

// spotify vars
var client_id = '50253af00a8749f2bb5330d1f3a44382'; // Your client id
var client_secret = '01f9c2d6866d410ea25d0e1702dde56a'; // Your secret
var buf = Buffer.from(client_id + ':' + client_secret).toString('base64');

var redirect_uri;
if(process.env.PORT){
	redirect_uri = 'https://mountain-music.herokuapp.com/callback'; 
}
else{
	redirect_uri = 'http://localhost:8888/callback';
}
var stateKey = 'spotify_auth_state';

var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var server = require('http').Server(app);
var io = require('socket.io')(server);


app.use(cors()).use(cookieParser('dy=({SFp569O_PG9U.TZ[KE-53f1M'));

//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!
**********************/
const dbConfig = (process.env.DATABASE_URL) ? process.env.DATABASE_URL : {
	host: 'localhost',
	port: 5432,
	database: 'mountain_db',
	user: 'postgres',
	password: 'A2$-pC=U9*0BCp'
};
var db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory
app.set('views', __dirname + '/views/');

var escape = require('escape-html'); // used for cleaning up user input.
var session = require('client-sessions'); // includes ability to actually use sessions.

// duration should equate to a week
// secret is random generated string that came from my password generator.
app.use(session({
	cookieName: 'session',
	secret: 'L0I_hm9j:X1a3s@&9C;da5NN7SHi>',
	duration: 1000 * 60 * 60 * 24 * 7,
	activeDuration: 1000 * 60 * 5
})); //instantiate session


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// return true if they're logged in, return false if otherwise
function loggedIn(req){	return !(!req.session || !req.session.uid || !req.session.user || req.session.user === undefined || req.session == {} || req.session.uid == undefined); }

// home page 
app.get('/', function(req, res) {
	// user is logged in, show them the home page
	if(loggedIn(req)){
		// original code for homepage
		res.render('pages/home', { 
			page_title:"Home",
			custom_style:"resources/css/home.css",
			user: req.session.user,
			active: 'home-nav'
		});
	}
	else{
		// user isn't logged in, redirect them to the homepage
		res.redirect('/login');
	}
});

// login page GET
app.get('/login', function(req, res) {
	// user not logged in, allow to proceed
	if(!loggedIn(req)){
		res.render('pages/login',{ 
			page_title:"Login",
			custom_style:"resources/css/login.css",
			user: '',
			active: 'login-nav'
		});
	}
	else{
		// if user is already logged in, redirect them to the homepage
		res.redirect('/');
	}
});

// Also follow along with the managing session stuff, that looks real helpful!
app.post('/login', function(req, res){
	if(loggedIn(req)){
		// already logged in, tried to post again.
		// will only occur with deliberate tampering (i think)

		res.redirect('/');
	}
	else if(req.body.user && req.body.pwOne){
		// both a username and password have been submitted to us

		// sanitize inputs (just a little bit)
		var cleanName = escape(req.body.user);
		var cleanPW = escape(req.body.pwOne);

		// query to send to server
		var existQuery = 'SELECT uid FROM users WHERE username=\'' + cleanName + '\' AND hash = crypt(\'' + cleanPW + '\', hash);';
		//var existQuery = 'SELECT uid FROM users WHERE username=\'' + cleanName + '\' AND hash = \'' + cleanPW + '\';';
		db.tx('get-uid', task => {
			return task.one(existQuery);
		})
		.then(info => {
			// successful login, add username to session for persistent login capabilities
			console.log('UID ' + info.uid + ' has logged in successfully');
			req.session.uid = info.uid;
			req.session.user = cleanName;

			// setting cookie
			res.clearCookie('uid');
			res.clearCookie('user');
			res.cookie('uid', info.uid);
			res.cookie('user', cleanName);

			res.end('success');
		})
		.catch(error => {
			// login failed for some reason
			console.log('Failed login attempt against ' + cleanName);
			console.log(error);
		  	res.end('failure');
		})
	}
	else{
		// somehow posted without username and/or password. Shouldn't have happened.
		res.end('failure');
	}
});

// registration page, going to need this eventually
app.get('/signup', function(req, res) {
	res.render('pages/signup',{
		page_title:"Registration Page",
		custom_style: "resources/css/signup.css",
		user: '',
		active: 'signup-nav'
	});
});

// post for signup page
app.post('/signup', function(req, res){
	if(!loggedIn(req) && req.body.uname && req.body.pwOne && req.body.email && req.body.pwTwo){
		var query = 'INSERT INTO users(username, email, hash) VALUES (\'' + req.body.uname + '\', \'' + req.body.email + '\', \'' + req.body.pwOne + '\');';

		db.tx('insert-user', task => {
			return task.none(query).then(info =>{
				return task.one('SELECT uid FROM users WHERE username = \'' + req.body.uname + '\';');
			})
		})
		.then(info => {
			// inserted successfully
			req.session.user = req.body.uname;
			req.session.uid = info.uid;
			req.session.user = req.body.uname;

			// set UUID cookie
			res.clearCookie('uid');
			res.clearCookie('user');
			res.cookie('uid', info.uid);
			res.cookie('user', cleanName);
			
			res.end('success');
		})
		.catch(error => {
			console.log(error);
			console.log('User insertion threw an error');
			res.end(error.detail);
		})
	}
	else{
		console.log('Requiste field(s) missing from signup POST');
		res.end('Missing fields');
	}
});

// logout functionality. Destroys session and redirects to login page
app.get('/logout', function(req, res){
	if(req.session){
		req.session.reset();
		res.clearCookie(stateKey);
		res.clearCookie('uid');
		res.clearCookie('user');
		res.clearCookie('access_token');
		res.redirect('/login');
	}
});

app.get('/player', function(req, res){
	if(!loggedIn(req)){
		res.redirect('/login');
	}
	else{
		res.render('pages/player', {
			page_title: 'Player',
			custom_style: 'resources/css/player.css',
			user: req.session.user,
			active: 'listen-nav'
		});
	}
});


app.get('/spotify-auth', function(req, res){
	if(loggedIn(req)){
		var state = generateRandomString(16);
		res.cookie(stateKey, state);

		// your application requests authorization
		//var scope = 'user-read-private user-read-email user-modify-playback-state';
		var scope = 'user-read-private streaming user-modify-playback-state';
		res.redirect('https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: client_id,
				scope: scope,
				redirect_uri: redirect_uri,
				state: state
		}));
	}
	else{
		res.redirect('/login');
	}
});

// spotify stuff
app.get('/callback', function(req, res) {
	// your application requests refresh and access tokens
	// after checking the state parameter

	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		// not entirely sure what the point of this really is but its here
		res.redirect('/player#' + querystring.stringify({error: 'state_mismatch'}));
	}
	else {
		res.clearCookie(stateKey);
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code'
			},
			headers: {
				'Authorization': 'Basic ' + buf
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			// everything is good!
			if (!error && response.statusCode === 200) {
				var access_token = body.access_token,
				refresh_token = body.refresh_token;
				console.log('ACCESS TOKEN: ' + access_token);
				console.log('REFRESH TOKEN: ' + refresh_token);

				var options = {
					url: 'https://api.spotify.com/v1/me',
					headers: { 'Authorization': 'Bearer ' + access_token },
					json: true
				};

				// use the access token to access the Spotify Web API
				request.get(options, function(error, response, body) {
					console.log(body);
				});

				req.session.access_token = access_token;
				req.session.refresh_token = refresh_token;

				// adding refresh token to db
				var refreshQuery = 'UPDATE users SET refresh = \'' + req.session.refresh_token + '\' WHERE uid = \'' + req.session.uid + '\';';
				db.tx('update-refresh-token', task => {
					return task.none(refreshQuery);
				})
				.then(info => {
					// successful login, add username to session for persistent login capabilities
					console.log('Successful refresh update');
				})
				.catch(error => {
					// login failed for some reason
					console.log('Refresh failure: ' + error);
				  	res.end('failure');
				})

				// we can also pass the token to the browser to make requests from there
				/*res.redirect('/player#' +
					querystring.stringify({
						access_token: access_token,
						refresh_token: refresh_token
				}));*/

				res.redirect('/player');
			}
			else {
				console.log('Invalid token occured');
				res.redirect('/player#' +
					querystring.stringify({
					error: 'invalid_token'
				}));
			}
		});
	}
});

// get new refresh token procedure
app.get('/refresh_token', function(req, res) {

	// requesting access token from refresh token
	var refresh_token = req.session.refresh_token;
	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: { 'Authorization': 'Basic ' + buf },
		form: {
			grant_type: 'refresh_token',
			refresh_token: refresh_token
		},
		json: true
	};

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var access_token = body.access_token;
			req.session.access_token = access_token;

			res.clearCookie('access_token');
			res.cookie('access_token', req.session.access_token);

			res.send({
				'access_token': access_token
			});
			console.log('successful refresh');
		}
		else{
			console.log('refresh error: ' + error);
			console.log('code: ' + response.statusCode);
		}
	});
});

// Chat test page
app.get('/widget', function(req, res){
	if(!loggedIn(req)){
		res.redirect('/login');
	}
	else{
		res.render('pages/widget', {
			page_title: 'Widget Test',
			custom_style: 'resources/css/widget.css',
			user: req.session.user,
			active: 'listen-nav',
		});
	}
});

// Manages the chat system and room changes
io.on('connection', function(socket){

	// Initialize connection details, update database with current socket ID
	db.tx('init-sock-id', task => {
		//console.log(console.log(socket.headers));
		return task.one('UPDATE users SET sock_id = \'' + socket.id + '\' WHERE uid = \'' + socket.handshake.query.uid + '\'::UUID RETURNING username;');
	})
	.then(info => {
		// all is well, the query didn't fail
		console.log(info.username + ' has established a socket connection to the server!');
		console.log('Registered ' + info.username + '\'s sock_id as ' + socket.id + ' in DB');
	})
	.catch(error => {
		// something went wrong in either the db.tx section or the then(info=> )
		console.log('Initialization of socket-id threw error:');
		console.log(error);
	})

	// Server has received a message, will now decide where to send it
	socket.on('chat message', function(msg){
		console.log('Server has received a chat message: ' + msg);

		db.tx('retrive-identity', task => {
			return task.one('SELECT username, current_room FROM users WHERE sock_id=\'' + socket.id + '\';'); // grab the username and room associated with the current socket
		})
		.then(info => {
			socket.to(info.current_room).emit('chat message', {
				msg:msg,
				name:info.username
			}); // send the message to the other people in the room


			socket.emit('queue song', { // used for debugging of the song receiving system
				uri: '2WfaOiMkCvy7F5fcp2zZ8L',
				count: 2
			});
		})
		.catch(error => {
			console.log('Message receive error:');
			console.log(error);
		})
	});

	socket.on('queue song', function(uri, clientFunction){
		console.log('Server received song to add: ' + uri);

		var messageSent = false;
		if(uri.length > 0){
			var parts = uri.trim().split(':');
			if (parts.length !== 3){
				clientFunction(1); // malformed URI
			}
			else{
				var sid = parts[2]; // id of the song

				// check that they're in a room, then check that the song hasn't already been added
				db.tx('check-room', task => {
					return task.one('SELECT current_room, uid FROM users WHERE sock_id=\'' + socket.id + '\';') // grab user's current room
					.then(roomInfo => {
						return task.one('SELECT r_name FROM rooms WHERE rid = \'' + roomInfo.current_room + '\'::UUID;') // convert current room's RID into the name
						.then(roomName => {
							var nameToColumn = roomName.r_name.toLowerCase().replace('-', '_').replace(' ', '_'); // format room name to be a column name

							return task.oneOrNone('SELECT ' + nameToColumn + ' FROM songs WHERE sid = \'' + sid + '\';') // check if the song is already in the db
								
							.then(songResults => {
								if(songResults == null){ // song not in db
									return task.none('INSERT INTO songs (sid, ' + nameToColumn + ', who_said) VALUES (\'' + sid + '\', true, \'' + roomInfo.uid + '\');'); // insert song into db
									clientFunction(0);
									
									socket.emit('queue song', {
										uri:sid
									}); // send the song to the other people in the room
								}
								else if(Object.values(songResults)[0] == false){ // song is already in the db BUT not in this room, okay to add
									return task.none('UPDATE songs SET ' + nameToColumn + ' = true WHERE sid = \'' + sid + '\';')
									.then(nada => {
										console.log(nameToColumn + ' set to true for ' + sid + ', sending to clients in room...');
										clientFunction(0); // send client the all clear	

										socket.emit('queue song', {
											uri:sid
										}); // send the song to the other people in the room

									})
									.catch(updateError => {
										console.log('Attempt to change ' + nameToColumn + ' to true for ' + sid + ' failed:');
										console.log(updateError);
									})												
								}
								else{ // song is already in this room, stop client.
									clientFunction(2);
									messageSent = true;
								}
							})
							.catch(checkError => {
								console.log('Error when checking for song (' + sid + ') in db:');
								console.log(checkError);
							})
						})
					})
					.catch(roomGrabError => {
						console.log('Couldn\'t find out user ' + socket.id + '\'s current room:');
						console.log(roomGrabError);
					})
				})
				.then(uselessInfo => {
					
					console.log('Song updated successfully!');
					
				})
				.catch(error => {
					console.log('check-room error:');
					console.log(error);
					clientFunction(3); // send unknown error signal to client
				})
			}
		}
		else{
			clientFunction(1); // malformed URI
		}
	});

	// manages user joining a room
	socket.on('room join', function(rname, fn){
		// changes your current room in the db
		db.tx('room-change-query', task => {
			return task.one("SELECT getrid(\'" + rname + "\');")
				.then(retInfo => {
					var q = 'UPDATE users SET current_room=\'' + retInfo.getrid + '\'::UUID WHERE sock_id=\'' + socket.id + '\' RETURNING username;';
					//console.log(q);
					return task.one(q)
						.then(secInfo => {
							return [retInfo.getrid, secInfo.username]
						})
				});
		})
		.then(info => {
			// successful login, add username to session for persistent login capabilities
			var rooms = Object.keys(socket.rooms);

			// if the user is in any rooms currently (besides the one they start out with), make them leave it
			for(var i = 1; i < rooms.length; i++){ 
				console.log('Leaving room ' + rooms[i]);
				
				socket.leave(rooms[i]);
			}

			socket.join(info[0]);// join the room!
			console.log(info[1] + ' joined room ' + rname + ' (' + info[0] + ')!');
			
			fn(0); // send all clear back to client
		})
		.catch(error => {
			console.log('Room join query threw an error:');
			console.log(error);
		  	
		  	fn(1); // send failure to client
		})
	});

	// handles updating the db when a user disconnects
	socket.on('disconnect', function(){
		// removes the current_room from the user since they're disconnecting
		db.tx('remove-room', task => {
			return task.one('UPDATE users SET current_room=NULL WHERE sock_id=\'' + socket.id + '\' RETURNING username;');
		})
		.then(info => {
			console.log(info.username + ' disconnected, DB updated');
		})
		.catch(error => {
			console.log('Socket information erasure threw an error:');
			console.log(error);
		})
	});
});

// start server on port 8888
var portPort = (process.env.PORT) ? process.env.PORT : 8888;
server.listen(portPort);
/*console.log('http://localhost:8888 is the home page');
console.log('http://localhost:8888/login is the login page');
console.log('http://localhost:8888/signup is the signup page');
console.log('http://localhost:8888/widget is the widget test page');
console.log('http://localhost:8888/player is the player test page');*/