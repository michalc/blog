# blog [![Build status](https://img.shields.io/github/actions/workflow/status/michalc/blog/test.yml?label=Test%20suite)](https://github.com/michalc/blog/actions/workflows/test.yml)

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


## Deploy

Dependencies must be tar-gzipped and committed before deployment by running [pac](https://www.npmjs.com/package/pac)

```
pac
```

Pushing to master will trigger Travis to deploy onto Amazon S3. For reference, Travis will run

```
for f in .modules/*.tgz; do tar -zxf "$f" -C node_modules/; done
gulp publish
```

See the [.travis.yml](.travis.yml) file for details. If running locally must have AWS credentials loaded so the [AWS Node.js SDK](https://aws.amazon.com/sdk-for-node-js/) can find them.
