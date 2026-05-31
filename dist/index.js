import path from "node:path";
import { Readable } from "node:stream";
import debug from "debug";
import { SitemapStream, streamToPromise } from "sitemap";
const logFormatDate = debug("metalsmith-sitemap:debug:formatDate");
const logMakeSitemapInput = debug("metalsmith-sitemap:debug:makeSitemapInput");
const logNormalisedOpts = debug("metalsmith-sitemap:debug:normaliseOpts");
export default function makeSitemapPlugin(opts) {
    const normalisedOpts = normaliseOpts(opts);
    return ((files, _metalsmith, done) => {
        const filtered = filterFiles(files, normalisedOpts.filter, normalisedOpts.privateKey);
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
    });
}
function filterFiles(files, filter, privateKey) {
    const input = Object.entries(files);
    const output = new Map();
    for (const [path, file] of input) {
        if (!file[privateKey] && filter(path, file)) {
            output.set(path, file);
        }
    }
    return output;
}
function formatDate(dateString) {
    const date = new Date(dateString);
    let output;
    if (!Number.isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        output = `${year}-${month}-${day}`;
    }
    logFormatDate(`INPUT: ${dateString}, OUTPUT: ${output}`);
    return output;
}
function normaliseOpts(opts) {
    const normalisedOpts = {
        createdAtKey: "date",
        filter: (path, _file) => path.endsWith(".html"),
        outputPath: "sitemap.xml",
        priorityKey: "priority",
        privateKey: "private",
        updatedAtKey: "lastmod",
        ...opts,
    };
    logNormalisedOpts(JSON.stringify({ ...normalisedOpts, filter: normalisedOpts.filter.toString() }, undefined, 2));
    return normalisedOpts;
}
function makeSitemapInput(input, opts) {
    const list = [];
    for (const [path, file] of input) {
        const item = {
            url: safeJoinUrlPath("/", path),
        };
        const updatedAt = (file[opts.updatedAtKey] || file[opts.createdAtKey]);
        const priority = Number.parseFloat((file[opts.priorityKey] || ""));
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
        logMakeSitemapInput(JSON.stringify({
            path,
            file: {
                title: file["title"],
                [opts.createdAtKey]: file[opts.createdAtKey],
                [opts.priorityKey]: file[opts.priorityKey],
                [opts.privateKey]: file[opts.privateKey],
                [opts.updatedAtKey]: file[opts.updatedAtKey],
            },
            item,
        }, undefined, 2));
    }
    return list;
}
function safeJoinUrlPath(...parts) {
    const segments = parts.flatMap((part) => String(part)
        .split(/[/\\]+/) // handles both / and \
        .filter(Boolean));
    return path.posix.join(...segments);
}
//# sourceMappingURL=index.js.map