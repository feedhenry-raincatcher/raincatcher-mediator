'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  'use strict';
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      src: ["lib/**/*.js", "test/**/*.js"]
    },
    mochaTest: {
      test: {
        src: ['./**/*-spec.js', 'test/*-spec.js'],
        options: {
          reporters: 'Spec',
          logErrors: true,
          timeout: 10000,
          run: true
        }
      }
    }
  });
  grunt.registerTask('mocha',['mochaTest']);
  grunt.registerTask('unit',['eslint','mocha']);
  grunt.registerTask('default', ['unit', 'mocha']);
  grunt.registerTask('default', ['eslint', 'mochaTest']);
};
