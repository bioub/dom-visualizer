module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: true,
            },
            uses_defaults: ['src/**/*.js']
        },
        bowerInstall: {
            target: {
                src: 'src/index.html'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/**/<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js'
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        'dist/*',
                        '!dist/.git*'
                    ]
                }]
            },
        }
    });

//    // Load the plugin that provides the "uglify" task.
//    grunt.loadNpmTasks('grunt-contrib-uglify');
//    grunt.loadNpmTasks('grunt-contrib-jshint');
//    grunt.loadNpmTasks('grunt-bower-install');
//    grunt.loadNpmTasks('grunt-karma');


    grunt.registerTask('build', [
        'clean:dist',
//        'concurrent:dist',
//        'injector',
        'bowerInstall',
//        'useminPrepare',
//        'autoprefixer',
//        'ngtemplates',
//        'concat',
//        'ngmin',
//        'copy:dist',
//        'cdnify',
//        'cssmin',
        'uglify',
//        'rev',
//        'usemin'
    ]);

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'uglify', 'bowerInstall']);

};