// Dependencies
const app = require('express')();
const responseTime = require('response-time');
const http = require('http');

// Allow Cross Origin, only GET request
const allowCORS = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	next();
};

// Twitter specific dependencies, setup twitter streaming proxy
const config = require('./twitter-config');
const twitterStreamHandler = require('./stream');
const twitter = require('twitter');
const twitterClient = new twitter(config);

// Setup ports & app configs
const PORT = process.env.PORT || 8080;
app.set('port', PORT);
app.use(responseTime());
app.use(allowCORS);

const server = http.createServer(app).listen(PORT, function() {
  console.log('Express server listening on port ' + PORT);
});


// Initialize socket-io
const io = require('socket.io').listen(server);
const twitterStream = twitterClient.stream('statuses/filter', {
  locations: '129.484177, 30.923179, 145.985641, 45.799878',
}, stream => { twitterStreamHandler(stream, io) });
