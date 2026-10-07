import path from 'node:path';
import express, { type ErrorRequestHandler, type Express, type Request, type Response } from 'express';
import type { VisRegTester } from '../VisRegTester';
import { createApiRouter } from './api';
import {Filesystem} from "@littlemissrobot/highfive";
import {ListingFilesystem} from "../contracts/ListingFilesystem";

const runIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const urlIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type AppDependencies = {
    tester: VisRegTester;
    filesystem: Filesystem & ListingFilesystem;
};

export function createApp(dependencies: AppDependencies): Express {
    const { tester, filesystem } = dependencies;
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
        );
    }));

    app.get('/runs/:runId/diffs/:urlId', asyncHandler(async (request, response) => {
        await sendImage(
            filesystem,
            response,
            routeParam(request.params.runId),
            routeParam(request.params.urlId),
            'diffs',
        );
    }));

    app.use('/api', createApiRouter(tester));

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
): Promise<void> {
    if (!runIdPattern.test(runId) || !urlIdPattern.test(urlId)) {
        response.status(404).type('text/plain').send('Image not found.');
        return;
    }

    const path = kind === 'images'
        ? `runs/run-${runId}/${urlId}.png`
        : `diffs/${runId}/diff-${urlId}.png`;

    if (!await filesystem.exists(path)) {
        response.status(404).type('text/plain').send('Image not found.');
        return;
    }

    const bytes = await filesystem.read(path);
    response.type('png').send(Buffer.from(bytes));
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
