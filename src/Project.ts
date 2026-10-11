import type { Filesystem } from '@littlemissrobot/highfive';
import type { KeyValueStore } from './contracts/KeyValueStore';
import type { ListingFilesystem } from './contracts/ListingFilesystem';
import type { Run } from './VisRegTester';
import UrlIdGenerator from './UrlIdGenerator';

export type Resolution = {
    width: number;
    height: number;
};

export const DEFAULT_RESOLUTIONS: Resolution[] = [
    { width: 1440, height: 900 },
];

export type Project = {
    urlId: string;
    url: string;
    name: string;
    resolutions: Resolution[];
    extraUrls: string[];
};

export type ProjectWrite = {
    url: unknown;
    name?: unknown;
    resolutions?: unknown;
    extraUrls?: unknown;
};

export type ProjectPatch = {
    name?: unknown;
    resolutions?: unknown;
    extraUrls?: unknown;
};

export class ProjectError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

const runIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;

export class Projects {
    private readonly storage: KeyValueStore<Project>;
    private readonly runStorage: KeyValueStore<Run>;
    private readonly idStorage: KeyValueStore<string>;
    private readonly filesystem: Filesystem & ListingFilesystem;
    private readonly urlIdGenerator: UrlIdGenerator;

    constructor(
        storage: KeyValueStore<Project>,
        runStorage: KeyValueStore<Run>,
        idStorage: KeyValueStore<string>,
        filesystem: Filesystem & ListingFilesystem,
        urlIdGenerator: UrlIdGenerator,
    ) {
        this.storage = storage;
        this.runStorage = runStorage;
        this.idStorage = idStorage;
        this.filesystem = filesystem;
        this.urlIdGenerator = urlIdGenerator;
    }

    public async list(): Promise<Project[]> {
        const keys = await this.storage.keys();
        const projects = (await Promise.all(keys.map((key) => this.get(key))))
            .filter((project): project is Project => project !== undefined);

        projects.sort((left, right) => left.name.localeCompare(right.name) || left.urlId.localeCompare(right.urlId));

        return projects;
    }

    public async get(urlId: string): Promise<Project | undefined> {
        const stored = await this.storage.get(urlId);

        if (!stored) {
            return undefined;
        }

        return {
            urlId: stored.urlId,
            url: stored.url,
            name: stored.name,
            resolutions: stored.resolutions?.length ? stored.resolutions : defaultResolutions(),
            extraUrls: stored.extraUrls ?? [],
        };
    }

    public async ensure(url: string): Promise<Project> {
        const parsed = parseHttpUrl(url);
        const urlId = this.urlIdGenerator.generate(parsed.href);
        const existing = await this.get(urlId);

        if (existing) {
            return existing;
        }

        const project: Project = {
            urlId,
            url: parsed.href,
            name: parsed.hostname,
            resolutions: defaultResolutions(),
            extraUrls: [],
        };

        await this.storage.set(urlId, project);

        return project;
    }

    public async create(input: ProjectWrite): Promise<Project> {
        if (typeof input.url !== 'string') {
            throw new ProjectError('Enter a valid HTTP or HTTPS URL.', 400);
        }

        const parsed = parseHttpUrl(input.url);
        const urlId = this.urlIdGenerator.generate(parsed.href);

        if (await this.storage.has(urlId)) {
            throw new ProjectError('A project for that URL already exists.', 409);
        }

        const project: Project = {
            urlId,
            url: parsed.href,
            name: input.name === undefined ? parsed.hostname : readName(input.name),
            resolutions: input.resolutions === undefined ? defaultResolutions() : readResolutions(input.resolutions),
            extraUrls: input.extraUrls === undefined ? [] : readExtraUrls(input.extraUrls),
        };

        await this.storage.set(urlId, project);

        return project;
    }

    public async update(urlId: string, patch: ProjectPatch): Promise<Project> {
        const existing = await this.get(urlId);

        if (!existing) {
            throw new ProjectError('That project could not be found.', 404);
        }

        if (patch.name === undefined && patch.resolutions === undefined && patch.extraUrls === undefined) {
            throw new ProjectError('Choose a name, resolutions, or extra URLs to update.', 400);
        }

        const next: Project = {
            ...existing,
            name: patch.name === undefined ? existing.name : readName(patch.name),
            resolutions: patch.resolutions === undefined ? existing.resolutions : readResolutions(patch.resolutions),
            extraUrls: patch.extraUrls === undefined ? existing.extraUrls : readExtraUrls(patch.extraUrls),
        };

        await this.storage.set(urlId, next);

        return next;
    }

    public async delete(urlId: string): Promise<void> {
        if (!await this.storage.has(urlId)) {
            throw new ProjectError('That project could not be found.', 404);
        }

        const keys = await this.runStorage.keys();

        for (const key of keys) {
            const run = await this.runStorage.get(key);

            if (run?.urlId !== urlId || !runIdPattern.test(key)) {
                continue;
            }

            await this.runStorage.delete(key);
            await this.filesystem.remove(`runs/run-${key}`);
            await this.filesystem.remove(`diffs/${key}`);
        }

        await this.idStorage.delete(`${urlId}_current`);
        await this.idStorage.delete(`${urlId}_last`);
        await this.storage.delete(urlId);
    }
}

export function resolutionsOf(resolutions: Resolution[] | undefined): Resolution[] {
    if (resolutions && resolutions.length > 0) {
        return resolutions;
    }

    return defaultResolutions();
}

export function mergeUrls(scraped: string[], extra: string[]): string[] {
    const seen = new Set(scraped);
    const merged = [...scraped];

    for (const value of extra) {
        let href: string;

        try {
            const url = new URL(value);

            if (!['http:', 'https:'].includes(url.protocol)) {
                continue;
            }

            url.hash = '';
            href = url.href;
        } catch {
            continue;
        }

        if (seen.has(href)) {
            continue;
        }

        seen.add(href);
        merged.push(href);
    }

    return merged;
}

function defaultResolutions(): Resolution[] {
    return DEFAULT_RESOLUTIONS.map((resolution) => ({ ...resolution }));
}

function parseHttpUrl(value: string): URL {
    let parsed: URL;

    try {
        parsed = new URL(value.trim());
    } catch {
        throw new ProjectError('Enter a valid HTTP or HTTPS URL.', 400);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new ProjectError('Enter a valid HTTP or HTTPS URL.', 400);
    }

    parsed.hash = '';

    return parsed;
}

function readName(value: unknown): string {
    if (typeof value !== 'string') {
        throw new ProjectError('Enter a project name.', 400);
    }

    const name = value.trim();

    if (!name) {
        throw new ProjectError('Enter a project name.', 400);
    }

    if (name.length > 120) {
        throw new ProjectError('Use a project name of 120 characters or fewer.', 400);
    }

    return name;
}

function readResolutions(value: unknown): Resolution[] {
    if (!Array.isArray(value) || value.length === 0) {
        throw new ProjectError('Choose at least one resolution.', 400);
    }

    if (value.length > 8) {
        throw new ProjectError('A project can store up to 8 resolutions.', 400);
    }

    const seen = new Set<string>();

    return value.map((item) => {
        if (!item || typeof item !== 'object') {
            throw new ProjectError('Each resolution needs a width and a height.', 400);
        }

        const width = (item as { width?: unknown }).width;
        const height = (item as { height?: unknown }).height;

        if (!isDimension(width) || !isDimension(height)) {
            throw new ProjectError('Resolution width and height must be whole numbers from 1 to 8192.', 400);
        }

        const key = `${width}x${height}`;

        if (seen.has(key)) {
            throw new ProjectError('Each resolution can only be listed once.', 400);
        }

        seen.add(key);

        return { width, height };
    });
}

function readExtraUrls(value: unknown): string[] {
    if (!Array.isArray(value)) {
        throw new ProjectError('Extra URLs must be a list.', 400);
    }

    if (value.length > 100) {
        throw new ProjectError('A project can store up to 100 extra URLs.', 400);
    }

    const seen = new Set<string>();
    const urls: string[] = [];

    for (const item of value) {
        if (typeof item !== 'string') {
            throw new ProjectError('Each extra URL must be an HTTP or HTTPS URL.', 400);
        }

        const href = parseHttpUrl(item).href;

        if (seen.has(href)) {
            continue;
        }

        seen.add(href);
        urls.push(href);
    }

    return urls;
}

function isDimension(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 8192;
}
