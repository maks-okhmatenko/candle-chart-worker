const express = require('express');
// const compression = require('compression');
// const session = require('express-session');
// const bodyParser = require('body-parser');
// const logger = require('morgan');
// const chalk = require('chalk');
const errorHandler = require('errorhandler');
// const lusca = require('lusca');
const dotenv = require('dotenv');

dotenv.config({path: '.env'});

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

require('./connection');

app.set('host', process.env.HOST || '0.0.0.0');
app.set('port', process.env.PORT || 8080);
// app.use(compression());
// app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));
// app.use(session({
//     resave: true,
//     saveUninitialized: true,
//     secret: process.env.SESSION_SECRET,
//     cookie: {maxAge: 1209600000} // two weeks in milliseconds
// }));
// app.use(lusca.csrf());
// app.use(lusca.xframe('SAMEORIGIN'));
// app.use(lusca.xssProtection(true));

if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(express.static('public'));
    app.use(errorHandler());
} else {
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send('Server Error');
    });
}

/**
 * Start Express server.
 */
http.listen(app.get('port'), () => {
    console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
    console.log('Press CTRL-C to stop\n');
});

require('./socket-server')(io);
require('./socket-client')();

module.exports = app;
