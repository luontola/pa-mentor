
PA Mentor
=========

[Planetary Annihilation](http://www.uberent.com/pa/) mod showing how your
in-game stats compare to other players. The statistics are based on the
data from [PA Stats](http://www.nanodesu.info/pastats/).

![Screenshot](http://i.imgur.com/Mam85Cd.png)


Building
--------

Uses [Node.js](http://nodejs.org/) and [MongoDB](http://www.mongodb.org/) -
install them first. You'll need the `node` and `npm` commands to build this
project and `mongod` running in the background to run the tests.

Downloading dependencies:

    npm install

Running tests:

    npm test
    npm run-script autotest


Running
-------

    NODE_ENV=production node server


Known Issues
------------

Does not yet detect automatically the size of the player's team, so the
player will need to manually adjust it by clicking +/- in the UI.


Version History
---------------

### Server Update (2014-01-31)

- Print application version on startup

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
