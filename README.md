# soft-dev-group-code
Software development group code

This app provides a collaborative listening room for skiiers.  Skiers can choose a room then search and queue up songs that synchronize with their playback with everyone on a particular room. Queued up songs will play in order as they are put into the queue. Skiers in the same room can chat while they are listening to same music. 



## Repo Organization:
  All the relevant server files for the project are stored in liveChat file. Under liveChat, there are node_modules, resources, and views files. (Each description of the files are explained in the ReadMe of liveChat file).

### Building the Database
  If you want to run this app local you'll have to first run the following scripts into your PostgreSQL database IN ORDER:
  1. sqlScripts/db_create.sql
  2. sqlScripts/room_setup.sql
  3. sqlScripts/song_db.sql

### Running the server
  First run `npm install` from the main directory followed by `npm start`. Then, in your web browser go to [this link](http://localhost:8888/)
  In order to run the app through Herkou (our hosting platform of choice), [here is the link](https://mountain-music.herokuapp.com/login).