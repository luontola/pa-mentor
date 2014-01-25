
PA Mentor
=========

[Planetary Annihilation](http://www.uberent.com/pa/) mod showing how your
in-game stats compare to other players. The statistics are based on the
data from [PA Stats](http://www.nanodesu.info/pastats/).

![Screenshot](http://i.imgur.com/jIlv8db.png)


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

The statistics do not yet take into consideration that how many players are
in a team; the comparisons are not really fair when comparing single player
against a team of multiple players.


Version History
---------------

### Upcoming

- Will automatically detect and use a backend running on localhost

Backend changes; published immediately

- Fixed multiple bugs in the percentile calculations
- Show the application version on the index page
- Automatically remove the stats of old games
- If downloading a game from PA Stats fails, retry after a minute

### PA Mentor 0.1.0 (2014-01-05)

- Shows how your unit count, metal and energy production and consumption
compare to all other players based on PA Stats data
