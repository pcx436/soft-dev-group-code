/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
//var flash = require('express-flash');
var express = require('express'); //Ensure our express framework has been added
var app = express();

// spotify jazz
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
// spotify vars
var client_id = '50253af00a8749f2bb5330d1f3a44382'; // Your client id
var client_secret = '01f9c2d6866d410ea25d0e1702dde56a'; // Your secret
var buf = Buffer.from(client_id + ':' + client_secret).toString('base64');

var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var stateKey = 'spotify_auth_state';

var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(cors()).use(cookieParser());

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
const dbConfig = {
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
function loggedIn(req){	return !(!req.session || !req.session.uid || req.session == {} || req.session.uid == undefined); }

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

app.get('/spotify-auth', function(req, res){
	if(loggedIn(req) && !req.session.access_token){
		var state = generateRandomString(16);
		res.cookie(stateKey, state);

		// your application requests authorization
		//var scope = 'user-read-private user-read-email user-modify-playback-state';
		var scope = 'user-read-private user-modify-playback-state';
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
	
	console.log('State: ' + state);
	console.log('Stored State: ' + storedState);

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
				db.task('update-refresh-token', task => {
					return task.none(refreshQuery);
				})
				.then(info => {
					// successful login, add username to session for persistent login capabilities
					console.log('Refresh update info: ' + info);
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
	var refresh_token = req.query.refresh_token;
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
			res.send({
				'access_token': access_token
			});
		}
	});
});

app.get('/player', function(req, res){
	if(!loggedIn(req)){
		res.redirect('/login');
	}
	else{
		res.render('pages/player', {
			page_title: 'Player',
			custom_style: 'resources/css/home.css',
			user: req.session.user,
			active: 'listen-nav',
			refresh: req.session.refresh_token,
			access: req.session.access_token
		});
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
		db.task('get-uid', task => {
			return task.any(existQuery);
		})
		.then(info => {
			// successful login, add username to session for persistent login capabilities
			//console.log("Login post info: " + info + '\n' + info[0]);
			console.log('UID: ' + info[0].uid);
			if(info[0]){
				req.session.uid = info[0].uid;
				req.session.user = cleanName;
				console.log('user seems to exist');
				res.end('success');
			}
			else{
				console.log('user login failure');
				res.end('failure');
			}
			
		})
		.catch(error => {
			// login failed for some reason
			console.log('User login catch: ' + error);
		  	res.end('failure');
		})
	}
	else{// somehow posted without username and/or password. Shouldn't have happened.
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

app.post('/signup', function(req, res){
	if(!loggedIn(req) && req.body.uname && req.body.pwOne && req.body.email && req.body.pwTwo){
		var query = 'INSERT INTO users(username, email, hash) VALUES (\'' + req.body.uname + '\', \'' + req.body.email + '\', \'' + req.body.pwOne + '\');';

		db.task('insert-user', task => {
			return task.none(query);
		})
		.then(info => {
			// inserted successfully
			req.session.user = req.body.uname;
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
	if(req.session && req.session.user){
		req.session.reset();
		res.redirect('/login');
	}
});


// migrating to bootstrap 4
app.get('/widget', function(req, res){
	if(!loggedIn(req)){
		res.redirect('/login');
	}
	else{
		//console.log('wigii');
		res.render('pages/widget', {
			page_title: 'Widget Test',
			custom_style: 'resources/css/widget.css',
			user: req.session.user,
			active: 'listen-nav'
		});
	}
});

// kinda bad since it doesn't rely on session cookies. Can't reliably tell who's doing what
io.on('connection', function(socket){
	console.log("Some user has established a socket connection to the server");

	socket.on('disconnect', function(){
		console.log("Someone has terminated a socket connection");
	});
	
	socket.on('chat message', function(data){
		// poorly designed, doesn't rely on session cookies and therefore inherently allows for impersenation.
		console.log('Message "' + data.msg + '" received from ' + data.name + " in room \"" + data.rm + "\"");
		// socket.to(data.rm).emit('chat message', data.msg);
		socket.broadcast.emit('chat message', data);
	});
});

// MODIFY TO PREVENT SQL INJECTION
// essentially does nothing, cant figure out how to integrate session and socket.io
app.post('/room-select', function(req, res){
	if(loggedIn(req) && req.body.rname){
		var query = "SELECT rid FROM rooms WHERE r_name = \'" + req.body.rname + "\';";

		db.task('room-exist-check', task => {
			return task.any(query);
		})
		.then(info => {
			// successful login, add username to session for persistent login capabilities
			if(info[0]){
				console.log('User ' + req.session.user + ' is joining room ' + req.body.rname + '.');
				req.session.croom = req.body.rname; //croom = current room				
				res.end('success');	
			}
			else{
				console.log('Room join query failed');
				res.end('failure');
			}
		})
		.catch(error => {
			// login failed for some reason
			console.log(error);
		  	res.end('Room join query threw an error');
		})
	}
});

// start server on port 8888
server.listen(8888);
console.log('http://localhost:8888 is the home page');
console.log('http://localhost:8888/login is the login page');
console.log('http://localhost:8888/signup is the signup page');
console.log('http://localhost:8888/widget is the widget test page');
console.log('http://localhost:8888/player is the player test page');