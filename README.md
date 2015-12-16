# blog [![Build Status](https://travis-ci.org/michalc/blog.svg?branch=master)](https://travis-ci.org/michalc/blog)

The source for my personal blog at [http://charemza.name/](http://charemza.name/), powered by Jekyll, hosted on AWS S3 with Cloudfront as CDN, deployed using Travis.


## Build

To build the site into the `build` directory for the first time:

```
rvm install 2.2.3
rvm use 2.2.3
gem install bundler
bundle install
npm install
gulp fonts
gulp
```

Subsequent changes can be built by:

```
gulp
```


## Deploy

This project is deployed onto Amazon S3 using Travis. See the [.travis.yml](.travis.yml) file for details.
