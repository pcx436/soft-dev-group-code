/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
//var flash = require('express-flash');
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var server = require('http').Server(app);
var io = require('socket.io')(server);

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

/*********************************
 Below we'll add the get & post requests which will handle:
   - Database access
   - Parse parameters from get (URL) and post (data package)
   - Render Views - This will decide where the user will go after the get/post request has been processed
************************************/

// home page 
app.get('/', function(req, res) {
	// user is logged in, show them the home page
	if(req.session && req.session.user){
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

	// if user is already logged in, redirect them to the homepage
	if(req.session && req.session.user){
		res.redirect('/');
	}
	else{
		// user not logged in, show them the home page
		res.render('pages/login',{ 
			page_title:"Login",
			custom_style:"resources/css/login.css",
			user: '',
			active: 'login-nav'
		});
	}
});

// MODIFY TO PREVENT SQL INJECTION ATTACKS
// Also follow along with the managing session stuff, that looks real helpful!
app.post('/login', function(req, res){

	if(req.session && req.session.user){
		// already logged in, tried to post again.
		// will only occur with deliberate tampering (i think)
		res.redirect('/');
	}
	else if(req.body.user && req.body.pwOne){
		// both a username and password have been submitted to us
		console.log('we loggin, my dudes');

		// sanitize inputs (just a little bit)
		var cleanName = escape(req.body.user);
		var cleanPW = escape(req.body.pwOne);

		// query to send to server
		var existQuery = 'SELECT uid FROM users WHERE username=\'' + cleanName + '\' AND hash = crypt(\'' + cleanPW + '\', hash);';
		db.task('get-everything', task => {
			return task.any(existQuery);
		})
		.then(info => {
			// successful login, add username to session for persistent login capabilities
			console.log(info);
			if(info[0]){
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
			console.log(error);
		  	res.end('failure');
		})
	}
	else{// somehow posted without username and/or password. Shouldn't have happened.
		res.end('failure');
	}
});

// logout functionality. Destroys session and redirects to login page
app.get('/logout', function(req, res){
	if(req.session && req.session.user){
		req.session.reset();
		res.redirect('/login');
	}
});

app.get('/player', function(req, res){
	if(!req.session && !req.session.user){
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



// migrating to bootstrap 4
app.get('/widget', function(req, res){
	if(!req.session && !req.session.user){
		res.redirect('/login');
	}
	else{
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
	})

});

// MODIFY TO PREVENT SQL INJECTION
// essentially does nothing, cant figure out how to integrate session and socket.io
app.post('/room-select', function(req, res){
	if(req.session && req.session.user && req.body.rname){
		var query = "SELECT rid FROM rooms WHERE r_name = \'" + req.body.rname + "\';";

		db.task('get-everything', task => {
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


// registration page, going to need this eventually
app.get('/signup', function(req, res) {
	if(!req.session && !req.session.user){
		res.render('pages/signup',{
			page_title:"Registration Page",
			custom_style: "resources/css/home.css",
			user: '',
			active: 'signup-nav'
		});	
	}
	else{
		res.redirect('/');
	}
});

app.post('/signup', function(req, res){
	if(!req.session && !req.session.user && req.body.uname && req.body.pwOne && req.body.email && req.body.pwTwo){
		var createQuery, query = "SELECT uid FROM users WHERE username = \'" + req.body.uname + "\' OR email = \'" + req.body.email + "\';";


		db.task('get-everything', task => {
			return task.any(query);
		})
		.then(info => {
			// we found someone, that's not okay
			if(info[0]){
				console.log('Someone tried to make a user that already exists (' + req.body.uname + ').');
				res.end('failure');
			}
			else{
				console.log('User found and will be created');
				createQuery = 'INSERT INTO users(username, email, hash) VALUES (\'' + req.body.uname + '\', \'' + req.body.email + '\', \''
				 + req.body.pwOne + '\');';
			}
		})
		.catch(error => {
			console.log(error);
			console.log('User lookup threw an error');
			res.end('failure');
		})

		// if user not found, try to insert
		db.task('get-everything', task => {
			return task.any(query);
		})
		.then(info => {
			// we found someone, that's not okay
			if(info[0]){
				console.log('User \'' + req.body.uname + '\' inserted successfully.');
				res.end('success');
			}
			else{
				console.log('Failed to insert?');
				res.end('failure');
			}
		})
		.catch(error => {
			console.log(error);
			console.log('User insertion threw an error');
			res.end('failure');
		})
	}
	else{
		res.end('failure');
	}

});




// start server on port 3000
server.listen(3000);
console.log('http://localhost:3000 is the home page');
console.log('http://localhost:3000/login is the login page');
console.log('http://localhost:3000/signup is the signup page');
console.log('http://localhost:3000/widget is the widget test page');
console.log('http://localhost:3000/player is the player test page');