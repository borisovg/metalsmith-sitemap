import path from "node:path";
import { Readable } from "node:stream";
import debug from "debug";
import type Metalsmith from "metalsmith";
import { type SitemapItemLoose, SitemapStream, streamToPromise } from "sitemap";

export type SitemapPluginFilter = (
  path: string,
  file: Metalsmith.File,
) => boolean;

export type SitemapPluginOptions = {
  createdAtKey?: string;
  filter?: SitemapPluginFilter;
  outputPath?: string;
  hostname: string;
  priorityKey?: string;
  privateKey?: string;
  updatedAtKey?: string;
};

const logFormatDate = debug("metalsmith-sitemap:debug:formatDate");
const logMakeSitemapInput = debug("metalsmith-sitemap:debug:makeSitemapInput");
const logNormalisedOpts = debug("metalsmith-sitemap:debug:normaliseOpts");

export default function makeSitemapPlugin(opts: SitemapPluginOptions) {
  const normalisedOpts = normaliseOpts(opts);

  return ((files, _metalsmith, done) => {
    const filtered = filterFiles(
      files,
      normalisedOpts.filter,
      normalisedOpts.privateKey,
    );
    const inputs = makeSitemapInput(filtered, normalisedOpts);
    const stream = new SitemapStream({
      hostname: normalisedOpts.hostname,
      lastmodDateOnly: true,
      xmlns: {
        news: false,
        xhtml: false,
        image: false,
        video: false,
      },
    });

    streamToPromise(Readable.from(inputs).pipe(stream))
      .then((contents) => {
        files[normalisedOpts.outputPath] = { contents };
        done();
      })
      .catch(done);
  }) as Metalsmith.Plugin;
}

function filterFiles(
  files: Metalsmith.Files,
  filter: SitemapPluginFilter,
  privateKey: string,
) {
  const input = Object.entries(files);
  const output: Map<string, Metalsmith.Files[number]> = new Map();

  for (const [path, file] of input) {
    if (!file[privateKey] && filter(path, file)) {
      output.set(path, file);
    }
  }

  return output;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  let output: string | undefined;

  if (!Number.isNaN(date.getTime())) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    output = `${year}-${month}-${day}`;
  }

  logFormatDate(`INPUT: ${dateString}, OUTPUT: ${output}`);
  return output;
}

function normaliseOpts(opts: SitemapPluginOptions) {
  const normalisedOpts: Required<SitemapPluginOptions> = {
    createdAtKey: "date",
    filter: (path: string, _file) => path.endsWith(".html"),
    outputPath: "sitemap.xml",
    priorityKey: "priority",
    privateKey: "private",
    updatedAtKey: "lastmod",
    ...opts,
  };

  logNormalisedOpts(
    JSON.stringify(
      { ...normalisedOpts, filter: normalisedOpts.filter.toString() },
      undefined,
      2,
    ),
  );

  return normalisedOpts;
}

function makeSitemapInput(
  input: Map<string, Metalsmith.File>,
  opts: Required<SitemapPluginOptions>,
) {
  const list: SitemapItemLoose[] = [];

  for (const [path, file] of input) {
    const item: SitemapItemLoose = {
      url: safeJoinUrlPath("/", path),
    };
    const updatedAt = (file[opts.updatedAtKey] || file[opts.createdAtKey]) as
      | string
      | undefined;
    const priority = Number.parseFloat(
      (file[opts.priorityKey] || "") as string,
    );

    if (updatedAt) {
      const lastmod = formatDate(updatedAt);
      if (lastmod) {
        item.lastmod = lastmod;
      }
    }

    if (priority) {
      item.priority = priority;
    }

    list.push(item);

    logMakeSitemapInput(
      JSON.stringify(
        {
          path,
          file: {
            title: file["title"],
            [opts.createdAtKey]: file[opts.createdAtKey],
            [opts.priorityKey]: file[opts.priorityKey],
            [opts.privateKey]: file[opts.privateKey],
            [opts.updatedAtKey]: file[opts.updatedAtKey],
          },
          item,
        },
        undefined,
        2,
      ),
    );
  }

  return list;
}

function safeJoinUrlPath(...parts: string[]) {
  const segments = parts.flatMap((part) =>
    String(part)
      .split(/[/\\]+/) // handles both / and \
      .filter(Boolean),
  );

  return path.posix.join(...segments);
}
