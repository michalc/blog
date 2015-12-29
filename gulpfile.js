var gulp = require('gulp');
var BUILD_DIR = 'build';

gulp.task('build', function() {
  var Promise = require('bluebird');
  var dateformat = require('dateformat');
  var ellipsize = require('ellipsize');
  var handlebars = require('gulp-compile-handlebars');
  var data = require('gulp-data');
  var download = require('gulp-download-stream');
  var filter = require('gulp-filter');
  var frontMatter = require('gulp-front-matter');
  var less = require('gulp-less');
  var md5 = require('gulp-md5');
  var rename = require('gulp-rename');
  var wrap = require('gulp-wrap');
  var mergeStream = require('merge-stream');
  var path = require('path');
  var prism = require('prismjs');
  var streamToArray = require('stream-to-array');
  var striptags = require('striptags');
  var through = require('through2');
  var buffer = require('vinyl-buffer');

  // Unfortunately can't keep the fonts in this repository for licensing reasons
  // so download them from charemza.name
  var remoteFonts = download([
    'http://charemza.name/assets/fonts/proxima-nova/2D48A7_0_0_34e24b832896b3b5a289c2d02ab7c9b4.woff',
    'http://charemza.name/assets/fonts/proxima-nova/2D48A7_1_0_e39fa5345ae906b2a574b514ff8d08bf.woff',
    'http://charemza.name/assets/fonts/proxima-nova/2D48A7_2_0_10113b6534de659a310206bc172768cb.woff'
  ])
    .pipe(rename(function(path) {
      path.basename = path.basename.replace(/(.+)_.+$/, '$1');
      return path;
    }))
    .pipe(through.obj(function(file, enc, cb) {
      file.path = 'assets/fonts/proxima-nova/' + file.relative;
      this.push(file);
      cb();
    }))
    .pipe(buffer());

  var all = mergeStream(gulp.src(['src/**/*','!src/**/_*']), remoteFonts);

  // Assets
  var binaryAssets = all
    .pipe(filter(['assets/images/**/*.*', 'assets/fonts/**/*.*']))
    .pipe(data(function(file) {
      return {
        originalRelative: file.relative
      } 
    }))
    .pipe(md5());

  // Original asset path to md5-ed path
  var assetFileNames = {};
  var binaryAssetFileNameStream = binaryAssets
    .pipe(through.obj(function(file, enc, done) {
       assetFileNames[file.data.originalRelative] = '/' + file.relative
       this.push(file);
       done();
    }));
  var binaryAssetFileNamePromise = streamToArray(binaryAssetFileNameStream).then(function() {
    return assetFileNames;
  });

  function addBinaryAssetData() {
    return data(function(file) {
      return binaryAssetFileNamePromise.then(function(assetFileNames) {
        return {
          assets: assetFileNames
        };
      });
    });
  }

  // Scripts
  var scripts = all
    .pipe(filter(['assets/javascripts/**/*.*']));

  // Styles
  var styles = all
    .pipe(filter(['assets/stylesheets/site.less']))
    .pipe(less({paths: [path.join(__dirname, 'node_modules/prismjs/themes')]}))
    .pipe(addBinaryAssetData())
    .pipe(handlebars())

  var textAssets = mergeStream(scripts, styles)
    .pipe(data(function(file) {
      return {
        originalRelative: file.relative
      }
    }))
    .pipe(md5());

  var textAssetFileNameStream = textAssets
    .pipe(through.obj(function(file, enc, done) {
       assetFileNames[file.data.originalRelative] = '/' + file.relative
       this.push(file);
       done();
    }));

  var allAssetFileNamePromise = streamToArray(textAssetFileNameStream).then(function() {
    return assetFileNames;
  });

  function addAllAssetData() {
    return data(function(file) {
      return allAssetFileNamePromise.then(function(assetFileNames) {
        return {
          assets: assetFileNames
        };
      });
    });
  }

  // Posts
  var posts = all
    .pipe(filter(['posts/**/*']))
    .pipe(frontMatter({property: 'data'}))
    .pipe(through.obj(function(file, enc, cb) {
      var parsed = path.parse(file.relative);
      var name = parsed.name.replace(/^\d\d\d\d-\d\d-\d\d-/,'');
      var relativePath = 'blog/posts/' + file.data.categories.split(' ').join('/') + '/' + name + '/index.html';
      file.path = path.join(file.base, relativePath);
      this.push(file); 
      cb();
    }))
    .pipe(data(function(file) {
      return {
        summary: ellipsize(striptags(file.contents.toString()), 250),
        url: path.parse(file.relative).dir + '/'
      }
    }))
    .pipe(wrap({src: 'src/_layouts/post.html'}))
    .pipe(wrap({src: 'src/_layouts/default.html'}));

  var postDataStream = posts
    .pipe(through.obj(function(file, enc, done) {
       this.push(file.data);
       done();
    }));
  var postDataPromise = streamToArray(postDataStream).then(function(postDatas) {
    return postDatas.reverse();
  });

  // Index
  var index = all
    .pipe(filter(['index.html']))
    .pipe(frontMatter())
    .pipe(data(function(file) {
       return postDataPromise.then(function(postDatas) {
         return {
           posts: postDatas,
           date: postDatas.reduce(function(max, current) {
            return Math.max(max, (new Date(current.date)).getTime());
           }, 0)
         };
       });
     }))
    .pipe(wrap({src: 'src/_layouts/default.html'}));
  var indexPromise = streamToArray(index);

  // Sitemap
  var sitemap = all
    .pipe(filter(['sitemap.xml']))
    .pipe(data(function(file) {
       return postDataPromise.then(function(postData) {
         return {
           posts: postData
         };
       });
     }))
    .pipe(data(function(file, cb) {
      indexPromise.then(function(indexFiles) {
        cb(undefined, {
          index: indexFiles[0].data
        });
      })
    }));

  var html = mergeStream(sitemap, index, posts)
    .pipe(addAllAssetData())
    .pipe(handlebars({
       site: {
         name: 'Michal Charemza',
         url: 'http://charemza.name/'
       }
     }, {
       helpers: {
         isodate: function(date) {
           return (new Date(date)).toISOString();
         },
         nicedate: function(date) {
           return dateformat(date, 'dddd mmmm dS, yyyy');
         },
         highlight: function(language, options) {
           return new handlebars.Handlebars.SafeString('<div class="highlight"><pre><code>' + prism.highlight(options.fn(this), prism.languages[language]) + '</code></pre></div>');
         }
       }
     }));
  
  // Static
  var static = all
    .pipe(filter(['favicon.ico', 'robots.txt']));

  return mergeStream(binaryAssets, textAssets, html, static)
    .pipe(gulp.dest('build'))
});

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

