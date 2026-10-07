export interface ListingFilesystem {
    list(path: string): Promise<string[]>;
}