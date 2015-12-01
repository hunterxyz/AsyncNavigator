'use strict';

var matchdep = require('matchdep');
var fs = require('fs');
//var _ = require('lodash');

module.exports = function (grunt) {


    // load all grunt plugins from node_modules folder
    matchdep.filterAll('grunt-*').forEach(grunt.loadNpmTasks);

    // read jshint options from file
    var jshint = JSON.parse(fs.readFileSync('./.jshintrc'));
    jshint.force = true;

    var gruntTasks = {
        uglify: {
            options: {
                mangle:   true,
                compress: true
            },
            prod:    {
                files: {
                    'public/js/navigatonController.min.js': ['src/javascript/navigatonController.js']
                }
            }
        },

        express: {
            dev: {
                options: {
                    script: 'app.js'
                }
            }
        },

        neuter: {
            options: {
                includeSourceURL: true
            },
            app: {
                options: {
                    // basePath should work too, but apparently there is a bug for windows systems, so we have to do it like this
                    filepathTransform: function (filePath) {
                        return 'src/javascript/' + filePath;
                    }
                },
                files: {
                    'public/assets/js/main.js': 'src/javascript/*.js'
                }
            }
        },

        jshint: {
            client: {
                options: jshint,
                src: ['client/app/**/*.js']
            }
        },

        todos: {
            client: {
                options: {
                    verbose: false,
                    priorities: {
                        high: /(TODO|FIXME|todo|fixme)/
                    }
                },
                src: ['client/app/**/*.js', '!client/app/modules/translations/**/*.js']
            }
        },

        concat: {
            vendorjs: {
                // generate warnings if input files are not found
                nonull: false,

                dest: 'public/assets/js/vendor.js',
                src: [
                    'bower_components/jquery/dist/jquery.js',
                    'bower_components/history.js/scripts/uncompressed/history.js',
                    'bower_components/history.js/scripts/uncompressed/history.html4.js',
                    'bower_components/history.js/scripts/uncompressed/history.adapter.jquery.js'
                ]
            },
            mainjs: {
                nonull: false,

                dest: 'public/assets/js/main.js',
                src: ['client/app/**/*.js']
            },
            unuglifyed: {
                dest: 'public/assets/js/app.min.js',
                src: [
                    'public/assets/js/vendor.js',
                    'public/assets/js/main.js'
                ]
            }
        },

        watch: {
            options: {
                livereload: true,
                nospawn: true
            },

            server: {
                files: [
                    'src/**/*.js'
                ],
                tasks: ['express']
            },

            client: {
                files: [
                    'client/app/**/*.js'
                ],
                tasks: ['neuter', 'concat:unuglifyed']
            },

            templates: {
                files: [
                    'client/app/**/*.hbs'
                ],
                tasks: ['emberTemplates:compile_dev', 'concat:unuglifyed']
            },

            html: {
                files: [
                    'public/**/*.html'
                ]
            }
        }
    };

    grunt.initConfig(gruntTasks);

    grunt.registerTask('server', ['express', 'watch']);

    grunt.registerTask('dev', [
        'jshint',
        'concat:vendorjs',
        'neuter',
        'concat:unuglifyed',
        'server'
    ]);
    grunt.registerTask('staging', [
        'shell:language_parser',
        'recess',
        'concat:vendorjs',
        'emberTemplates:compile_dev',
        'neuter',
        'concat:unuglifyed',
        'copy:cropper'
    ]);
    grunt.registerTask('build_testing', [
        'shell:language_parser',
        'recess',
        'concat:vendorjs',
        'emberTemplates:compile',
        'concat:mainjs',
        'concat:unuglifyed',
        'copy:cropper'
    ]);
    grunt.registerTask('prod', [
        'shell:language_parser',
        'recess',
        'concat:vendorjs',
        'emberTemplates:compile',
        'neuter',
        'removelogging',
        'copy:cropper',
        'concat:unuglifyed'
    ]);

    grunt.registerTask('default', ['dev']);

};
