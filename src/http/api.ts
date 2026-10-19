import express, { type ErrorRequestHandler, type Request, type Response, type Router } from 'express';
import type { VisRegTester } from '../VisRegTester';
import {ProjectRepository} from "../ProjectRepository";
import {ProjectError} from "../errors/ProjectError";

const runIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const urlIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createApiRouter(tester: VisRegTester, projects: ProjectRepository): Router {
    const router = express.Router();

    router.use(express.json());

    router.get('/runs', asyncHandler(async (_request, response) => {
        response.json(await tester.listRuns());
    }));

    router.post('/runs', asyncHandler(async (request, response) => {
        const url = typeof request.body?.url === 'string' ? request.body.url.trim() : '';

        try {
            const run = await tester.createRun(url);
            void tester.execute(run.id).catch((error: unknown) => {
                console.error(error);
            });
            response.status(202).json({ run, approved: false });
        } catch (error) {
            response.status(400).json({
                error: error instanceof Error ? error.message : 'The URL could not be started.',
            });
        }
    }));

    router.get('/runs/:runId', asyncHandler(async (request, response) => {
        const runId = routeParam(request.params.runId);

        if (!runIdPattern.test(runId)) {
            response.status(404).json({ error: 'That run could not be found.' });
            return;
        }

        const details = await tester.getRun(runId);

        if (!details) {
            response.status(404).json({ error: 'That run could not be found.' });
            return;
        }

        response.json(details);
    }));

    router.get('/projects', asyncHandler(async (_request, response) => {
        response.json(await projects.list());
    }));

    router.post('/projects', asyncHandler(async (request, response) => {
        try {
            const project = await projects.create({
                url: request.body?.url,
                name: request.body?.name,
                resolutions: request.body?.resolutions,
                extraUrls: request.body?.extraUrls,
                screenshotScript: request.body?.screenshotScript,
            });
            response.status(201).json(project);
        } catch (error) {
            sendProjectError(error, response);
        }
    }));

    router.get('/projects/:urlId', asyncHandler(async (request, response) => {
        const urlId = routeParam(request.params.urlId);

        if (!urlIdPattern.test(urlId)) {
            response.status(404).json({ error: 'That project could not be found.' });
            return;
        }

        const project = await projects.get(urlId);

        if (!project) {
            response.status(404).json({ error: 'That project could not be found.' });
            return;
        }

        response.json(project);
    }));

    router.patch('/projects/:urlId', asyncHandler(async (request, response) => {
        const urlId = routeParam(request.params.urlId);

        if (!urlIdPattern.test(urlId)) {
            response.status(404).json({ error: 'That project could not be found.' });
            return;
        }

        try {
            response.json(await projects.update(urlId, {
                name: request.body?.name,
                resolutions: request.body?.resolutions,
                extraUrls: request.body?.extraUrls,
                screenshotScript: request.body?.screenshotScript,
            }));
        } catch (error) {
            sendProjectError(error, response);
        }
    }));

    router.delete('/projects/:urlId', asyncHandler(async (request, response) => {
        const urlId = routeParam(request.params.urlId);

        if (!urlIdPattern.test(urlId)) {
            response.status(404).json({ error: 'That project could not be found.' });
            return;
        }

        try {
            await projects.delete(urlId);
            response.status(204).end();
        } catch (error) {
            sendProjectError(error, response);
        }
    }));

    router.post('/runs/:runId/approve', asyncHandler(async (request, response) => {
        const runId = routeParam(request.params.runId);

        if (!runIdPattern.test(runId)) {
            response.status(404).json({ error: 'That run could not be found.' });
            return;
        }

        try {
            await tester.approve(runId);
            const details = await tester.getRun(runId);

            if (!details) {
                response.status(404).json({ error: 'That run could not be found.' });
                return;
            }

            response.json(details);
        } catch (error) {
            const details = await tester.getRun(runId);

            if (!details) {
                response.status(404).json({ error: 'That run could not be found.' });
                return;
            }

            response.status(409).json({
                error: error instanceof Error ? error.message : 'The run could not be approved.',
            });
        }
    }));

    router.use((_request, response) => {
        response.status(404).json({ error: 'That resource could not be found.' });
    });

    const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
        console.error(error);

        if (response.headersSent) {
            return;
        }

        if (isJsonParseError(error)) {
            response.status(400).json({ error: 'The request body must be JSON.' });
            return;
        }

        response.status(500).json({ error: 'The request could not be completed.' });
    };

    router.use(handleError);

    return router;
}

function sendProjectError(error: unknown, response: Response): void {
    if (error instanceof ProjectError) {
        response.status(error.status).json({ error: error.message });
        return;
    }

    throw error;
}

function isJsonParseError(error: unknown): boolean {
    return error instanceof SyntaxError
        && 'status' in error
        && error.status === 400
        && 'type' in error
        && error.type === 'entity.parse.failed';
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
