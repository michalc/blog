var gulp = require('gulp');

// Unfortunately can't keep the fonts in this repository, so download them from charemza.name
gulp.task('fonts', function() {
  var download = require('gulp-download');
  var rename = require('gulp-regex-rename');

  return download([
    'http://charemza.name/assets/proxima-nova/2D48A7_0_0-67e7438dc823bfc16e9b3ef293063daf.woff',
    'http://charemza.name/assets/proxima-nova/2D48A7_1_0-98f78589365b036ffdd1110af0639760.woff',
    'http://charemza.name/assets/proxima-nova/2D48A7_2_0-132aedb0469a775130a3b5d0d3d4f37a.woff'
  ]).pipe(rename(/(.+)-.+\.woff$/, '$1.woff'))
  .pipe(gulp.dest('src/_assets/fonts/proxima-nova'));
});

gulp.task('jekyll', ['fonts'], function(gulpCallBack) {
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
