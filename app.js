'use strict';

var config = {

    port: 12000

};

var express = require('express');
var logger = require('morgan');
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
var navigationController = require('./src/express/navigation-controller');


var corsOptions = {
    origin:  '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE']
};

var app = express();

app.use(navigationController);

app.set('view engine', 'html');
app.set('port', config.port);

app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: true}));

app.use(express['static'](path.join(__dirname, 'public/')));


app.listen(app.get('port'), function () {
    console.log('Started ' + config.name + ' HTTP server on ' + app.get('port'));
});
