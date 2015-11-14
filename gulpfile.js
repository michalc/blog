var gulp = require('gulp');

gulp.task('jekyll', function(gulpCallBack) {
  var spawn = require('child_process').spawn;
  var jekyll = spawn('jekyll', ['build'], {stdio: 'inherit'});

  jekyll.on('exit', function(code) {
    gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: '+code);
  });
});

gulp.task('htmlmin', ['jekyll'], function() {
  var minifyHtml = require('gulp-minify-html');

  return gulp.src('_site/**/*.html')
    .pipe(minifyHtml())
    .pipe(gulp.dest('_site'));
});

gulp.task('html5-lint', ['htmlmin'], function() {
  var html5Lint = require('gulp-html5-lint');

  return gulp.src('_site/**/*.html')
    .pipe(html5Lint());
});

gulp.task('default', ['html5-lint']);
