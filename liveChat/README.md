# Node Server
This section of the repo is divided up into a few parts:
- node_modules: a directory that holds a ton of modules for node. I don't know what a lot of them are, i copied them from Lab7.
- resources: split into the following directories
  - imgs: includes the SVG files for the navbar icons
  - css: includes style sheets for individual pages
  - js: includes a script to used for the icons, though this may be unnecessary at the moment. I don't know.
- views: split into the following directories
  - pages: includes the main pages (e.g., home.ejs, login.ejs)
  - partials: includes the header and footer pages.

## server.js contents
The `server.js` file is the beef of the server. There are, as of this commit, 3 main parts.
- One manages the homepage
- One manages HTTP GET on the login page
- One manages HTTP POST on the login page (user attempting to login)
(There's also some extra content in there from lab7 i was using as a reference but you can ignore that for the most part.)
- One manages authorization, and refresh Token of Spotify API
- One manages chat system and changing room on the server side 
- One manages adding, removing and queueing up the song
