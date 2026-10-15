import type {KeyValueStore} from "./contracts/KeyValueStore";
import type {Filesystem} from "@littlemissrobot/highfive";
import type {ListingFilesystem} from "./contracts/ListingFilesystem";
import UrlIdGenerator from "./UrlIdGenerator";
import {
    defaultResolutions,
    parseHttpUrl,
    ProjectPatch,
    ProjectWrite,
    readExtraUrls,
    readName,
    readResolutions,
    readScreenshotScript,
    runIdPattern
} from "./utils/projects";
import {Project} from "./entities/Project";
import {ProjectError} from "./errors/ProjectError";
import {Run} from "./entities/Run";

export class ProjectRepository {

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
            screenshotScript: stored.screenshotScript ?? '',
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
            screenshotScript: '',
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
            screenshotScript: input.screenshotScript === undefined ? '' : readScreenshotScript(input.screenshotScript),
        };

        await this.storage.set(urlId, project);

        return project;
    }

    public async update(urlId: string, patch: ProjectPatch): Promise<Project> {
        const existing = await this.get(urlId);

        if (!existing) {
            throw new ProjectError('That project could not be found.', 404);
        }

        if (
            patch.name === undefined
            && patch.resolutions === undefined
            && patch.extraUrls === undefined
            && patch.screenshotScript === undefined
        ) {
            throw new ProjectError('Choose a name, resolutions, extra URLs, or a screenshot script to update.', 400);
        }

        const next: Project = {
            ...existing,
            name: patch.name === undefined ? existing.name : readName(patch.name),
            resolutions: patch.resolutions === undefined ? existing.resolutions : readResolutions(patch.resolutions),
            extraUrls: patch.extraUrls === undefined ? existing.extraUrls : readExtraUrls(patch.extraUrls),
            screenshotScript: patch.screenshotScript === undefined
                ? existing.screenshotScript
                : readScreenshotScript(patch.screenshotScript),
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