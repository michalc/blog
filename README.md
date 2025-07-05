# blog [![Build status](https://img.shields.io/github/actions/workflow/status/michalc/blog/publish.yml?label=Build%20status)](https://github.com/michalc/blog/actions/workflows/publish.yml)

The source for my personal blog at [http://charemza.name/](http://charemza.name/), built using gulp, hosted on AWS S3 with Cloudfront as CDN, and deployed using GitHub actions.


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
