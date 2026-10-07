import type { ComparisonStatus, PageComparison, Run, RunStatus } from './types';

const statusLabel: Record<RunStatus | ComparisonStatus | 'approved', string> = {
    queued: 'Queued',
    running: 'Running',
    complete: 'Complete',
    failed: 'Failed',
    unchanged: 'Unchanged',
    changed: 'Changed',
    added: 'New page',
    removed: 'Removed',
    error: 'Could not compare',
    approved: 'Approved baseline',
};

const comparisonRank: Record<ComparisonStatus, number> = {
    changed: 0,
    added: 1,
    removed: 2,
    error: 3,
    unchanged: 4,
};

export function label(status: RunStatus | ComparisonStatus | 'approved'): string {
    return statusLabel[status];
}

export function isActive(status: RunStatus): boolean {
    return status === 'queued' || status === 'running';
}

export function formatTime(value: string): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function changeCount(run: Run): number | null {
    if (run.status !== 'complete' || run.baselineRunId === undefined) {
        return null;
    }

    return run.comparisons.filter((comparison) => comparison.status !== 'unchanged').length;
}

export function sortComparisons(comparisons: PageComparison[]): PageComparison[] {
    return [...comparisons].sort((left, right) => comparisonRank[left.status] - comparisonRank[right.status]);
}

export function comparisonSummary(comparisons: PageComparison[]): string {
    const counts = new Map<string, number>();

    for (const comparison of comparisons) {
        counts.set(comparison.status, (counts.get(comparison.status) ?? 0) + 1);
    }

    return [...counts.entries()].map(([status, count]) => `${count} ${status}`).join(', ') + '.';
}

export function imagePath(runId: string, urlId: string, kind: 'images' | 'diffs'): string {
    return `/runs/${encodeURIComponent(runId)}/${kind}/${encodeURIComponent(urlId)}`;
}
