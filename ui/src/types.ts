export type RunStatus = 'queued' | 'running' | 'complete' | 'failed';

export type ComparisonStatus = 'unchanged' | 'changed' | 'added' | 'removed' | 'error';

export type PageComparison = {
    urlId: string;
    url: string;
    status: ComparisonStatus;
    score?: number;
    differentPixels?: number;
    message?: string;
};

export type Run = {
    id: string;
    url: string;
    urlId: string;
    urlIds: string[];
    urls: string[];
    failures: { url: string; message: string }[];
    pending: string[];
    status: RunStatus;
    error?: string;
    createdAt: string;
    baselineRunId?: string;
    comparisons: PageComparison[];
};

export type ListedRun = {
    run: Run;
    approved: boolean;
};
