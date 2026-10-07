import type { Filesystem } from '@littlemissrobot/highfive';
import type { KeyValueStore } from './contracts/KeyValueStore';

export class FilesystemKeyValueStore<Value = unknown> implements KeyValueStore<Value> {

    private readonly filesystem: Filesystem;
    private readonly directory: string

    constructor(filesystem: Filesystem, directory: string) {
        this.filesystem = filesystem;
        this.directory = directory;
    }

    public async get(key: string): Promise<Value | undefined> {
        const path = this.pathFor(key);

        if (!(await this.filesystem.exists(path))) {
            return undefined;
        }

        const contents = await this.filesystem.read(path);
        const json = new TextDecoder().decode(contents);

        return JSON.parse(json) as Value;
    }

    public async set(key: string, value: Value): Promise<void> {
        const json = JSON.stringify(value);

        if (json === undefined) {
            throw new TypeError('The value cannot be serialized to JSON.');
        }

        await this.filesystem.write(
            this.pathFor(key),
            new TextEncoder().encode(json),
        );
    }

    public async delete(key: string): Promise<void> {
        const path = this.pathFor(key);

        if (await this.filesystem.exists(path)) {
            await this.filesystem.delete(path);
        }
    }

    public async has(key: string): Promise<boolean> {
        return this.filesystem.exists(this.pathFor(key));
    }

    private pathFor(key: string): string {
        // Encode separators so keys cannot introduce subdirectories.
        return `${this.directory}/${encodeURIComponent(key)}.json`;
    }
}