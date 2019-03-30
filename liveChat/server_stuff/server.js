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

var escape = require('escape-html'), session = require('client-sessions'); // require session

// duration should equate to a week
app.use(session({
	cookieName: 'session',
	secret: 'L0I_hm9j:X1a3s@&9C;da5NN7SHi>',
	duration: 1000 * 60 * 60 * 24 * 7,
	activeDuration: 1000 * 60 * 5
})); //instantiate session

//app.use(flash());
/*********************************
 Below we'll add the get & post requests which will handle:
   - Database access
   - Parse parameters from get (URL) and post (data package)
   - Render Views - This will decide where the user will go after the get/post request has been processed
************************************/

// home page 
app.get('/', function(req, res) {
	if(req.session && req.session.user){
		res.render('pages/home', { 
			page_title:"Home",
			custom_style:"resources/css/home.css",
			user: req.session.user
		});
	}
	else{
		res.redirect('/login');
	}
	
});

// login page
app.get('/login', function(req, res) {

	if(req.session && req.session.user){
		res.redirect('/');
	}
	else{
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
	console.log(req.body);
	// already logged in, tried to post again.
	// will only occur with deliberate tampering (i think)
	if(req.session && req.session.user){
		res.redirect('/');
	}
	else if(req.body.user && req.body.pwOne){
		var cleanName = escape(req.body.user);
		var cleanPW = escape(req.body.pwOne);
		var existQuery = 'SELECT uid FROM users WHERE username=\'' + cleanName + '\' AND hash = crypt(\'' + cleanPW + '\', hash);';
		console.log(existQuery);
		db.task('get-everything', task => {
			return task.batch([task.any(existQuery)]);
		})
		.then(info => {
			//console.log('user logged in correctly');
			console.log(req.session);
			console.log(cleanName);
			req.session.user = cleanName;
			res.end('success');
		})
		.catch(error => {
			//req.flash('error', err);
			console.log(error);
			console.log('user done FUCKED up!');
		  	res.end('failure');
		})
	}
	else{// somehow posted without username and/or password. Shouldn't have happened
		res.end('failure');
	}
});

/*app.get('/player', function(req, res){
	if(!req.session.uid){
		req.redirect('/login');
	}
	else{
		page_title: 'Player Page',
		custom_style: 'resources/css/player.css'
	}
});*/

// registration page 
/*app.get('/register', function(req, res) {
	res.render('pages/register',{
		page_title:"Registration Page"
	});
});
*/
// team stats
/*app.get('/team_stats', function(req, res) {
  var q1 = 'select * from football_games;';
  var q2 = 'select count(*) from football_games where home_score > visitor_score;';
  var q3 = 'select count(*) from football_games where home_score < visitor_score;';

  db.task('get-everything', task => {
		return task.batch([
			task.any(q1),
			task.any(q2),
			task.any(q3)
		]);
	})
	.then(info => {
	  res.render('pages/team_stats',{
		page_title: "2018 Season Stats",
		data: info[0],
		nWin: info[1][0],
		nLose: info[2][0]
	  })
	})
	.catch(error => {
	  // display error message in case an error
	  request.flash('error', err);
	  response.render('pages/team_stats', {
		  title: '2018 Season Stats',
		  data: '',
		  nWin: '',
		  nLose: ''
	  })
	})
});

app.get('/home', function(req, res) {
  var query = 'select * from favorite_colors;';
  db.any(query)
		.then(function (rows) {
		  res.render('pages/home',{
		  page_title: "Home Page",
		  data: rows,
		  color: '',
		  color_msg: ''
		})

		})
		.catch(function (err) {
			// display error message in case an error
			request.flash('error', err);
			response.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		})
});

app.get('/home/pick_color', function(req, res) {
  var color_choice = req.query.color_selection;
  var color_options =  'select * from favorite_colors;';
  var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';"; 
  db.task('get-everything', task => {
		return task.batch([
			task.any(color_options),
			task.any(color_message)
		]);
	})
	.then(info => {
	  res.render('pages/home',{
		page_title: "Home Page",
		data: info[0],
		color: color_choice,
		color_msg: info[1][0].color_msg
	  })
	})
	.catch(error => {
		// display error message in case an error
			request.flash('error', err);
			response.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
	});
  
});

app.post('/home/pick_color', function(req, res) {
  var color_hex = req.body.color_hex;
  var color_name = req.body.color_name;
  var color_message = req.body.color_message;
  var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" + 
			  color_name + "','" + color_message +"') ON CONFLICT DO NOTHING;";

  var color_select = 'select * from favorite_colors;';
  db.task('get-everything', task => {
		return task.batch([
			task.any(insert_statement),
			task.any(color_select)
		]);
	})
	.then(info => {
	  res.render('pages/home',{
		page_title: "Home Page",
		data: info[1],
		color: color_hex,
		color_msg: color_message
	  })
	})
	.catch(error => {
		// display error message in case an error
		request.flash('error', err);
		response.render('pages/home', {
			title: 'Home Page',
			data: '',
			color: '',
			color_msg: ''
		})
	});
});

app.get('/player_info', function(req, res)
{
  var fb_players = 'select id, name from football_players;';
  db.any(fb_players).then(function (rows) {
	res.render('pages/player_info',{
	  page_title: "Player Info",
	  data: rows
	})
  })
  .catch(function (err) {
	// display error message in case an error
	request.flash('error', err);
	response.render('pages/player_info', {
		title: 'Player Info',
		data: ''
	})
  })
});*/

app.listen(3000);
console.log('http://localhost:3000 is the home page');
console.log('http://localhost:3000/login is the login page');

