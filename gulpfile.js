var gulp = require('gulp');
var BUILD_DIR = 'build';

// Unfortunately can't keep the fonts in this repository for licensing reasons
// so download them from charemza.name
gulp.task('fonts', function() {
  var download = require('gulp-download-stream');
  var rename = require('gulp-rename');

  return download([
    'http://charemza.name/assets/proxima-nova/2D48A7_0_0-67e7438dc823bfc16e9b3ef293063daf.woff',
    'http://charemza.name/assets/proxima-nova/2D48A7_1_0-98f78589365b036ffdd1110af0639760.woff',
    'http://charemza.name/assets/proxima-nova/2D48A7_2_0-132aedb0469a775130a3b5d0d3d4f37a.woff'
  ])
    .pipe(rename(function(path) {
      path.basename = path.basename.replace(/(.+)-.+$/, '$1');
      return path;
    }))
    .pipe(gulp.dest('src/_assets/fonts/proxima-nova'));
});

gulp.task('jekyll', ['fonts'], function(gulpCallBack) {
  var spawn = require('child_process').spawn;
  var jekyll = spawn('jekyll', ['build'], {stdio: 'inherit'});

  jekyll.on('exit', function(code) {
    gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: '+code);
  });
});

gulp.task('html5-lint', ['jekyll'], function() {
  var html5Lint = require('gulp-html5-lint');

  return gulp.src('**/*.html', {cwd: BUILD_DIR})
    .pipe(html5Lint());
});

gulp.task('build', ['html5-lint']);

gulp.task('publish', ['build'], function() {
  var awspublish = require('gulp-awspublish');
  var mergeStream = require('merge-stream');
  var concurrent = require('concurrent-transform');
  var publisher = awspublish.create({
    region: 'eu-west-1',
    params: {
      Bucket: 'charemza.name'
    }
  });

  // All files are forced since gulp-awspublish doesn't
  // sync if there are just http header changes
  function publish(headers) {
    return concurrent(publisher.publish(headers,{ force:true}), 8);
  }

  // Cache 5 mins + gzip
  var html = gulp.src('**/*.html', {cwd: BUILD_DIR})
    .pipe(awspublish.gzip())
    .pipe(publish({
      'Cache-Control': 'max-age=' + 60 * 5 + ', no-transform, public'
    }));

  // Cache 5 mins, no gzip
  var meta = gulp.src(['robots.txt', 'sitemap.xml'], {cwd: BUILD_DIR})
    .pipe(publish({
      'Cache-Control': 'max-age=' + 60 * 5 + ', no-transform, public'
    }));

  // Cache 1 week, +  gzip
  var textResources = gulp.src(['**/*.js', '**/*.css'], {cwd: BUILD_DIR})
    .pipe(awspublish.gzip())
    .pipe(publish({
      'Cache-Control': 'max-age=' + 60 * 60 * 24 * 7 + ', no-transform, public'
    }));

  // Cache 1 week, no gzip
  var binaryResources = gulp.src(['**/*.ico', '**/*.woff', '**/*.jpeg'], {cwd: BUILD_DIR})
    .pipe(publish({
      'Cache-Control': 'max-age=' + 60 * 60 * 24 * 7 + ', no-transform, public'
    }));

  return mergeStream(html, meta, textResources, binaryResources)
    .pipe(publisher.sync())
    .pipe(awspublish.reporter());
});

gulp.task('default', ['build']);

