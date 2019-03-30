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
			user: req.session.user
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
			bad:''
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

		// sanitize inputs (just a little bit)
		var cleanName = escape(req.body.user);
		var cleanPW = escape(req.body.pwOne);

		// query to send to server
		var existQuery = 'SELECT uid FROM users WHERE username=\'' + cleanName + '\' AND hash = crypt(\'' + cleanPW + '\', hash);';
		db.task('get-everything', task => {
			return task.batch([task.any(existQuery)]);
		})
		.then(info => {
			// successful login, add username to session for persistent login capabilities
			req.session.user = cleanName;
			res.end('success');
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

// will be implemented once chat system is built
/*app.get('/player', function(req, res){
	if(!req.session.uid){
		req.redirect('/login');
	}
	else{
		page_title: 'Player Page',
		custom_style: 'resources/css/player.css'
	}
});*/

// registration page, going to need this eventually
/*app.get('/register', function(req, res) {
	res.render('pages/register',{
		page_title:"Registration Page"
	});
});
*/



// start server on port 3000
app.listen(3000);
console.log('http://localhost:3000 is the home page');
console.log('http://localhost:3000/login is the login page');

