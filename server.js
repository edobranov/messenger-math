// Filename:    server.js
// Description: Server file for messenger bot
// Author:      EVGENI C. DOBRANOV
// Date:        12/23/2016

//var express    = require('express');
//var app        = express();
var app        = require('express')();
var bodyParser = require('body-parser');
var request    = require('request');

// Initialize the body parser (lets us get data from POST) and CORS for cross domain accessing of data
app.use(bodyParser.json());

/*
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(request, response, next) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});
*/

// Initialize the MongoDB client and establish a connection to the database
var mongoUri    = process.env.MONGOLAB_URI || process.env.MONGOHW_URL || 'mongodb://localhost/messenger-math';
var MongoClient = require('mongodb').MongoClient, format = ('util').format;
var db          = MongoClient.connect(mongoUri, function(error, databaseConnection) {
                        if (!error) {
                                console.log("DB connection successful");
                                db = databaseConnection;
                        }
                  });
// console.log(process.env.MONGOLAB_URI);
// console.log(process.env.MONGOHW_URL);

app.get('/', function (req, res) {
    res.send('Hello world!');
})

app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'mess_token_483') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
})

// Find the port number, and start the server on that port
var port = process.env.PORT || 5000
app.listen(port);
console.log("Magic happens on port " + port);