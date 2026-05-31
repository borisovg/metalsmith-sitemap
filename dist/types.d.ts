import type Metalsmith from "metalsmith";
export type File = Metalsmith.Files[number] & {
    frontmatter?: Record<string, string>;
};
export type Files = Record<string, File>;
export type FilterFn = (path: string, file: File) => boolean;
export type SitemapPluginOptions = {
    createdAtKey?: string;
    filter?: FilterFn;
    outputPath?: string;
    hostname: string;
    priorityKey?: string;
    privateKey?: string;
    updatedAtKey?: string;
};
//# sourceMappingURL=types.d.ts.map