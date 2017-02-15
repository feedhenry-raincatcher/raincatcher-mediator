'use strict';

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    tslint: {
      src: [
        "src/**/*.ts",
        "test/**/*.ts"
      ]
    },
    mochaTest: {
      test: {
        src: ['./**/*-spec.ts', 'test/*-spec.ts'],
        options: {
          reporters: 'Spec',
          require: 'ts-node/register',
          logErrors: true,
          timeout: 10000,
          run: true
        }
      }
    },
    clean: ['lib'],
    ts: {
      default: {
        tsconfig: true
      }
    },
    copy: {
      main: {
        expand: true,
        cwd: 'src',
        src: '**/*.d.ts',
        dest: 'lib'
      }
    }
  });
  grunt.registerTask('mocha',['mochaTest']);
  grunt.registerTask('unit',['mocha']);
  grunt.registerTask('lint', ['tslint']);
  grunt.registerTask('build', ['clean', 'ts', 'copy']);
  grunt.registerTask('default', ['lint', 'mochaTest']);
};
