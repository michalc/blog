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
  var sass = require('gulp-sass');
  var postcss = require('gulp-postcss');
  var cleancss = require('gulp-clean-css');
  var autoprefixer = require('autoprefixer');
  var md5 = require('gulp-md5');
  var rename = require('gulp-rename');
  var wrap = require('gulp-wrap');
  var mergeStream = require('merge-stream');
  var path = require('path');
  var prism = require('prismjs');
  require('prismjs/components/prism-clike');
  require('prismjs/components/prism-c');
  require('prismjs/components/prism-cpp');
  require('prismjs/components/prism-haskell');
  require('prismjs/components/prism-java');
  require('prismjs/components/prism-python');
  var stream = require('stream');
  var streamToArray = require('stream-to-array');
  var striptags = require('striptags');
  var buffer = require('vinyl-buffer');
  var browserify = require('browserify');
  var gutil = require('gulp-util');
  var babel = require('gulp-babel');
  var uncss = require('uncss');
  var parse5 = require('parse5');
  var uglify = require('gulp-uglify');

  function isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  function ifProduction(func) {
    return isProduction() ? func() : gutil.noop();
  }

  gutil.log(isProduction() ? 'Production build' : 'Development build');

  // Unfortunately can't keep the fonts in this repository for licensing reasons
  // so download them from charemza.name
  var remoteFonts = download([
    'http://charemza.name/assets/fonts/proxima-nova/2D48A7_0_0_60d35824cdd0ba6f9eefc34302b5cb47.woff',
    'http://charemza.name/assets/fonts/proxima-nova/2D48A7_1_0_f325cb737abdf43c56775a5da7b42823.woff',
    'http://charemza.name/assets/fonts/proxima-nova/2D48A7_2_0_daee6403b947a65a09541161726dd3ea.woff'
  ])
    .pipe(rename(function(path) {
      path.basename = path.basename.replace(/(.+)_.+$/, '$1');
      return path;
    }))
    .pipe(stream.Transform({
      objectMode: true,
      transform: function(file, enc, cb) {
        file.path = 'assets/fonts/proxima-nova/' + file.relative;
        this.push(file);
        cb();
      }
    }))
    .pipe(buffer());

  var all = mergeStream(gulp.src(['src/**/*','!src/**/_*']), remoteFonts);

  // Assets
  var binaryAssets = all
    .pipe(filter(['assets/documents/**/*.*', 'assets/images/**/*.*', 'assets/fonts/**/*.*']))
    .pipe(data(function(file) {
      return {
        originalRelative: file.relative
      } 
    }))
    .pipe(md5());

  // Original asset path to md5-ed path
  var assetFileNames = {};
  var binaryAssetFileNameStream = binaryAssets
    .pipe(stream.Transform({
      objectMode: true,
      transform: function(file, enc, done) {
        assetFileNames[file.data.originalRelative] = '/' + file.relative
        this.push(file);
        done();
      }
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
  var intoStream = require('into-stream');
  var scripts = all
    .pipe(filter(['assets/javascripts/**/*.*']))
    .pipe(babel())
    .pipe(stream.Transform({
      objectMode: true,
      transform: function(file, enc, done) {
        var bundle = browserify(intoStream(file.contents));
        file.contents = bundle.bundle();
        this.push(file);
        done();
      }
    }))
    .pipe(buffer())
    .pipe(uglify());

  // Styles
  var styles = all
    .pipe(filter(['assets/stylesheets/site.scss']))
    .pipe(sass({includePaths: [path.join(__dirname, 'node_modules/prismjs/themes')]}))
    .pipe(addBinaryAssetData())
    .pipe(handlebars())
    .pipe(postcss([
      autoprefixer({browsers: ['last 2 versions', 'not ie <= 11']})
    ]))
    .pipe(cleancss());

  var stylesPromise = streamToArray(styles);

  var textAssets = mergeStream(scripts)
    .pipe(data(function(file) {
      return {
        originalRelative: file.relative
      }
    }))
    .pipe(md5());

  var textAssetFileNameStream = textAssets
    .pipe(stream.Transform({
      objectMode: true,
      transform: function(file, enc, done) {
        assetFileNames[file.data.originalRelative] = '/' + file.relative
        this.push(file);
        done();
      }
    }));

  var allAssetFileNamePromise = streamToArray(textAssetFileNameStream).then(function() {
    return assetFileNames;
  });

  function addAllAssetData() {
    return data(function(file) {
      return Promise.all([allAssetFileNamePromise, stylesPromise]).then(function(results) {
        var assetFileNames = results[0]
        var styles = results[1][0]
        return {
          assets: assetFileNames,
          styles: results[1][0].contents.toString()
        };
      });
    });
  }

  // Posts
  var posts = all
    .pipe(filter(['posts/**/*']))
    .pipe(frontMatter({property: 'data'}))
    .pipe(stream.Transform({
      objectMode: true,
      transform: function(file, enc, cb) {
        var parsed = path.parse(file.relative);
        var name = parsed.name.replace(/^\d\d\d\d-\d\d-\d\d-/,'');
        var relativePath = 'blog/posts/' + file.data.categories.split(' ').join('/') + '/' + name + '/index.html';
        file.path = path.join(file.base, relativePath);
        this.push(file); 
        cb();
      }
    }))
    .pipe(data(function(file) {
      return {
        summary: ellipsize(striptags(handlebars.Handlebars.compile(file.contents.toString())()), 250),
        url: path.parse(file.relative).dir + '/'
      }
    }))
    .pipe(wrap({src: 'src/_layouts/post.html'}))
    .pipe(wrap({src: 'src/_layouts/default.html'}));

  var postDataStream = posts
    .pipe(stream.Transform({
      objectMode: true,
      transform: function(file, enc, done) {
        this.push(file.data);
        done();
      }
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
    .pipe(data(function(file) {
      return indexPromise.then(function(indexFiles) {
        return {
          index: indexFiles[0].data
        };
      })
    }));

  var html = mergeStream(sitemap, index, posts)
    .pipe(addAllAssetData())
    .pipe(handlebars({
       site: {
         name: 'Michal Charemza',
         url: 'https://charemza.name/',
         'url-no-slash': 'https://charemza.name'
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
         },
         safe: function(string) {
          return new handlebars.Handlebars.SafeString(string)
         }
       }
     }))
    .pipe(stream.Transform({
      objectMode: true,
      transform: function(file, enc, cb) {
        var self = this;

        // Remove unused styles from html only
        if (file.path.match(/sitemap\.xml$/)) {
          self.push(file);
          cb();
          return;
        }
        var document1 = parse5.parse(file.contents.toString());
        var head = document1.childNodes[1].childNodes[0];
        var styles = head.childNodes.filter((node) => {
          return node.tagName == 'style'
        });
        var style = styles[0]
        uncss([file.contents.toString()], {
          raw: style.childNodes[0].value,
          ignore: ['.fa', '.fa-stack-overflow']
        }, function (error, output) {
          style.childNodes[0].value = output;
          file.contents = Buffer.from(parse5.serialize(document1), 'utf8');
          self.push(file);
          cb();
        });
      }
    }));
  
  // Static
  var static = all
    .pipe(filter(['favicon.ico', 'robots.txt']));

  return mergeStream(binaryAssets, textAssets, html, static)
    .pipe(gulp.dest('build'))
});

gulp.task('publish', ['build'], function() {
  var S3 = require('aws-sdk/clients/s3');
  var Promise = require('bluebird');
  var concurrent = require('concurrent-transform');
  var mergeStream = require('merge-stream');
  var stream = require('stream');
  var gutil = require('gulp-util');
  var streamToArray = require('stream-to-array');
  var mime = require('mime');

  var BUCKET = 'charemza.name';

  function waitFor(promise) {
    return stream.Transform({
      objectMode: true,
      transform: function(file, enc, cb) {
        var self = this;
        promise.then(function() {
          self.push(file);
          cb();
        }, function(err) {
          console.log('waiting error');
          cb(new Error(err));
        });
      }
    });
  }

  var s3 = new S3();

  var existingKeys = s3.listObjectsV2({
    Bucket: BUCKET
  }).promise().then(function(res) {
    if (res.IsTruncated) {
        // Doesn't support > 1000, but we really don't need to for now
      return Promise.reject('Not all files found')
    }
    return res.Contents.map(function(item) {
      return item.Key;
    });
  });

  function getMime(path) {
    var mimeType = mime.lookup(path);
    var charset = mime.charsets.lookup(mimeType);
    return charset ? mimeType + '; charset=' + charset.toLowerCase() : mimeType;
  }

  function publish(cacheControl) {
    var publishStream = new stream.Transform({
      objectMode: true,
      transform: function(file, enc, cb) {
        var self = this;
        var type = getMime(file.relative)
        gutil.log('Uploading', file.relative, 'as', type);
        s3.putObject({
          Bucket: BUCKET,
          Key: file.relative,
          Body: file.contents,
          ContentType: type,
          CacheControl: cacheControl,
          Tagging: '' /* In case the object already exists, definitely don't want tags */
        }).promise().then(function() {
          gutil.log('Uploaded', file.relative);
          self.push(file);
          cb();
        }, function(err) {
          console.log("ERROR")
          cb(new Error(err));
        });
      }
    });
    return concurrent(publishStream, 16);
  }

  // Cache 1 week
  var resources = gulp.src(['**/*.ico', '**/*.woff', '**/*.jpeg', '**/*.png', '**/*.svg', '**/*.pdf', 'assets/**/*.js', 'assets/**/*.css'], {cwd: BUILD_DIR, base: BUILD_DIR})
    .pipe(waitFor(existingKeys))
    .pipe(publish(
      'max-age=' + 60 * 60 * 24 * 7 + ', no-transform, public'
    ));
  var resourcesDone = streamToArray(resources);

  // Cache 5 mins
  var blog = gulp.src('blog/**/*.html', {cwd: BUILD_DIR, base: BUILD_DIR})
    .pipe(waitFor(resourcesDone))
    .pipe(publish(
      'max-age=' + 60 * 5 + ', no-transform, public'
    ));
  var blogDone = streamToArray(blog);

  // Cache 5 mins
  var index = gulp.src('index.html', {cwd: BUILD_DIR})
    .pipe(waitFor(blogDone))
    .pipe(publish(
      'max-age=' + 60 * 5 + ', no-transform, public'
    ));
  var indexDone = streamToArray(index);

  // Cache 5 mins
  var meta = gulp.src(['robots.txt', 'sitemap.xml'], {cwd: BUILD_DIR})
    .pipe(waitFor(indexDone))
    .pipe(publish(
      'max-age=' + 60 * 5 + ', no-transform, public'
    ));
  var metaDone = streamToArray(meta);

  const flatten = arr => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

  var keysToDelete = Promise.all([metaDone, indexDone, blogDone, resourcesDone]).then(function(results) {
    return flatten(results).map(function(file) {
      return file.relative;
    });
  }).then((allKeys) => {
    return Promise.all([allKeys, existingKeys])
  }).then((keys) => {
    var allKeys = keys[0];
    var existingKeys = keys[1];
    var toDelete = existingKeys.filter(x => allKeys.indexOf(x) == -1);
    return toDelete;
  });

  function toStream(promise) {
    var position = 0;
    return stream.Readable({
      objectMode: true,
      read: function(chunk) {
        var self = this;
        promise.then(function(array) {
          self.push(position < array.length ? array[position] : null)
          position++;
        });
      }
    });
  }

  function setTagging() {
    return new stream.Transform({
      objectMode: true,
      transform: function(key, enc, cb) {
        var self = this;
        return s3.getObjectTagging({
         Bucket: BUCKET,
         Key: key,
        }).promise().then(results => {
          var existingToDeleteTag = results.TagSet.find((tag) => {
            return tag.Value === 'to-delete';
          });

          if (existingToDeleteTag) {
            self.push(key);
            cb()
            return;
          }
          // Doing a copy to itself to adjust creation time
          // so objects with the tag aren't deleted immediatly
          gutil.log('Setting to-delete', key);
          return s3.copyObject({
            Bucket: BUCKET,
            Key: key,
            CopySource: BUCKET + '/' + key,
            MetadataDirective: 'REPLACE',
            Tagging: 'status=to-delete',
            TaggingDirective: 'REPLACE'
          }).promise().then(() => {
            self.push(key);
            cb();
          });
        })
      }
    });
  }
  
  return toStream(keysToDelete)
    .pipe(concurrent(setTagging(), 16));
});

gulp.task('default', ['build']);

