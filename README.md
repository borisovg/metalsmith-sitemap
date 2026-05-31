[![Tests](https://github.com/borisovg/metalsmith-sitemap/actions/workflows/tests.yaml/badge.svg)](https://github.com/borisovg/metalsmith-sitemap/actions/workflows/tests.yaml)
[![Coverage Status](https://img.shields.io/codecov/c/github/borisovg/metalsmith-sitemap/master.svg?style=flat-square)](https://codecov.io/gh/borisovg/metalsmith-sitemap/)

# @borisovg/metalsmith-sitemap

This is a [Metalsmith](http://www.metalsmith.io/) plugin to generate a sitemap file.

## Usage

Install the package:

```
npm install @borisovg/metalsmith-sitemap
```

Add the plugin to your Metalsmith build chain:

```
import sitemap = from '@borisovg/metalsmith-sitemap';
import metalsmith = from 'metalsmith';

metalsmith(import.meta.dirname)
    .source('./src')
    .destination('./public')
    .use(sitemap({ hostname: "https://example.com" }));
    .build(function (err) {
        if (err) {
            throw err;
        }

        console.log('Build complete');
    });
```

## Options

| Option       | Type                                    | Default                          | Note                                                                                     |
| ------------ | --------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| hostname     | `string` **(required)**                 |                                  | Used to set the URL prefix for each link in the sitemap.                                 |
| createdAtKey | `string`                                | "date"                           | Used as a fallback to set "lastmod" value if frontmatter at "updatedAtKey" is undefined. |
| filter       | `(name: string, file: File) => boolean` | (path) => path.endsWith(".html") | Used to filter files to be included in the sitemap.                                      |
| outputPath   | `string`                                | "sitemap.xml"                    | Used to set the output file.                                                             |
| priorityKey  | `string`                                | "priority"                       | Used to set priority via frontmatter metadata variable.                                  |
| privateKey   | `string`                                | "private"                        | Used to exclude file from sitemap via frontmatter metadata variable.                     |
| updatedAtKey | `string`                                | "lastmod"                        | Used to set "lastmod" value via frontmatter metadata variable.                           |
