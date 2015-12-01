'use strict';

var interceptor = require('express-interceptor');

var navigationControllerInterceptor = interceptor(function (request, response) {

    return {

        isInterceptable: function () {
            console.log(request.headers);
            var hasToBeIntercepted = !!request.headers['async-navigator'];
            console.log(hasToBeIntercepted);
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