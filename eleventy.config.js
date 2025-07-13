import path from "node:path";
import sass from  "sass";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import dateformat from 'dateformat';

export default function (eleventyConfig) {
    // Input directory
    eleventyConfig.setInputDirectory('src');

    // Syntax highlighting
    eleventyConfig.addPlugin(syntaxHighlight);
    
    // Sass
    eleventyConfig.addTemplateFormats("scss");
    eleventyConfig.addExtension("scss", {
        outputFileExtension: "css",
        useLayouts: false,
        compile: async function (inputContent, inputPath) {
            let parsed = path.parse(inputPath);
            if (parsed.name.startsWith("_")) {
                return;
            }
            let result = sass.compileString(inputContent, {
                loadPaths: [
                    parsed.dir || ".",
                    this.config.dir.includes,
                ],
                style: 'compressed',
            });
            this.addDependencies(inputPath, result.loadedUrls);

            return async (data) => {
                return result.css;
            };
        },
    });

    // Static assets
    eleventyConfig.addPassthroughCopy("src/**/*.svg");
    eleventyConfig.addPassthroughCopy("src/**/*.jpeg");
    eleventyConfig.addPassthroughCopy("src/**/*.png");
    eleventyConfig.addPassthroughCopy("src/**/*.woff");
    eleventyConfig.addPassthroughCopy("src/**/*.otf");
    eleventyConfig.addPassthroughCopy("src/**/*.js");
    eleventyConfig.addPassthroughCopy("src/**/*.ico");

    // Data
    eleventyConfig.addGlobalData("siteName", "Michal Charemza");
    eleventyConfig.addGlobalData("siteUrlNoSlash", "https://charemza.name");

    // Tweak permanlinks for blog posts
    eleventyConfig.addGlobalData("permalink", () => {
        return (data) => {
            if (!data.categories) {
                return undefined;
            }
            return '/blog/posts/' + data.categories.split(' ').join('/') + '/' + data.page.fileSlug + '/';
        }
    });

    // Filters for dates
    eleventyConfig.addFilter("nicedate", function(date) {
        return dateformat(date, 'dddd mmmm dS, yyyy');
    });
    eleventyConfig.addFilter("isodate", function(date) {
        return (new Date(date)).toISOString();
    });
};
