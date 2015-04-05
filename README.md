
PA Mentor
=========

[Planetary Annihilation](http://www.uberent.com/pa/) mod showing how your
in-game stats compare to other players, to help in learning how fast and
how much to expand your economy and production. The statistics are based on
the data collected by [PA Stats](http://pastats.com/).

![Screenshot](http://repo.orfjackal.net/pa-mods/PAMentor_v0.4.3.png)


Building
--------

Uses [Node.js](http://nodejs.org/) and [MongoDB](http://www.mongodb.org/) -
install them first. You'll need the `node` and `npm` commands to build this
project and `mongod` running in the background to run the tests.

Downloading dependencies:

    npm install

Running tests:

    mongod &
    npm test
    npm run-script autotest


Running
-------

    NODE_ENV=production node server


Known Issues
------------

Detecting the team size works automatically if you have PA Stats installed.
Otherwise you'll need to adjust it manually by clicking +/- in the UI.


Version History
---------------

### PA Mentor 0.4.3 (2015-04-05)

- Updated to work with PA v.79600
- Larger fonts

### PA Mentor 0.4.2 (2014-03-17)

- The UI frame is not anymore draggable when it's not visible

### PA Mentor 0.4.1 (2014-03-16)

- Hide when selecting the landing spot

### PA Mentor 0.4.0 (2014-03-16)

- Hide when spectating

### PA Mentor 0.3.1 (2014-02-19)

- Updated to work with PA BETA v.61250

### PA Mentor 0.3.0 (2014-02-02)

- Detect the team size automatically if PA Stats is installed

### Server Update (2014-01-31)

- Print application version on startup
- Performance optimizations

### PA Mentor 0.2.0 (2014-01-31)

- The percentiles are now based on the size of the player's team
- Will automatically detect and use a backend running on localhost

### Server Update (2014-01-30)

- For users of version 0.1.0 of this mod, the percentiles are now based on
the stats of single player teams

### Server Update (2014-01-26)

- Improved logic for downloading games from PA Stats, to avoid missing any
games
- Will not anymore run analytics immediately on server startup, if they
have been run recently, to reduce server load

### Server Update (2014-01-25)

- Fixed the time of data points to be more accurate
- If downloading a game's data from PA Stats fails, retry it soon

### Server Update (2014-01-17)

- Automatically remove the stats of old games

### Server Update (2014-01-10)

- Fixed a bug in the percentile calculations causing some low value data
points to be ignored

### Server Update (2014-01-09)

- Fixed a bug in the percentile calculations causing some random data
points to be ignored
- Show the application version on the index page

### PA Mentor 0.1.0 (2014-01-05)

- Shows how your unit count, metal and energy production and consumption
compare to all other players based on PA Stats data
