module.exports = function(grunt) {
  "use strict";

	require('jit-grunt')(grunt, {});

  // Project configuration.
  grunt.initConfig({
    // This line makes your node configurations available for use
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      myFiles: [ 'js/*.*.js' ],
      test:    [ 'test/specs/*.*.js' ]
    },

    watch: {
      myFiles: {
        files: [ 'js/*.js' ],
        tasks: [ 'jshint:myFiles']
      },
      test: {
        files: [ 'test/specs/*.*.js' ],
        tasks: [ 'jshint:test' ]
      }
    },

    karma: {
      unit: {
        configFile: 'test/karma.conf.js'
      }
    }

  });
};
