'use strict';
/*
 * Usage:
 * $('#asyncActions').AsyncNavigator(options);
 *
 * options:
 *
 * exclude: css selector or jQuery object
 * debug: activate the verbose mode
 * preload: content preload, default true
 */

var loaded;

var transitionEnds = 'webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd';

var handleChangeState = function () {

    var state = History.getState();
    var toCall = state.data.realPage;

    if (!toCall) {
        //in caso di back alla prima pagina d'atterraggio
        toCall = state.hash.replace(/^\.\//, '');
    }
    this.utils.callPage.call(this, toCall);

};

function waitForElementInDOM(target, element) {

    while ($(target).find(element).length === 0) {

        var doNothing;
        doNothing = null;

    }

}

function appendAndWait(target, element) {

    $(target).append(element);

    waitForElementInDOM(target, element);

}

function prependAndWait(target, element) {

    $(target).prepend(element);

    waitForElementInDOM(target, element);

}

function countProperties(obj) {

    var keys = [];
    var propCount = 0;

    for (var property in obj) {

        if (obj.hasOwnProperty(property)) {
            propCount++;
            keys.push(property);
        }

    }

    return {actions: propCount, keys: keys.join(',')};

}

function isBrowser() {

    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
    var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
    var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

    return {opera: isOpera, firefox: isFirefox, safari: isSafari, chrome: isChrome, ie: isIE};

}

function getDefaultTransition(data) {

    var actions = {};

    actions[data.selector + ' > *'] = {

        'type': 'crossFade',
        'params': {
            'cssProperties': {
                'opacity': {
                    'duration': '600',
                    'delay': '0',
                    'timing-function': 'ease'
                }
            },
            'changeContent': true,
            'initializer': {
                'function': '',
                'params': '[]'
            },
            'destroyer': {
                'function': '',
                'params': '[]'
            }
        }
    };

    return actions;

}

var utils = {

    log: function (text) {
        var self = this;
        var data = self.data('AsyncNavigator');

        if (data.debug) {
            console.log(text);
        }
    },

    logGroup: function (text) {
        var self = this;
        var data = self.data('AsyncNavigator');

        if (data.debug) {
            console.groupCollapsed(text);
        }
    },

    logGroupEnd: function () {
        var self = this;
        var data = self.data('AsyncNavigator');

        if (data.debug) {
            console.groupEnd();
        }
    },

    setEndClass: function () {
        this.removeClass('running').addClass('ended');
    },

    checkParents: function (actions) {

        var actionsError = false;
        var child = null;
        var parent = null;

        $.each(actions, function (item) {
            $.each(actions, function (item2) {
                if (item !== item2) {

                    var parents = $(item).parents();

                    if (parents.is($(item2))) {
                        child = item;
                        parent = item2;
                        actionsError = true;
                        return false;
                    }
                }
            });
        });

        return {
            error: actionsError,
            child: child,
            parent: parent
        };

    },

    getImagesOnce: function () {

        var images = [];

        $.each(this, function (i, item) {

            var tmp;

            if (item.nodeName === 'IMG') {
                tmp = $(item);
            } else {
                tmp = $(item).find('img');
            }

            $.each(tmp, function (i, image) {
                var src = image.src;
                if ($.inArray(src, images) < 0) {
                    images.push(src);
                }
            });

            var src = $(item).css('background-image');

            if (src !== 'none') {

                var res = src.match(/'(.*)'/);

                if (res) {
                    if ($.inArray(res[1], images) < 0) {
                        images.push(res[1]);
                    }
                }
            }

            $(item).find('*').each(function (i, item) {

                var src = $(item).css('background-image');

                if (src !== 'none') {

                    var res = src.match(/'(.*)'/);

                    if (res && $.inArray(res[1], images) < 0) {
                        images.push(res[1]);
                    }
                }
            });
        });

        return images;

    },

    paramsToArray: function (parameters) {

        var tmpParams;
        //with (parameters.variables) {
        //    /*jshint ignore:start*/
        //
        //    tmpParams = eval(parameters.functionObj.params/*params*/);
        //
        //    $.each(tmpParams, function (i, item) {
        //        if (typeof item === 'object' && item !== null) {
        //            $.each(item, function (i2, item2) {
        //                if (typeof item2 === 'object') {
        //                    tmpParams[i][i2] = item2;
        //                } else {
        //                    try {
        //                        if (typeof eval(item2) === 'object') {
        //                            tmpParams[i][i2] = eval(item2);
        //                        } else {
        //                            tmpParams[i][i2] = item2;
        //                        }
        //                    }
        //                    catch (e) {
        //                        tmpParams[i][i2] = item2;
        //                    }
        //                }
        //            });
        //        }
        //    });
        //    /*jshint ignore:end*/
        //}
        return tmpParams;

    },

    testFunction: function (obj) {

        var test = false;

        if (typeof obj === 'object') {
            if (obj['function'] !== '' && obj['function'] !== undefined) {
                test = true;
            }
        }
        return (test);
    },

    pushState: function (link) {
        var self = this;
        var data = self.data('AsyncNavigator');

        if (History) {

            var savedStates = History.savedStates.length;
            var myHost = window.location.protocol + '//' + window.location.hostname;
            //se l'host à¨ uguale dall'host da cui parte la chiamata
            var realPagePos = link.href.replace(myHost, '').indexOf('/');
            var realPage = link.href.substring(realPagePos + 1 + myHost.length);

            History.pushState({realPage: realPage}, '', link.href);
            //se non si chiama la stessa pagina in cui ci si trova:
            if (savedStates !== History.savedStates.length) {
                utils.log.call(self, 'INIZIO TRANSIZIONI Plug-in Disattivato');
                data.overlay = $('<div/>').css({
                    width: '100%',
                    height: '100%',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    'z-index': 2147483647,
                    cursor: 'wait'
                });

                if (data.debug) {
                    data.overlay.css({
                        'background-color': '#000',
                        opacity: 0.03
                    });
                }
                if (data.enableOverlay) {
                    self.append(data.overlay);
                }

                data.loader.addClass('loading');
                /*
                 data.anchorsSet.off('click.AsyncNavigator');
                 $('body').on('click.AsyncNavigator','a',function()
                 {
                 methods.queueLink.call(me, this.href);
                 return false;
                 });
                 */
            }
        } else {
            utils.callPage.call(self, link.href);
            data.loader.addClass('loading');
        }
    },

    managePage: function (res) {
        //		if(res.error)
        //		{
        //			log(res);
        //		}
        //		else
        //		{
        var self = this;
        var data = self.data('AsyncNavigator');

        var page = res.page;
        var actions = res.actions;
        var check = {};

        if (actions) {
            check = utils.checkParents(actions);
        } else {
            check.error = false;
        }

        if (check.error) {
            $.error('L\'animazione su ' + check.child + ' non può essere assegnata in quanto esiste già  un\'animazione assegnata al padre ' + check.parent);
            return false;
        } else {
            data.ajaxData = res;
            delete res.actions;
            delete res.page;
            utils.applyTransition.call(self, page, actions, res);
        }
        //	}
    },

    callPage: function (url) {

        var self = this;
        //clean url
        url = url.replace(/^\//, '');
        url = url.replace(/\/$/, '');

        var data = self.data('AsyncNavigator');

        data.prevState = data.prevState.replace(/^\//, '');
        data.prevState = data.prevState.replace(/\/$/, '');
        data.prevState = data.prevState.replace(/&.*/, '');

        data.actionsError = false;
        //TODO customizzare tramite le opzioni i seguenti parametri
        //index.php
        //q,ajaxCall e prevPageUrl
        var tmpData = {
            prevPageUrl: data.prevState
        };

        if (tmpData.prevPageUrl === '404') {
            data.prevState = '';
        }

        $.ajax({
            url: url + '?' + new Date().getTime(),
            type: 'get',
            dataType: 'json',
            headers: {
                'async-navigator': 'async-navigator',
                'Content-Type': 'application/json'
            },

            success: function (res) {
                utils.managePage.call(self, res);
            },

            error: function (res) {
                utils.managePage.call(self, $.parseJSON(res.responseText));
            },

            complete: function (xhr) {
                if (xhr.status === 404) {
                    data.prevState = '404';
                }
            }
        });
    },

    elementReady: function (key) {

        var data = this.data('AsyncNavigator');

        utils.log.call(this, key + ' ' + (data.elementReady + 1) + '/' + data.actionsNumber);

        if (data.actionsNumber > 0) {
            data.elementReady++;
            if (data.actionsNumber === data.elementReady) {
                utils.log.call(this, '########################### READY ' + data.elementReady + '/' + data.actionsNumber + ' Plug-in Attivato sui nuovi elementi');
                //re-initialization
                data.elementReady = 0;
                $('body a').off('click.AsyncNavigator');
                this.find(data.keys).off(transitionEnds);

                $(data.selector).AsyncNavigator(data.originalSettings);
                $(data.selector).trigger('AsyncNavigator/transitionEnded', data.ajaxData);

            }
        }
    },

    transitionEnded: function () {
        return;
        /*
         var self = this;
         var data = self.data('AsyncNavigator');
         utils.log.call(self, key + ' ' + (data.endedActions + 1) + '/' + data.actionsNumber);
         if (data.actionsNumber > 0) {
         data.endedActions++;
         if (data.actionsNumber === data.endedActions) {
         utils.log.call(self, '-------------------------------------------------------------FINE TRANSIZIONI ' + data.endedActions + '/' + data.actionsNumber + ' Plug-in Riattivato');
         //re-inizializzazione su tutti gli elementi a cui à¨ stato applicato il plugin
         data.endedActions = 0;
         $('body a').off('click.AsyncNavigator');

         //$(window).off('.AsyncNavigator');
         $(data.selector).AsyncNavigator(data.originalSettings);
         $(data.selector).trigger('AsyncNavigator/transitionEnded', data.ajaxData);
         if (data.lastClick) {
         utils.log.call(self, 'Calling last clicked link: ' + '$([href="' + data.lastClick + '"])');
         $('[href="' + data.lastClick + '"]').first().click();
         data.lastClick = null;
         }
         }
         }*/
    },

    execFunction: function (parameters) {
        /*
         * parameters contiene:
         * scopeObj: oggetto su cui lanciare la funzione
         * functionObj: JSON con nome della funzione e parametri
         * variables: variabili riferite alla pagina tali da poterli eseguire direttamente
         * */
        var self = this;
        var f = parameters.functionObj;
        var testFunction = utils.testFunction(f);

        if (testFunction) {
            utils.logGroup.call(self, f['function'] + ' OK');
            utils.log.call(self, f);
            utils.log.call(self, f['function'] + '(' + f.params + ')');
            utils.logGroupEnd.call(self);
            /*jshint ignore:start*/
            var tmpParams = utils.paramsToArray(parameters);
            eval(f['function']).apply(parameters.scopeObj, tmpParams);
            /*jshint ignore:end*/
        } else {
            utils.logGroup.call(self, 'SKIP');
            utils.log.call(self, f);
            utils.log.call(self, f['function'] + '(' + f.params + ')');
            utils.logGroupEnd.call(self);
        }
    },

    handleImageLoad: function (totalImagesNumber, image, callback) {

        var self = this;
        var toPreload = $('<img/>');

        toPreload.load(function () {

            loaded++;
            utils.log.call(self, 'LOADED #' + loaded + ' images-- ' + this.src);

            if (loaded === totalImagesNumber) {
                utils.log.call(self, 'Calling Callback... (on Load)');
                //	utils.logGroupEnd.call(self);
                callback.call(self);

            }
        }).error(function () {

            loaded++;
            utils.log.call(self, 'ERROR #' + loaded + ' images-- ' + this.src);

            if (loaded === totalImagesNumber) {
                utils.log.call(self, 'Calling Callback... (on Error)');
                //		utils.logGroupEnd.call(self);
                callback.call(self);
            }

        }).attr('src', image);

    },

    preload: function ($element, callback) {

        loaded = 0;
        var self = this;
        var data = self.data('AsyncNavigator');

        if (data.preload) {

            var images = utils.getImagesOnce.call($element);
            var totalImagesNumber = images.length;

            utils.log.call(self, 'Images to load (' + totalImagesNumber + ')');

            for (var index = 0; index < images.length; index++) {

                var image = images[index];
                this.handleImageLoad(totalImagesNumber, image, callback);

            }

            if (totalImagesNumber === 0) {
                utils.log.call(self, 'No images to preload, calling Callback');
                callback.call(self);
            }

        } else {
            utils.log.call(self, 'Calling Callback... (No preload)');
            callback.call(self);
        }
    },

    getCssProperties: function (properties) {

        var self = this;
        var data = self.data('AsyncNavigator');
        var totalDuration = 0;
        var transitionValue = {};
        var values = [];

        if (properties['in'] && properties['in'] !== 'fake') {

            properties['in']['in'] = 'fake';
            properties.out['in'] = 'fake';
            var valuesIn = utils.getCssProperties.call(self, properties['in']);
            var valuesOut = utils.getCssProperties.call(self, properties.out);

            return {'in': valuesIn, 'out': valuesOut};

        } else if (!properties['in']) {
            properties['in'] = 'fake';
            var tmp = utils.getCssProperties.call(self, properties);
            return {'in': tmp, 'out': tmp};
        }

        delete properties['in'];

        var maxDurationProperty = '';
        var maxDuration = 0;
        var tmpProperties = {};

        $.each(properties, function (cssProperty, val) {

            if (cssProperty === 'transform' || cssProperty === 'transform-origin') {
                cssProperty = data.prefix + cssProperty;
            }

            var transition = [
                cssProperty,
                (val.duration || 0) + 'ms',
                (val['timing-function'] || 'ease'),
                (val.delay || 0) + 'ms'
            ].join(' ');

            var delay = parseInt(val.delay, 10);
            var duration = parseInt(val.duration, 10);
            var tmpDuration = (delay || 0) + (duration || 0);

            if (tmpDuration > totalDuration) {
                totalDuration = tmpDuration;
                maxDurationProperty = cssProperty;
                maxDuration = val.duration;
            }

            values.push(transition);

            tmpProperties[cssProperty] = val.value;

        });

        var cssValue = values.join(',');

        transitionValue[data.prefix + 'transition'] = cssValue;
        $.extend(transitionValue, tmpProperties);

        return {
            durationValues: {
                property: maxDurationProperty,
                duration: maxDuration
            },
            cssValue: cssValue,
            transitionValue: transitionValue
        };
    },

    applyTransition: function (page, actions, variables) {

        var self = this;
        var allItems = $();
        var countEach = 0;
        var data = self.data('AsyncNavigator');

        if ($.isEmptyObject(actions)) {
            actions = getDefaultTransition(data);
        }

        var tmp = countProperties.call(this, actions);

        data.actionsNumber = tmp.actions;
        data.keys = tmp.keys;

        utils.log.call(self, 'Total actions = ', data.actionsNumber);

        page = $('<div/>').append($.parseHTML(page));
        variables.page = page;

        $.each(actions, function (selector) {

            var tmp = page.find(selector.replace('body', ''));

            $.merge(allItems, tmp);

            if ((++countEach) === data.actionsNumber) {
                utils.preload.call(self, allItems, function () {
                    data.loader.removeClass('loading');
                    utils.playTransitions.call(self, page, actions, variables);
                });
            }
        });
    },

    animation: {

        common: {

            add: function (value, elementInDOM, incomingElement, variables, key, target) {

                var self = this;

                //check sull'esistenza dell'oggetto nel DOM
                if (elementInDOM.length) {
                    //distruttore
                    utils.execFunction.call(self, {
                        scopeObj: elementInDOM,
                        functionObj: value.params.destroyer,
                        variables: variables
                    });
                    //rimozione dal DOM
                    elementInDOM.remove();
                }
                //check sull'esistenza dell'oggetto nella pagina chiamata
                if (incomingElement.length) {
                    //inserimento oggetto nel DOM tramite il target
                    var appended = $(target).append(incomingElement);
                    utils.elementReady.call(self, key);
                    //inizializzatore
                    utils.execFunction.call(self,
                        {
                            scopeObj: appended,
                            functionObj: value.params.initializer,
                            variables: variables
                        });
                    //chiamata di fine animazione
                    utils.transitionEnded.call(self, 'ADDED: ' + key);
                    utils.setEndClass.call(incomingElement);
                } else {
                    utils.elementReady.call(self, key);
                    //se l'oggetto non viene trovato nella pagina entrante
                    //viene chiamata direttamente la funzione di fine animazione
                    utils.transitionEnded.call(self, 'REMOVED: ' + key);
                }
            },

            crossSlide: {

                init: function (value, elementInDOM, incomingElement, variables) {

                    var self = this;
                    var prop = utils.getCssProperties.call(self, value.params.cssProperties);
                    var transitionValue = prop['in'].transitionValue;
                    var wrapper = $($.parseHTML('<div/>'));
                    var content = $($.parseHTML('<div/>'));

                    elementInDOM.data('property', prop.out.durationValues.property);
                    content.data('property', prop.out.durationValues.property);
                    content.data('duration', prop.out.durationValues.duration);

                    content.data('elementInDOM', elementInDOM);
                    content.data('incomingElement', incomingElement);


                    var elementInDOMWidth = elementInDOM.width();
                    var elementInDOMHeight = elementInDOM.height();

                    elementInDOM.width(elementInDOMWidth);
                    elementInDOM.height(elementInDOMHeight);
                    incomingElement.width(elementInDOMWidth);
                    incomingElement.height(elementInDOMHeight);

                    var contentCss;
                    var action;
                    var reset;

                    switch (elementInDOM.data('property')) {
                        case 'top':		//prepend
                            reset = {'top': 0};
                            action = 'before';
                            contentCss = {
                                'top': -elementInDOMHeight,
                                'left': 0,
                                'height': elementInDOMHeight * 2,
                                'width': elementInDOMWidth
                            };
                            break;
                        case 'bottom':	//append
                            reset = {'bottom': elementInDOMHeight};
                            action = 'after';
                            contentCss = {
                                'bottom': 0,
                                'left': 0,
                                'height': elementInDOMHeight * 2,
                                'width': elementInDOMWidth
                            };
                            break;
                        case 'right':	//append
                            elementInDOM.css('float', 'left');
                            incomingElement.css('float', 'left');
                            reset = {'right': elementInDOMWidth};
                            action = 'after';
                            contentCss = {
                                'top': 0,
                                'right': 0,
                                'width': elementInDOMWidth * 2,
                                'height': elementInDOMHeight
                            };
                            break;
                        case 'left':	//prepend
                            elementInDOM.css('float', 'left');
                            incomingElement.css('float', 'left');
                            reset = {'left': 0};
                            action = 'before';
                            contentCss = {
                                'top': 0,
                                'left': -elementInDOMWidth,
                                'width': elementInDOMWidth * 2,
                                'height': elementInDOMHeight
                            };
                            break;
                    }

                    contentCss.position = 'relative';

                    var wrapperCss = {
                        'overflow': 'hidden',
                        'width': elementInDOMWidth,
                        'height': elementInDOMHeight
                    };

                    content.css(transitionValue);
                    content.css(contentCss);
                    wrapper.css(wrapperCss);

                    elementInDOM.wrap(wrapper).wrap(content);
                    elementInDOM[action](incomingElement);

                    utils.execFunction.call(self, {
                        scopeObj: incomingElement,
                        functionObj: value.params.initializer,
                        variables: variables
                    });

                    return {
                        content: elementInDOM.parent(),
                        reset: reset
                    };
                },

                destroy: function (value, variables, handledElement, key) {

                    var self = this;
                    //esecuzione distruttore
                    utils.execFunction.call(self, {
                        scopeObj: handledElement.data('elementInDOM'),
                        functionObj: value.params.destroyer,
                        variables: variables
                    });

                    //rimozione dal DOM
                    handledElement.data('elementInDOM').remove();

                    var incomingElement = handledElement.data('incomingElement');

                    incomingElement.unwrap();
                    incomingElement.unwrap();
                    incomingElement.css({
                        width: '',
                        height: '',
                        'float': ''
                    });
                    utils.log.call(self, 'FINE ANIMAZIONE D\' USCITA(SLIDE) ' + key);

                    //chiamata di fine animazione
                    utils.transitionEnded.call(self, key);
                    utils.setEndClass.call(incomingElement);
                    utils.elementReady.call(self, key);
                }
            },

            transition: {

                init: function (elementInDOM, incomingElement, cssProperties) {

                    var self = this;
                    var prop = utils.getCssProperties.call(self, cssProperties);

                    elementInDOM.data('property', prop.out.durationValues.property);
                    elementInDOM.data('duration', prop.out.durationValues.duration);
                    elementInDOM.data('propertyIn', prop['in'].durationValues.property);
                    elementInDOM.data('durationIn', prop['in'].durationValues.duration);
                    incomingElement.data('property', prop['in'].durationValues.property);
                    incomingElement.data('duration', prop['in'].durationValues.duration);

                    return {
                        cssValue: prop['in'].cssValue,
                        cssValueOut: prop.out.cssValue,
                        transitionValue: prop['in'].transitionValue,
                        transitionValueOut: prop.out.transitionValue
                    };
                },

                destroy: function () {
                }

            },

            crossFade: {

                init: function () {
                },
                destroy: function () {
                }

            }

        },

        jquery: {

            transition: function (value, elementInDOM, incomingElement, variables, key, target) {

                var self = this;
                var cssValues = {};
                var cssIeValues = {};
                var duration = {};
                var counter = 0;
                var originalPositions = {};
                var delay = {};

                //creazione propietà  css da applicare agli elementi
                //le proprietà  css3 vengono eliminate per incopatibilità  del browser
                //opacity viene convertito con i filtri alpha riconosciuti da Internet Explorer
                $.each(value.params.cssProperties, function (direction, properties) {

                    counter = 0;
                    originalPositions[direction] = {};
                    cssIeValues[direction] = {};
                    cssValues[direction] = {};
                    duration[direction] = 0;
                    delay[direction] = 0;

                    $.each(properties, function (i, val) {

                        counter++;
                        if (i !== 'transform' || i !== 'transform-origin') {
                            cssValues[direction][i] = val.value;
                            duration[direction] += parseInt(val.duration, 10);
                            duration[direction] = duration[direction] / counter; //media durata

                            if (parseInt(val.delay, 10) === 0) {
                                delay[direction] += 0;
                            } else {
                                delay[direction] += parseInt(val.delay, 10);
                            }

                            delay[direction] = delay[direction] / counter; //media durata

                            originalPositions[direction][i] = elementInDOM.css(i) || 0;
                            if (i === 'opacity') {
                                i = 'filter';
                                val.value = 'alpha(opacity = ' + parseFloat(val.value) * 100 + ')';
                            }
                            cssIeValues[direction][i] = val.value;

                        }
                    });

                });

                if (elementInDOM.length) {
                    //salvataggio nell'oggetto delle proprietà  CSS originali
                    elementInDOM.data('originalPositions', originalPositions['in']);
                    elementInDOM.data('duration', duration['in']);
                    elementInDOM.data('delay', delay['in']);
                    //animazione delle proprietà  CSS impostate
                    setTimeout(function () {

                        elementInDOM.animate(cssValues.out, duration.out, function () {

                            var handledElement = $(this);
                            var originalPositions = handledElement.data('originalPositions');
                            var avgDuration = handledElement.data('duration');
                            var avgDelay = handledElement.data('delay');
                            var relatedElement = handledElement.data('relatedElement');

                            if (relatedElement.length) {

                                if (value.params.changeContent) {

                                    handledElement.replaceWith(relatedElement.css(cssValues.out));
                                    utils.execFunction.call(self, {
                                        scopeObj: relatedElement,
                                        functionObj: value.params.initializer,
                                        variables: variables
                                    });
                                }

                                setTimeout(function () {
                                    relatedElement.animate(originalPositions, avgDuration, function () {
                                        utils.elementReady.call(self, key);
                                        utils.transitionEnded.call(self, key);
                                        utils.setEndClass.call(relatedElement);
                                    });
                                }, avgDelay);

                            } else {

                                utils.execFunction.call(self, {
                                    scopeObj: handledElement,
                                    functionObj: value.params.destroyer,
                                    variables: variables
                                });
                                handledElement.remove();
                                utils.elementReady.call(self, key);
                                utils.transitionEnded.call(self, key);
                            }
                        });

                    }, delay.out);

                } else {

                    if (incomingElement.length) {

                        var endPositions = cssValues['in'];

                        incomingElement.css(cssIeValues.out);

                        appendAndWait(target, incomingElement);

                        incomingElement.data('startPositions', cssValues.out);

                        //initialization
                        utils.execFunction.call(self, {
                            scopeObj: incomingElement,
                            functionObj: value.params.initializer,
                            variables: variables
                        });

                        incomingElement.animate(endPositions, duration['in'], function () {
                            utils.elementReady.call(self, key);
                            utils.transitionEnded.call(self, key);
                            utils.setEndClass.call(incomingElement);
                        });
                    }
                }
            },

            crossFade: function (value, elementInDOM, incomingElement, variables, key, target) {

                var self = this;
                var duration = parseInt(value.params.cssProperties.opacity.duration, 10);

                elementInDOM.css('z-index', 2);
                if (elementInDOM.length) {
                    elementInDOM.fadeOut(duration, function () {
                        var handledElement = $(this);
                        var relatedElement = handledElement.data('relatedElement');
                        utils.execFunction.call(self,
                            {
                                scopeObj: handledElement,
                                functionObj: value.params.destroyer,
                                variables: variables
                            });
                        handledElement.remove();

                        if (!relatedElement.length) {
                            utils.log.call(self, 'FINE ANIMAZIONE D\' USCITA ' + key);
                            utils.elementReady.call(self, key);
                            utils.transitionEnded.call(self, key);
                        }
                    });

                    if (incomingElement.length) {
                        incomingElement.css('z-index', 1);

                        prependAndWait(elementInDOM.parent(), incomingElement);

                        utils.execFunction.call(self, {
                            scopeObj: incomingElement,
                            functionObj: value.params.initializer,
                            variables: variables
                        });

                        utils.log.call(self, 'FINE ANIMAZIONE D\' ENTRATA' + key);
                        utils.transitionEnded.call(self, key);
                        utils.elementReady.call(self, key);
                        utils.setEndClass.call(incomingElement);
                        /*	});*/
                    }
                } else {
                    if (incomingElement.length) {

                        incomingElement.css('z-index', 1);

                        prependAndWait(target, incomingElement.css('opacity', 0.01));

                        utils.execFunction.call(self, {
                            scopeObj: incomingElement,
                            functionObj: value.params.initializer,
                            variables: variables
                        });

                        incomingElement.animate({'opacity': 1}, duration, function () {
                            utils.log.call(self, 'FINE ANIMAZIONE D\'ENTRATA ' + key);
                            utils.elementReady.call(self, key);
                            utils.transitionEnded.call(self, key);
                            utils.setEndClass.call(incomingElement);
                        });
                    }
                }
            },

            crossSlide: function (value, variables, animationData, key) {

                var self = this;

                animationData.content.animate(animationData.reset, animationData.content.data('duration'), function () {
                    utils.animation.common.crossSlide.destroy.call(self, value, variables, $(this), key);
                });
            }

        },

        css3: {

            transition: function (value, elementInDOM, incomingElement, variables, key, target) {

                var self = this;
                var data = self.data('AsyncNavigator');
                var transition = data.prefix + 'transition';
                var prop = utils.animation.common.transition.init.call(self, elementInDOM, incomingElement, value.params.cssProperties);

                if (elementInDOM.length) {
                    // esce elementInDOM
                    elementInDOM.css(transition, prop.cssValueOut);
                    elementInDOM.on(transitionEnds, function (e) {
                        var handledElement = $(this);
                        //se viene notificato l'evento che dura più a lungo tenendo conto del delay
                        if (e.originalEvent.propertyName === handledElement.data('property') /*&& (parseInt(Math.round(e.originalEvent.elapsedTime*1000)) === andledElement.data('duration')*/) {
                            //eliminazione dell'evento
                            handledElement.off(transitionEnds);
                            var relatedElement = handledElement.data('relatedElement');
                            if (value.params.changeContent) {
                                //se l'elemento esiste nella pagina entrante
                                if (relatedElement.length) {
                                    //esecuzione del distruttore
                                    utils.execFunction.call(self, {
                                        scopeObj: handledElement,
                                        functionObj: value.params.destroyer,
                                        variables: variables
                                    });

                                    // entra incomingElement
                                    //copia dello stile tra gli elementi
                                    relatedElement.attr('style', handledElement.attr('style'));

                                    //rimpiazzamento elementi
                                    handledElement.replaceWith(relatedElement);
                                    utils.elementReady.call(self, key);

                                    //inizializzatore
                                    utils.execFunction.call(self, {
                                        scopeObj: relatedElement,
                                        functionObj: value.params.initializer,
                                        variables: variables
                                    });

                                    /*********************************************/
                                    //handling dell'evento d'entrata?
                                    relatedElement.on(transitionEnds, function (e) {
                                        var handledElement = $(this);
                                        if (e.originalEvent.propertyName === handledElement.data('property') /*&& (parseInt(Math.round(e.originalEvent.elapsedTime*1000)) === andledElement.data('duration')*/) {
                                            //eliminazione dell'evento
                                            handledElement.off(transitionEnds);

                                            utils.log.call(self, 'FINE ANIMAZIONE D\'ENTRATA(TRANSITION)(1208) ' + key);
                                            //chiamata di fine animazione
                                            //utils.elementReady.call(self,key)
                                            utils.transitionEnded.call(self, key);
                                            utils.setEndClass.call(handledElement);
                                        }
                                    });
                                    /*********************************************/

                                    //reset dello stile per la creazione dell'animazione contraria
                                    setTimeout(function () {
                                        relatedElement.css(prop.transitionValue);
                                    }, 5);

                                } else {

                                    utils.execFunction.call(self, {
                                        scopeObj: handledElement,
                                        functionObj: value.params.destroyer,
                                        variables: variables
                                    });
                                    handledElement.remove();
                                    //utils.elementReady.call(self,key)
                                    utils.log.call(self, 'FINE ANIMAZIONE D\'USCITA(TRANSITION) ' + key);
                                    //chiamata di fine animazione
                                    utils.elementReady.call(self, key);
                                    utils.transitionEnded.call(self, key);
                                    //non serve perchà© l'elemento à¨ stato rimosso dal DOM
                                    //utils.setEndClass.call(handledElement);
                                }

                            } else {// elementInDOM deve rientrare
                                //inizializzatore
                                //utils.elementReady.call(self,key)
                                utils.execFunction.call(self, {
                                    scopeObj: elementInDOM,
                                    functionObj: value.params.initializer,
                                    variables: variables
                                });
                                /*********************************************/
                                //handling dell'evento d'entrata?
                                elementInDOM.on(transitionEnds, function (e) {
                                    var handledElement = $(this);
                                    var elapsedTime = parseInt(Math.round(e.originalEvent.elapsedTime * 1000), 10);

                                    if (e.originalEvent.propertyName === handledElement.data('propertyIn') && elapsedTime === handledElement.data('durationIn')) {
                                        //eliminazione dell'evento
                                        handledElement.off(transitionEnds);

                                        utils.log.call(self, 'FINE ANIMAZIONE D\'ENTRATA(TRANSITION)(1160) ' + key);
                                        //chiamata di fine animazione
                                        //utils.elementReady.call(self,key)
                                        utils.transitionEnded.call(self, key);
                                        utils.setEndClass.call(handledElement);
                                    }
                                });
                                /*********************************************/
                                //reset dello stile per la creazione dell'animazione contraria
                                setTimeout(function () {
                                    elementInDOM.css(prop.transitionValue);
                                }, 5);
                            }
                        }
                    });

                    //salvataggio dei dati per la transizione
                    elementInDOM.data('transition', transition + ':' + prop.cssValue);
                    //impostazione dei dati per la transizione
                    setTimeout(function () {
                        elementInDOM.css(prop.transitionValueOut);
                    }, 5);

                } else {

                    if (incomingElement.length) {
                        //entra incomingElement
                        //impostazione dei parametri di partenza con i valori di OUT
                        incomingElement.css(prop.transitionValueOut);
                        incomingElement.css(transition, prop.transitionValue[transition]);
                        //inserimento elemento d'entrata nel DOM
                        $(target).append(incomingElement);
                        //utils.elementReady.call(self,key);
                        utils.execFunction.call(self, {
                            scopeObj: incomingElement,
                            functionObj: value.params.initializer,
                            variables: variables
                        });

                        incomingElement.on(transitionEnds, function (e) {
                            var handledElement = $(this);
                            if (e.originalEvent.propertyName === handledElement.data('property') /*&& (parseInt(Math.round(e.originalEvent.elapsedTime*1000)) === andledElement.data('duration')*/) {
                                //eliminazione dell'evento
                                handledElement.off(transitionEnds);

                                utils.log.call(self, 'FINE ANIMAZIONE D\'ENTRATA(TRANSITION)(1203) ' + key);
                                //chiamata di fine animazione
                                utils.elementReady.call(self, key);
                                utils.transitionEnded.call(self, key);
                                utils.setEndClass.call(handledElement);
                            }
                        });

                        setTimeout(function () {
                            incomingElement.css(prop.transitionValue);
                        }, 5);

                    }
                }
            },

            crossFade: function (value, elementInDOM, incomingElement, variables, key, target) {
                var self = this;
                var data = self.data('AsyncNavigator');

                var params = value.params.cssProperties.opacity;
                //costruzione della transizione css3 da applicare all'elemento
                var cssParam = 'opacity ' + params.duration + 'ms ' + params['timing-function'] + ' ' + params.delay + 'ms';
                //salvataggio dati
                elementInDOM.data('duration', params.duration);
                incomingElement.data('duration', params.duration);
                //bind di fine animazione
                elementInDOM.on(transitionEnds, function (e) {
                    var handledElement = $(this);
                    //se viene notificata la fine dell'evento che dura più a lungo
                    if (e.originalEvent.propertyName === 'opacity' /*&& (parseInt(Math.round(e.originalEvent.elapsedTime*1000)) === andledElement.data('duration')*/) {
                        //eliminazione dell'evento
                        handledElement.off(transitionEnds);
                        //esecuzione distruttore
                        utils.execFunction.call(self,
                            {
                                scopeObj: handledElement,
                                functionObj: value.params.destroyer,
                                variables: variables
                            });
                        var relatedElement = handledElement.data('relatedElement');
                        //rimozione dal DOM
                        handledElement.remove();
                        utils.elementReady.call(self, key);
                        utils.log.call(self, 'FINE ANIMAZIONE D\'USCITA(FADE) ' + key);
                        //chiamata di fine animazione
                        utils.transitionEnded.call(self, key);
                        utils.setEndClass.call(relatedElement);
                    }
                });

                if (incomingElement.length) {
                    if (elementInDOM.length) {
                        elementInDOM.css('z-index', 2);
                        elementInDOM.first().before(incomingElement.css('z-index', 1));
                    } else {
                        incomingElement.css('opacity', 0);
                        $(target).prepend(incomingElement.css('z-index', 1));
                    }
                    if (elementInDOM.length) {
                        //esecuzione inizializzatore
                        utils.execFunction.call(self, {
                            scopeObj: incomingElement,
                            functionObj: value.params.initializer,
                            variables: variables
                        });
                    } else {
                        incomingElement.on(transitionEnds, function (e) {

                            var handledElement = $(this);

                            if (e.originalEvent.propertyName === 'opacity' /*&& (parseInt(Math.round(e.originalEvent.elapsedTime*1000)) === andledElement.data('duration')*/) {
                                handledElement.off(transitionEnds);
                                utils.log.call(self, 'FINE ANIMAZIONE D\'ENTRATA(FADE)' + key);
                                utils.elementReady.call(self, key);
                                //chiamata di fine animazione
                                utils.transitionEnded.call(self, key);
                                utils.setEndClass.call(handledElement);
                            }
                        });
                        //impostazione parametri di animazione
                        incomingElement.css(data.prefix + 'transition', cssParam);

                        setTimeout(function () {
                            //esecuzione inizializzatore
                            utils.execFunction.call(self, {
                                scopeObj: incomingElement,
                                functionObj: value.params.initializer,
                                variables: variables
                            });
                            //delay di 5ms per far rendere conto al browser che la proprietà  à¨ cambiata
                            incomingElement.css('opacity', 1);
                        }, 5);
                    }
                }
                elementInDOM.css(data.prefix + 'transition', cssParam);
                setTimeout(function () {
                    //delay di 5ms per far rendere conto al browser che la proprietà  à¨ cambiata
                    elementInDOM.css('opacity', 0);
                }, 5);
            },

            crossSlide: function (value, variables, animationData, key) {

                var self = this;

                animationData.content.on(transitionEnds, function (e) {
                    var handledElement = $(this);
                    if (e.originalEvent.propertyName === handledElement.data('property') /*&& (parseInt(Math.round(e.originalEvent.elapsedTime*1000)) === andledElement.data('duration')*/) {
                        //eliminazione dell'evento
                        handledElement.off(transitionEnds);

                        utils.animation.common.crossSlide.destroy.call(self, value, variables, handledElement, key);
                    }
                });

                setTimeout(function () {
                    animationData.content.css(animationData.reset);
                }, 10);
            }
        }
    },

    playTransitions: function (page, actions, variables) {

        var self = this;

        //	utils.logGroup.call(self,'processing');
        $.each(actions, function (key, value) {
            utils.log.call(self, key);
            //target: 'body' come default
            var target;
            if (value.params.target) {
                target = value.params.target;
            } else {
                target = 'body';
            }
            //changeContent: true come default
            if (value.params.changeContent === undefined) {
                value.params.changeContent = true;
            }

            var elementInDOM = $(key);
            elementInDOM.removeClass('ended').addClass('running');
            // il body non viene parsato da jQuery
            // quindi per selezionare l'intero contenuto
            // à¨ necessario eliminare il body dalla ricerca
            // per es. se si deve cercare 'body > *'
            // il selettore verrà  convertito in '> *'
            var selector = key.replace('body', '');
            //rimuove eventulai meta tag rimasti
            var incomingElement = page.find(selector).not('meta');

            incomingElement.removeClass('ended').addClass('running');

            elementInDOM.data('relatedElement', incomingElement);
            incomingElement.data('relatedElement', elementInDOM);

            //se il selettore non viene trovato ne nel DOM ne nella pagina entrante
            if (!elementInDOM.length && !incomingElement.length) {
                utils.log.call(self, key + ' non trovata in nesuna delle pagine');
                utils.elementReady.call(self, key);
                //chiamata di fine animazione
                utils.transitionEnded.call(self, key + ' NOT FOUND');

                return; //continua il ciclo 'each'
            }
            //l'aggiunta di un elemento à¨ indipendente dal browser utilizzato
            var animationData;
            if (value.type === 'add') {
                utils.animation.common.add.call(self, value, elementInDOM, incomingElement, variables, key, target);
            } else {

                var animationHandler = isBrowser().ie ? 'jquery' : 'css3';
                var animator = utils.animation[animationHandler];

                switch (value.type) {
                    case 'transition':
                        animator.transition.call(self, value, elementInDOM, incomingElement, variables, key, target);
                        break;
                    case 'crossFade':
                        //l'opzione crossFade necessita della proprietà  opacity
                        //per la customizzazione del delay e della durata
                        //l'effetto sarà  sempre quello di far sparire
                        //completamente l'elemento per poi sostituirlo nel DOM
                        animator.crossFade.call(self, value, elementInDOM, incomingElement, variables, key, target);
                        break;
                    case 'crossSlide':
                        animationData = utils.animation.common.crossSlide.init.call(self, value, elementInDOM, incomingElement, variables, key, target);
                        animator.crossSlide.call(self, value, variables, animationData, key);
                        break;
                    default:
                        utils.log.call(self, 'Valore Type non riconosciuto ' + value.type);
                        break;
                }

            }
        });
    }

};

var initHistory = function () {

    var firstLoad = false;

    if (!this.data('AsyncNavigator')) {
        this.data('AsyncNavigator', {});
        firstLoad = true;
        if (History) {
            if (window.location.hash !== '') {
                //eliminazione dello stato fake che History recupera dall'hash (fix per IE/html4)
                History.savedStates.length = [History.savedStates.length - 1];
                History.storedStates.length = [History.storedStates.length - 1];
            }
        }
    }
    var data = this.data('AsyncNavigator');

    if (data.prevState === '404') {
        data.prevState = '404';
    } else {
        data.prevState = window.location.pathname.substring(1);
    }
    if (!firstLoad) {
        if (window.location.hash !== '') {
            data.prevState = window.location.hash.replace(/#[\.\/]*/, ''); //fix per IE
            data.prevState = data.prevState.replace(/\?.*/, ''); //fix per IE
        }
    }
    if (History) {
        //bind per History
        $(window).off('statechange.AsyncNavigator');
        $(window).on('statechange.AsyncNavigator', $.proxy(handleChangeState, this));
    }

};

(function ($) {
    //fallback per le versioni di jQuery < 1.8
    if (!$.isFunction($.parseHTML)) {

        $.parseHTML = function (html) {
            return $(html);
        };
    }

    var methods = {

        bindAsyncNavigation: function ($extraData) {

            var $toBind;
            var self = this;
            var data = this.data('AsyncNavigator');

            if (!data && !$extraData) {
                console.error('No data to bind!');
                return false;
            } else {
                if (!data && $extraData.length) {
                    $toBind = $extraData;
                } else {
                    $toBind = data.anchorsSet;
                }
            }

            $toBind.on('click.AsyncNavigator', function () {
                // host completo di baseurl attuale
                var myHost = window.location.protocol + '//' + window.location.hostname;
                // se l'host e' uguale dall'host da cui parte la chiamata
                if (this.href.match(myHost)) {
                    utils.pushState.call(self, this);
                } else {
                    // External call
                    return true;
                }

                return false;
            });

            if (data.overlay) {
                data.overlay.remove();
            }
        },

        getExcludedElements: function (data) {

            var excludedElements = [];

            $(data.exclude).each(function () {

                var tmp = $(this);

                if (this.nodeName !== 'A') {
                    tmp = $(this).find('a');
                }

                excludedElements = $.merge(excludedElements, tmp);

            });

            var anchorsSet = this.find('a').not(excludedElements).not('[target=_blank]').not('[href^=#]').not('[href^=mailto]');

            return anchorsSet;

        },

        init: function (options) {

            initHistory.call(this);

            var data = this.data('AsyncNavigator');
            var defaults = {
                'exclude': '',
                'debug': false,
                'preload': true,
                'enableOverlay': true,
                'loader': $()
            };

            var settings = $.extend(defaults, options);

            data.actionsNumber = 0;
            data.endedActions = 0;
            data.elementReady = 0;
            data.debug = settings.debug;
            data.originalSettings = settings;
            data.selector = this.selector;
            data.endedActions = false;
            data.preload = settings.preload;
            data.exclude = settings.exclude;
            data.loader = settings.loader;
            data.enableOverlay = settings.enableOverlay;
            data.anchorsSet = methods.getExcludedElements.call(this, data);

            methods.bindAsyncNavigation.call(this);

            return this;

        },

        destroy: function () {

            return this.each(function () {

                var $this = $(this);

                $(window).unbind('.AsyncNavigator');
                $this.removeData('AsyncNavigator');

            });
        }

    };

    $.fn.AsyncNavigator = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.AsyncNavigator');
        }
    };

})(jQuery);