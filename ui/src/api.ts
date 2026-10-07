import type { ListedRun } from './types';

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export function listRuns(): Promise<ListedRun[]> {
    return request<ListedRun[]>('/api/runs');
}

export function getRun(runId: string): Promise<ListedRun> {
    return request<ListedRun>(`/api/runs/${encodeURIComponent(runId)}`);
}

export function createRun(url: string): Promise<ListedRun> {
    return request<ListedRun>('/api/runs', {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
}

export function approveRun(runId: string): Promise<ListedRun> {
    return request<ListedRun>(`/api/runs/${encodeURIComponent(runId)}/approve`, {
        method: 'POST',
    });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...init?.headers,
        },
    });

    const body: unknown = await response.json().catch(() => null);
    const error = readError(body);

    if (!response.ok) {
        throw new ApiError(error ?? 'The request could not be completed.', response.status);
    }

    return body as T;
}

function readError(body: unknown): string | undefined {
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        return body.error;
    }

    return undefined;
}
