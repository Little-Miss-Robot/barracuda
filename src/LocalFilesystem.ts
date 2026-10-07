import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Filesystem } from '@littlemissrobot/highfive';

export class LocalFilesystem implements Filesystem {

    private readonly root: string;

    constructor(root: string = '') {
        this.root = root;
    }

    public async read(path: string): Promise<Uint8Array> {
        return readFile(`${this.root}/${path}`);
    }

    public async write(path: string, contents: Uint8Array): Promise<void> {
        await mkdir(dirname(`${this.root}/${path}`), { recursive: true });
        await writeFile(`${this.root}/${path}`, contents);
    }

    public async delete(path: string): Promise<void> {
        await unlink(`${this.root}/${path}`);
    }

    public async exists(path: string): Promise<boolean> {
        try {
            await access(`${this.root}/${path}`);
            return true;
        } catch (error) {
            if (
                error instanceof Error &&
                'code' in error &&
                (error.code === 'ENOENT' || error.code === 'ENOTDIR')
            ) {
                return false;
            }

            throw error;
        }
    }

    public async move(from: string, to: string): Promise<void> {
        await mkdir(dirname(`${this.root}/${to}`), { recursive: true });
        await rename(`${this.root}/${from}`, `${this.root}/${to}`);
    }
}