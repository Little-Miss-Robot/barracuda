import path from 'node:path';
import express, { type ErrorRequestHandler, type Express, type Request, type Response } from 'express';
import type { VisRegTester } from '../VisRegTester';
import { renderHome, renderMessage, renderRun } from './pages';
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

    app.get('/', asyncHandler(async (_request, response) => {
        const runs = await tester.listRuns();
        response.type('html').send(renderHome({ runs }));
    }));

    app.post('/runs', asyncHandler(async (request, response) => {
        const url = typeof request.body?.url === 'string' ? request.body.url.trim() : '';

        try {
            const run = await tester.createRun(url);
            void tester.execute(run.id).catch((error: unknown) => {
                console.error(error);
            });
            response.redirect(303, `/runs/${run.id}`);
        } catch (error) {
            const runs = await tester.listRuns();
            response.status(400).type('html').send(renderHome({
                runs,
                url,
                error: error instanceof Error ? error.message : 'The URL could not be started.',
            }));
        }
    }));

    app.get('/runs/:runId', asyncHandler(async (request, response) => {
        const runId = routeParam(request.params.runId);

        if (!runIdPattern.test(runId)) {
            response.status(404).type('html').send(renderMessage('Not found', 'That run could not be found.'));
            return;
        }

        const details = await tester.getRun(runId);

        if (!details) {
            response.status(404).type('html').send(renderMessage('Not found', 'That run could not be found.'));
            return;
        }

        response.type('html').send(renderRun(details));
    }));

    app.post('/runs/:runId/approve', asyncHandler(async (request, response) => {
        const runId = routeParam(request.params.runId);

        if (!runIdPattern.test(runId)) {
            response.status(404).type('html').send(renderMessage('Not found', 'That run could not be found.'));
            return;
        }

        try {
            await tester.approve(runId);
            response.redirect(303, `/runs/${runId}`);
        } catch (error) {
            const details = await tester.getRun(runId);

            if (!details) {
                response.status(404).type('html').send(renderMessage('Not found', 'That run could not be found.'));
                return;
            }

            response.status(409).type('html').send(renderRun({
                ...details,
                error: error instanceof Error ? error.message : 'The run could not be approved.',
            }));
        }
    }));

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

    app.use((_request, response) => {
        response.status(404).type('html').send(renderMessage('Not found', 'That page does not exist.'));
    });

    const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
        console.error(error);

        if (response.headersSent) {
            return;
        }

        response.status(500).type('html').send(renderMessage(
            'Something went wrong',
            'The request could not be completed.',
        ));
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
