import type {IdGenerator} from '@littlemissrobot/highfive';
import Screenshotter from "./Screenshotter";
import {UrlScraper} from "./UrlScraper";
import {KeyValueStore} from "./contracts/KeyValueStore";
import UrlIdGenerator from "./UrlIdGenerator";
import {RunComparer} from "./RunComparer";
import {mergeUrls, resolutionsOf} from "./utils/projects";
import {Run} from "./entities/Run";
import {ListedRun} from "./entities/ListedRun";
import {ProjectRepository} from "./ProjectRepository";
import {Capture} from "./entities/Capture";
import {RunEvents} from "./RunEvents";

export class VisRegTester {
    private idGenerator: IdGenerator;
    private urlIdGenerator: UrlIdGenerator;
    private urlScraper: UrlScraper;
    private screenshotter: Screenshotter;
    private runStorage: KeyValueStore<Run>;
    private idStorage: KeyValueStore<string>;
    private runComparer: RunComparer;
    private projects: ProjectRepository;
    private events: RunEvents;

    constructor(
        idGenerator: IdGenerator,
        urlIdGenerator: UrlIdGenerator,
        urlScraper: UrlScraper,
        screenshotter: Screenshotter,
        runStorage: KeyValueStore<Run>,
        idStorage: KeyValueStore<string>,
        runComparer: RunComparer,
        projects: ProjectRepository,
        events: RunEvents,
    ) {
        this.idGenerator = idGenerator;
        this.urlIdGenerator = urlIdGenerator;
        this.urlScraper = urlScraper;
        this.screenshotter = screenshotter;
        this.runStorage = runStorage;
        this.idStorage = idStorage;
        this.runComparer = runComparer;
        this.projects = projects;
        this.events = events;
    }

    public runEvents(): RunEvents {
        return this.events;
    }

    public async run(url: string): Promise<Run> {
        const created = await this.createRun(url);
        return this.execute(created.id);
    }

    public async createRun(url: string): Promise<Run> {
        const parsed = this.parseUrl(url);
        await this.projects.ensure(parsed.href);
        const run: Run = {
            id: this.idGenerator.generate(),
            url: parsed.href,
            urlId: this.urlIdGenerator.generate(parsed.href),
            urlIds: [],
            urls: [],
            resolutions: [],
            failures: [],
            pending: [],
            captures: [],
            status: 'queued',
            createdAt: new Date().toISOString(),
            comparisons: [],
        };

        await this.runStorage.set(run.id, run);

        return run;
    }

    public async execute(runId: string): Promise<Run> {
        const existing = await this.readRun(runId);

        if (!existing) {
            throw new Error('That run could not be found.');
        }

        try {
            await this.save(existing, { status: 'running', activity: { step: 'scraping' } });

            const project = await this.projects.ensure(existing.url);
            const resolutions = resolutionsOf(project.resolutions);
            const result = await this.urlScraper.scrape(existing.url);
            const urls = mergeUrls(result.urls, project.extraUrls);
            const urlIds = urls.map((url) => this.urlIdGenerator.generate(url));
            const total = urls.length * resolutions.length;

            await this.save(existing, {
                status: 'running',
                urlIds,
                urls,
                resolutions,
                pending: result.pending,
                failures: result.failures,
                activity: { step: 'capturing', done: 0, total },
            });

            await this.screenshotter.start(
                urls,
                runId,
                resolutions,
                project.screenshotScript,
                (capture) => this.recordCapture(existing, capture, total),
            );
            await this.save(existing, { activity: { step: 'comparing' } });
            await this.idStorage.set(`${existing.urlId}_last`, runId);

            if (!await this.idStorage.has(`${existing.urlId}_current`)) {
                await this.idStorage.set(`${existing.urlId}_current`, runId);
            }

            const approvedRunId = await this.idStorage.get(`${existing.urlId}_current`);

            if (!approvedRunId) {
                throw new Error('No approved run was found');
            }

            const comparisons = await this.runComparer.compare(approvedRunId, runId);

            return this.save(existing, {
                status: 'complete',
                urlIds,
                urls,
                resolutions,
                pending: result.pending,
                failures: result.failures,
                baselineRunId: approvedRunId,
                comparisons,
                activity: undefined,
                error: undefined,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            try {
                await this.save(existing, { status: 'failed', error: message, activity: undefined });
            } catch (saveError) {
                console.error(saveError);
            }

            throw error;
        }
    }

    public async listRuns(): Promise<ListedRun[]> {
        const keys = await this.runStorage.keys();
        const runs = (await Promise.all(keys.map((key) => this.readRun(key))))
            .filter((run): run is Run => run !== undefined);

        runs.sort((left, right) => right.createdAt.localeCompare(left.createdAt));

        return Promise.all(runs.map(async (run) => ({
            run,
            approved: await this.isApproved(run),
        })));
    }

    public async getRun(runId: string): Promise<ListedRun | undefined> {
        let run = await this.readRun(runId);

        if (!run) {
            return undefined;
        }

        const needsComparison = run.comparisons.length === 0
            || run.comparisons.some((comparison) => comparison.message?.includes('dimensions must match'));

        if (
            needsComparison &&
            run.urlIds.length > 0 &&
            run.status === 'complete'
        ) {
            const baselineRunId = run.baselineRunId
                ?? await this.idStorage.get(`${run.urlId}_current`);

            if (baselineRunId && await this.runStorage.has(baselineRunId)) {
                const comparisons = await this.runComparer.compare(baselineRunId, run.id);
                run = await this.save(run, { comparisons, baselineRunId });
            }
        }

        return {
            run,
            approved: await this.isApproved(run),
        };
    }

    public async approve(runId: string): Promise<void> {
        const run = await this.readRun(runId);

        if (!run) {
            throw new Error('That run could not be found.');
        }

        if (run.status !== 'complete') {
            throw new Error('Only a completed run can be approved.');
        }

        await this.idStorage.set(`${run.urlId}_current`, run.id);
    }

    private parseUrl(value: string): URL {
        let parsed: URL;

        try {
            parsed = new URL(value);
        } catch {
            throw new Error('Enter a valid HTTP or HTTPS URL.');
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Enter a valid HTTP or HTTPS URL.');
        }

        parsed.hash = '';

        return parsed;
    }

    private async isApproved(run: Run): Promise<boolean> {
        return await this.idStorage.get(`${run.urlId}_current`) === run.id;
    }

    private async readRun(runId: string): Promise<Run | undefined> {
        const stored = await this.runStorage.get(runId);

        if (!stored) {
            return undefined;
        }

        return {
            id: stored.id,
            url: stored.url ?? stored.urls?.[0] ?? stored.urlId,
            urlId: stored.urlId,
            urlIds: stored.urlIds ?? [],
            urls: stored.urls ?? [],
            resolutions: stored.resolutions ?? [],
            failures: stored.failures ?? [],
            pending: stored.pending ?? [],
            captures: stored.captures ?? [],
            activity: stored.activity,
            status: stored.status ?? 'complete',
            error: stored.error,
            createdAt: stored.createdAt ?? '',
            baselineRunId: stored.baselineRunId,
            comparisons: stored.comparisons ?? [],
        };
    }

    private async recordCapture(run: Run, capture: Capture, total: number): Promise<void> {
        const latest = await this.readRun(run.id);
        const captures = [...(latest?.captures ?? []), capture];

        await this.save(run, {
            captures,
            activity: { step: 'capturing', done: captures.length, total },
        });
        this.events.publish(run.id, { event: 'screenshot', data: capture });
    }

    private async save(base: Run, patch: Partial<Run>): Promise<Run> {
        const latest = await this.readRun(base.id);
        const next: Run = { ...(latest ?? base), ...patch };
        await this.runStorage.set(base.id, next);
        this.events.publish(next.id, {
            event: 'run',
            data: { run: next, approved: await this.isApproved(next) },
        });
        return next;
    }
}