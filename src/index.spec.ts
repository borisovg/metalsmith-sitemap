import { promisify } from "node:util";
import type Metalsmith from "metalsmith";
import { describe, expect, it } from "vitest";
import sitemapPlugin from "./index.js";

describe("index", () => {
  it("generates sitemap", async () => {
    const files: Metalsmith.Files = {
      "foo.html": { contents: Buffer.from("") },
      "bar/baz.html": { contents: Buffer.from("") },
    };

    await promisify(sitemapPlugin({ hostname: "http://example.com" }))(
      files,
      {} as Metalsmith,
    );

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/foo.html</loc></url><url><loc>http://example.com/bar/baz.html</loc></url></urlset>',
    );
  });

  it("generates sitemap with custom outputPath", async () => {
    const files: Metalsmith.Files = {
      "foo.html": { contents: Buffer.from("") },
    };

    await promisify(
      sitemapPlugin({ hostname: "http://example.com", outputPath: "foo.xml" }),
    )(files, {} as Metalsmith);

    const sitemap = files["foo.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/foo.html</loc></url></urlset>',
    );
  });

  it("default filter skips files marked as private", async () => {
    const files: Metalsmith.Files = {
      "foo.html": { contents: Buffer.from(""), private: true },
      "bar/baz.html": { contents: Buffer.from("") },
    };

    await promisify(sitemapPlugin({ hostname: "http://example.com" }))(
      files,
      {} as Metalsmith,
    );

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/bar/baz.html</loc></url></urlset>',
    );
  });

  it("default filter skips files marked as private with custom privateKey", async () => {
    const files: Metalsmith.Files = {
      "foo.html": { contents: Buffer.from(""), secret: true },
      "bar/baz.html": { contents: Buffer.from("") },
    };

    await promisify(
      sitemapPlugin({ hostname: "http://example.com", privateKey: "secret" }),
    )(files, {} as Metalsmith);

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/bar/baz.html</loc></url></urlset>',
    );
  });

  it("sets lastmod when available", async () => {
    const files: Metalsmith.Files = {
      "foo.html": {
        contents: Buffer.from(""),
        date: new Date("2026-04-01").toISOString(),
        lastmod: "2026-05-01",
      },
      "bar.html": {
        contents: Buffer.from(""),
        date: "invalid",
      },
      "bar/baz.html": {
        contents: Buffer.from(""),
        date: new Date("2026-05-01").toISOString(),
      },
    };

    await promisify(sitemapPlugin({ hostname: "http://example.com" }))(
      files,
      {} as Metalsmith,
    );

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/foo.html</loc><lastmod>2026-05-01</lastmod></url><url><loc>http://example.com/bar.html</loc></url><url><loc>http://example.com/bar/baz.html</loc><lastmod>2026-05-01</lastmod></url></urlset>',
    );
  });

  it("sets lastmod when available with custom createdAt and updatedAt", async () => {
    const files: Metalsmith.Files = {
      "foo.html": {
        contents: Buffer.from(""),
        createdAt: new Date("2026-04-01").toISOString(),
        updatedAt: "2026-05-01",
      },
      "bar/baz.html": {
        contents: Buffer.from(""),
        createdAt: new Date("2026-05-01").toISOString(),
      },
    };

    await promisify(
      sitemapPlugin({
        hostname: "http://example.com",
        createdAtKey: "createdAt",
        updatedAtKey: "updatedAt",
      }),
    )(files, {} as Metalsmith);

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/foo.html</loc><lastmod>2026-05-01</lastmod></url><url><loc>http://example.com/bar/baz.html</loc><lastmod>2026-05-01</lastmod></url></urlset>',
    );
  });

  it("sets priority", async () => {
    const files: Metalsmith.Files = {
      "foo.html": {
        contents: Buffer.from(""),
        priority: 0.5,
      },
      "bar.html": {
        contents: Buffer.from(""),
        priority: "invalid",
      },
    };

    await promisify(
      sitemapPlugin({
        hostname: "http://example.com",
      }),
    )(files, {} as Metalsmith);

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/foo.html</loc><priority>0.5</priority></url><url><loc>http://example.com/bar.html</loc></url></urlset>',
    );
  });

  it("sets priority with custom priorityKey", async () => {
    const files: Metalsmith.Files = {
      "foo.html": {
        contents: Buffer.from(""),
        importance: 0.5,
      },
    };

    await promisify(
      sitemapPlugin({
        hostname: "http://example.com",
        priorityKey: "importance",
      }),
    )(files, {} as Metalsmith);

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/foo.html</loc><priority>0.5</priority></url></urlset>',
    );
  });

  it("default filter ignores non-html files", async () => {
    const files: Metalsmith.Files = {
      "foo.html": {
        contents: Buffer.from(""),
      },
      "bar.txt": {
        contents: Buffer.from(""),
      },
    };

    await promisify(
      sitemapPlugin({
        hostname: "http://example.com",
      }),
    )(files, {} as Metalsmith);

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/foo.html</loc></url></urlset>',
    );
  });

  it("filters with custom filter", async () => {
    const files: Metalsmith.Files = {
      "foo.html": {
        contents: Buffer.from(""),
      },
      "bar.txt": {
        contents: Buffer.from(""),
      },
      "baz.html": {
        contents: Buffer.from(""),
      },
    };

    await promisify(
      sitemapPlugin({
        hostname: "http://example.com",
        filter: (path) => !path.includes("foo"),
      }),
    )(files, {} as Metalsmith);

    const sitemap = files["sitemap.xml"];
    expect(sitemap).toBeDefined();
    expect(sitemap?.contents.toString()).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://example.com/bar.txt</loc></url><url><loc>http://example.com/baz.html</loc></url></urlset>',
    );
  });
});
