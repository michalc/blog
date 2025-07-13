# blog [![Build status](https://img.shields.io/github/actions/workflow/status/michalc/blog/deploy-to-github-pages.yml?label=Build%20status)](https://github.com/michalc/blog/actions/workflows/deploy-to-github-pages.yml)

The source for my personal blog at [http://charemza.name/](http://charemza.name/), deployed using GitHub actions.

## Build locally

To build locally, for the first time run:

```bash
npm install
npm rebuild node-sass
```

And then run

```bash
 npx @11ty/eleventy --serve
```



