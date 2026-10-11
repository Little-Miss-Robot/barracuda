import path from 'node:path';
import express, { type ErrorRequestHandler, type Express, type Request, type Response } from 'express';
import type { VisRegTester } from '../VisRegTester';
import { createApiRouter } from './api';
import {Filesystem} from "@littlemissrobot/highfive";
import {ListingFilesystem} from "../contracts/ListingFilesystem";
import {ProjectRepository} from "../ProjectRepository";
import {Resolution} from "../entities/Resolution";
import {screenshotCandidates} from "../utils/screenshots";

const runIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const urlIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type AppDependencies = {
    tester: VisRegTester;
    projects: ProjectRepository;
    filesystem: Filesystem & ListingFilesystem;
};

export function createApp(dependencies: AppDependencies): Express {
    const { tester, projects, filesystem } = dependencies;
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(process.cwd(), 'public')));

    app.get('/runs/:runId/images/:urlId', asyncHandler(async (request, response) => {
        await sendImage(
            filesystem,
            response,
            routeParam(request.params.runId),
            routeParam(request.params.urlId),
            'images',
            requestedResolution(request),
        );
    }));

    app.get('/runs/:runId/diffs/:urlId', asyncHandler(async (request, response) => {
        await sendImage(
            filesystem,
            response,
            routeParam(request.params.runId),
            routeParam(request.params.urlId),
            'diffs',
            requestedResolution(request),
        );
    }));

    app.use('/api', createApiRouter(tester, projects));

    app.use((_request, response) => {
        response.status(404).type('html').send('That page does not exist.');
    });

    const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
        console.error(error);

        if (response.headersSent) {
            return;
        }

        response.status(500).type('html').send('The request could not be completed.');
    };

    app.use(handleError);

    return app;
}

async function sendImage(
    filesystem: Filesystem,
    response: Response,
    runId: string,
    urlId: string,
    kind: 'images' | 'diffs',
    resolution: Resolution | undefined | 'invalid',
): Promise<void> {
    if (!runIdPattern.test(runId) || !urlIdPattern.test(urlId) || resolution === 'invalid') {
        response.status(404).type('text/plain').send('Image not found.');
        return;
    }

    let path: string | undefined;

    for (const candidate of screenshotCandidates(runId, urlId, resolution, kind)) {
        if (await filesystem.exists(candidate)) {
            path = candidate;
            break;
        }
    }

    if (!path) {
        response.status(404).type('text/plain').send('Image not found.');
        return;
    }

    const bytes = await filesystem.read(path);
    response.type('png').send(Buffer.from(bytes));
}

function requestedResolution(request: Request): Resolution | undefined | 'invalid' {
    if (request.query.width === undefined && request.query.height === undefined) {
        return undefined;
    }

    const width = Number(request.query.width);
    const height = Number(request.query.height);

    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192) {
        return 'invalid';
    }

    return { width, height };
}

function routeParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    return value ?? '';
}

function asyncHandler(
    handler: (request: Request, response: Response) => Promise<void>,
): (request: Request, response: Response, next: (error: unknown) => void) => void {
    return (request, response, next) => {
        handler(request, response).catch(next);
    };
}
