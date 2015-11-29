'use strict';

var interceptor = require('express-interceptor');

var navigationControllerInterceptor = interceptor(function (response) {

    return {

        isInterceptable: function () {
            return true;
        },

        intercept: function (body, send) {

            var newBody = JSON.stringify({
                page:    body,
                actions: {}
            });

            send(newBody);

        }

    };

});

module.exports = navigationControllerInterceptor;