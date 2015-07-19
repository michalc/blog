module.exports = function(grunt) {
  grunt.initConfig({
    jekyll: {
      prod: {
        src: '.',
        dest: '_site'
      }
    },

    htmlmin: {
      prod: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          minifyJS: true
        },
        files: [{
          expand: true,
          src: ['_site/**/*.html'],
          dest: '.'
        }]
      }
    },

    validation: {
      prod: {
        options: {
          reset: true
        },
        files: [{
          src: ['_site/**/*.html', '!_site/assets/*.html'] 
        }]
      }
    }
  });
 
  grunt.registerTask('default', ['jekyll:prod','htmlmin:prod'/*,'validation'*/]);

  grunt.loadNpmTasks('grunt-jekyll');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-html-validation');
};