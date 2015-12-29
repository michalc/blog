# blog [![Build Status](https://travis-ci.org/michalc/blog.svg?branch=master)](https://travis-ci.org/michalc/blog)

The source for my personal blog at [http://charemza.name/](http://charemza.name/), built using gulp, hosted on AWS S3 with Cloudfront as CDN, and deployed using Travis.


## Build

To build the site into the `build` directory for the first time:

```
npm install
gulp
```

Subsequent changes can be built by:

```
gulp
```


## Deploy

This project is deployed onto Amazon S3 using Travis, which will run

```
gulp publish
```

See the [.travis.yml](.travis.yml) file for details. If running locally must have AWS credentials loaded so the [AWS Node.js SDK](https://aws.amazon.com/sdk-for-node-js/) can find them.
