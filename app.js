'use strict';

var config = {

    port: 12000

};

var express = require('express');
var logger = require('morgan');
var path = require('path');
var serveStatic = require('serve-static');
var compression = require('compression');
var bodyParser = require('body-parser');
var cors = require('cors');
var interceptor = require('express-interceptor');

var corsOptions = {
    origin:  '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE']
};

var app = express();


app.use(interceptor(function (response) {

    return {

        isInterceptable: function () {
            return true;
        },

        intercept: function (body, send) {
            console.log('BODY->', body, send.toString());

            var newBody = JSON.stringify({
                page:    body,
                actions: {}
            });
            console.log(newBody);
            send(newBody);

        }

    };

}));

//app.set('view engine', 'html');
app.set('port', config.port);

//app.use(cors(corsOptions));
//app.use(logger('dev'));
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(compression());

//app.use(express['static'](path.join(__dirname, 'public/')));


app.listen(app.get('port'), function () {
    console.log('Started ' + config.name + ' HTTP server on ' + app.get('port'));
});
