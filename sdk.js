const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();
app.use(bodyParser.json())
/*
console.log("1");
app.get('/index.html', function(req, res) {
console.log("2");
        res.sendFile(__dirname + "/" + "index.html");
    });
*/
//route the GET request to the specified path, "/user". 
//This sends the user information to the path  
console.log("4");
app.get('/process_get', function(req, res){
	
        response = {
            songSearch : req.query.songSearch,

            }
        

        //this line is optional and will print the response on the command prompt
        //It's useful so that we know what infomration is being transferred 
        //using the server
        console.log(response);
        
        //convert the response in JSON format
        //res.end(JSON.stringify(response));
    });



//var access_token = '';


var url1 = 'https://api.spotify.com/v1/search'
request({
    url: url1,
    headers: {
      'Authorization': 'Bearer BQA51208CPim5nP-FRMUA10OcBO0OD5__6UcukS2q0s7oNliNPZwMFSOv_c5t8PRvaEhBmyuRQiBvUe1os3RpfJQZGp3r9Cf6y0vrNjGBSAQJfSEG_fau6lEcnWenQf6LPoQhZwXDYxN12Wv4gdBIEd-IEC7KU13y8Sv4g'
    },
    qs: {
        q: response,
        type: 'track',
        limit: '6',
        offset: '0'

    },
    rejectUnauthorized: false
  }, function(err, res){
      if(err) {
        console.error(err);
      } else {
      	var parsedbody = JSON.parse(res.body);
      	var i = 0;
      	for(i=0; i<6; i++)
      	{
      		console.log(parsedbody.tracks.items[i].name);
      		console.log(parsedbody.tracks.items[i].id);
      	}
      	console.log(parsedbody.tracks.items[0].id);
     	//var response = res.body
        //var parsedbody = JSON.parse(response);
       	//console.log(parsedbody.body.items);
        

        
      }
  });


var server = app.listen(8888, function() {
 	     var host = server.address().address;
        var port = server.address().port;
    console.log('now listening for requests');
  
  });