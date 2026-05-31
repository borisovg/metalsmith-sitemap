import path from "node:path";
import { Readable } from "node:stream";
import type Metalsmith from "metalsmith";
import { type SitemapItemLoose, SitemapStream, streamToPromise } from "sitemap";
import type { File, Files, FilterFn, SitemapPluginOptions } from "./types.js";

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

function filterFiles(files: Files, filter: FilterFn, privateKey: string) {
  const input = Object.entries(files);
  const output: Map<string, Files[number]> = new Map();

  for (const [path, file] of input) {
    if (!file.frontmatter?.[privateKey] && filter(path, file)) {
      output.set(path, file);
    }
  }

  return output;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (!Number.isNaN(date.getTime())) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

function normaliseOpts(opts: SitemapPluginOptions) {
  const normalisedOpts: Required<SitemapPluginOptions> = {
    createdAtKey: "date",
    filter: (path: string, file: File) =>
      !file.frontmatter?.[normalisedOpts.privateKey] && path.endsWith(".html"),
    outputPath: "sitemap.xml",
    priorityKey: "priority",
    privateKey: "private",
    updatedAtKey: "lastmod",
    ...opts,
  };

  normalisedOpts.filter ??= (path: string, _file) => path.endsWith(".html");

  return normalisedOpts;
}

function makeSitemapInput(
  input: Map<string, File>,
  opts: Required<SitemapPluginOptions>,
) {
  const list: SitemapItemLoose[] = [];

  for (const [path, file] of input) {
    const item: SitemapItemLoose = {
      url: safeJoinUrlPath("/", path),
    };
    const udpatedAt =
      file.frontmatter?.[opts.updatedAtKey] ||
      file.frontmatter?.[opts.createdAtKey];
    const priority = Number.parseFloat(
      file.frontmatter?.[opts.priorityKey] || "",
    );

    if (udpatedAt) {
      const lastmod = formatDate(udpatedAt);
      if (lastmod) {
        item.lastmod = lastmod;
      }
    }

    if (priority) {
      item.priority = priority;
    }

    list.push(item);
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
