import express, { type ErrorRequestHandler, type Request, type Response, type Router } from 'express';
import type { VisRegTester } from '../VisRegTester';

const runIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;

export function createApiRouter(tester: VisRegTester): Router {
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
