import path from "node:path";
import { Readable } from "node:stream";
import { SitemapStream, streamToPromise } from "sitemap";
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
        if (!file.frontmatter?.[privateKey] && filter(path, file)) {
            output.set(path, file);
        }
    }
    return output;
}
function formatDate(dateString) {
    const date = new Date(dateString);
    if (!Number.isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
}
function normaliseOpts(opts) {
    const normalisedOpts = {
        createdAtKey: "date",
        filter: (path, file) => !file.frontmatter?.[normalisedOpts.privateKey] && path.endsWith(".html"),
        outputPath: "sitemap.xml",
        priorityKey: "priority",
        privateKey: "private",
        updatedAtKey: "lastmod",
        ...opts,
    };
    normalisedOpts.filter ??= (path, _file) => path.endsWith(".html");
    return normalisedOpts;
}
function makeSitemapInput(input, opts) {
    const list = [];
    for (const [path, file] of input) {
        const item = {
            url: safeJoinUrlPath("/", path),
        };
        const udpatedAt = file.frontmatter?.[opts.updatedAtKey] ||
            file.frontmatter?.[opts.createdAtKey];
        const priority = Number.parseFloat(file.frontmatter?.[opts.priorityKey] || "");
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
function safeJoinUrlPath(...parts) {
    const segments = parts.flatMap((part) => String(part)
        .split(/[/\\]+/) // handles both / and \
        .filter(Boolean));
    return path.posix.join(...segments);
}
//# sourceMappingURL=index.js.map