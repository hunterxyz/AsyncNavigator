'use strict';

var interceptor = require('express-interceptor');

var navigationControllerInterceptor = interceptor(function (request, response) {

    return {

        isInterceptable: function () {

            var hasToBeIntercepted = !!request.headers['async-navigator'];

            return hasToBeIntercepted;
        },

        intercept: function (body, send) {

            var newBody = JSON.stringify({
                page: body,
                actions: {}
            });

            send(newBody);

        }

    };

});

module.exports = navigationControllerInterceptor;