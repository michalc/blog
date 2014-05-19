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
    }
  });
 
  grunt.registerTask('default', ['jekyll:prod','htmlmin:prod']);

  grunt.loadNpmTasks('grunt-jekyll');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
};