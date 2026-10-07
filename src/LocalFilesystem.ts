import { access, mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Filesystem } from '@littlemissrobot/highfive';
import {ListingFilesystem} from "./contracts/ListingFilesystem";

export class LocalFilesystem implements Filesystem, ListingFilesystem {

    private readonly root: string;

    constructor(root: string = '') {
        this.root = root;
    }

    public async read(path: string): Promise<Uint8Array> {
        return readFile(`${this.root}/${path}`);
    }

    public async write(path: string, contents: Uint8Array): Promise<void> {
        const target = `${this.root}/${path}`;
        await mkdir(dirname(target), { recursive: true });
        const temporary = `${target}.${process.pid}.tmp`;
        await writeFile(temporary, contents);
        await rename(temporary, target);
    }

    public async list(path: string): Promise<string[]> {
        try {
            return await readdir(`${this.root}/${path}`);
        } catch (error) {
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'ENOENT'
            ) {
                return [];
            }

            throw error;
        }
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