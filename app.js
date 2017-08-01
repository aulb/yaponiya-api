// Create an express instance
const app = require('express')();
const responseTime = require('response-time');

// Allow Cross Origin, only GET request
const allowCORS = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	next();
};

// Setup port and CORS settings
const PORT = process.env.PORT || 5000;
app.set('port', PORT);
app.use(responseTime());
app.use(allowCORS);

require('./routes')(app);

app.listen(PORT, function() {
	console.log('JAMMING PORT: ', app.get('port'));
});
