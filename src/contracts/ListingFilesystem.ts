export interface ListingFilesystem {
    list(path: string): Promise<string[]>;
    remove(path: string): Promise<void>;
}