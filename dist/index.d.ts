import type Metalsmith from "metalsmith";
export type SitemapPluginFilter = (path: string, file: Metalsmith.File) => boolean;
export type SitemapPluginOptions = {
    createdAtKey?: string;
    filter?: SitemapPluginFilter;
    outputPath?: string;
    hostname: string;
    priorityKey?: string;
    privateKey?: string;
    updatedAtKey?: string;
};
export default function makeSitemapPlugin(opts: SitemapPluginOptions): Metalsmith.Plugin;
//# sourceMappingURL=index.d.ts.map