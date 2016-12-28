module.exports = function(grunt) {
  'use strict';
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.initConfig({
    eslint: {
      src: ["lib/**/*.js"]
    },
    mochaTest: {
      test: {
        src: ['./**/*-spec.js']
      }
    }
  });
  grunt.registerTask('default', ['eslint', 'mochaTest']);
};
