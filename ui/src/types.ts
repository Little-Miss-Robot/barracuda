export type RunStatus = 'queued' | 'running' | 'complete' | 'failed';

export type Capture = {
    url: string;
    urlId: string;
    resolution: Resolution;
    status: 'captured' | 'failed';
    message?: string;
};

export type RunActivity = {
    step: 'scraping' | 'capturing' | 'comparing';
    done?: number;
    total?: number;
};

export type ComparisonStatus = 'unchanged' | 'changed' | 'added' | 'removed' | 'error';

export type Resolution = {
    width: number;
    height: number;
};

export type PageComparison = {
    urlId: string;
    url: string;
    resolution?: Resolution;
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
    resolutions?: Resolution[];
    failures: { url: string; message: string }[];
    pending: string[];
    captures?: Capture[];
    activity?: RunActivity;
    status: RunStatus;
    error?: string;
    createdAt: string;
    baselineRunId?: string;
    comparisons: PageComparison[];
};

export type Project = {
    urlId: string;
    url: string;
    name: string;
    resolutions: Resolution[];
    extraUrls: string[];
    screenshotScript: string;
};

export type ListedRun = {
    run: Run;
    approved: boolean;
};
