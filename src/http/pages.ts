import type { ListedRun, PageComparison, Run, RunStatus } from '../VisRegTester';

export type HomeView = {
    runs: ListedRun[];
    error?: string;
    url?: string;
};

export type RunView = ListedRun & {
    error?: string;
};

const statusLabel: Record<RunStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    complete: 'Complete',
    failed: 'Failed',
};

const comparisonRank: Record<PageComparison['status'], number> = {
    changed: 0,
    added: 1,
    removed: 2,
    error: 3,
    unchanged: 4,
};

const comparisonLabel: Record<PageComparison['status'], string> = {
    unchanged: 'Unchanged',
    changed: 'Changed',
    added: 'New page',
    removed: 'Removed',
    error: 'Could not compare',
};

export function renderHome(view: HomeView): string {
    const polling = view.runs.some((item) => isActive(item.run.status));
    const rows = view.runs.length === 0
        ? '<p class="empty">No runs yet. Enter a URL to capture a baseline.</p>'
        : `<table>
            <thead>
                <tr>
                    <th>URL</th>
                    <th>When</th>
                    <th>Status</th>
                    <th>Changes</th>
                </tr>
            </thead>
            <tbody>
                ${view.runs.map(renderRunRow).join('')}
            </tbody>
        </table>`;

    return layout({
        title: 'Runs',
        polling,
        body: `
            <section class="panel">
                <h1>Start a run</h1>
                <p class="lede">Crawl a site, screenshot each page, and compare it with the approved baseline.</p>
                ${view.error ? `<p class="banner" role="alert">${escapeHtml(view.error)}</p>` : ''}
                <form method="post" action="/runs">
                    <label for="url">URL</label>
                    <div class="form-row">
                        <input id="url" name="url" type="url" required placeholder="https://example.com" value="${escapeHtml(view.url ?? '')}">
                        <button type="submit">Start run</button>
                    </div>
                </form>
            </section>
            <section>
                <h2>Past runs</h2>
                ${rows}
            </section>
        `,
    });
}

export function renderRun(view: RunView): string {
    const { run, approved } = view;
    const polling = isActive(run.status);
    const baselineNote = baselineCopy(run);

    return layout({
        title: run.url,
        polling,
        body: `
            <p class="crumb"><a href="/">All runs</a></p>
            <header class="run-header">
                <div>
                    <h1><a href="${escapeHtml(run.url)}" target="_blank" rel="noreferrer">${escapeHtml(run.url)}</a></h1>
                    <p class="meta">
                        <span class="status status-${run.status}">${statusLabel[run.status]}</span>
                        ${approved ? '<span class="status status-approved">Approved baseline</span>' : ''}
                        <time datetime="${escapeHtml(run.createdAt)}">${escapeHtml(formatTime(run.createdAt))}</time>
                    </p>
                    ${baselineNote ? `<p class="lede">${baselineNote}</p>` : ''}
                    ${polling ? '<p class="lede">This page refreshes until the run finishes.</p>' : ''}
                    ${run.error ? `<p class="banner" role="alert">${escapeHtml(run.error)}</p>` : ''}
                    ${view.error ? `<p class="banner" role="alert">${escapeHtml(view.error)}</p>` : ''}
                </div>
                ${approveControl(run, approved)}
            </header>
            ${renderComparisons(run)}
            ${renderFailures(run)}
            ${renderPending(run)}
        `,
    });
}

export function renderMessage(title: string, message: string): string {
    return layout({
        title,
        polling: false,
        body: `
            <p class="crumb"><a href="/">All runs</a></p>
            <h1>${escapeHtml(title)}</h1>
            <p class="lede">${escapeHtml(message)}</p>
        `,
    });
}

function renderRunRow(item: ListedRun): string {
    const { run, approved } = item;
    const changes = changeCount(run);

    return `<tr>
        <td><a href="/runs/${escapeHtml(run.id)}">${escapeHtml(run.url)}</a>${approved ? ' <span class="status status-approved">Baseline</span>' : ''}</td>
        <td>${escapeHtml(formatTime(run.createdAt))}</td>
        <td><span class="status status-${run.status}">${statusLabel[run.status]}</span></td>
        <td>${changes === null ? '—' : String(changes)}</td>
    </tr>`;
}

function approveControl(run: Run, approved: boolean): string {
    if (approved || run.status !== 'complete') {
        return '';
    }

    return `<form method="post" action="/runs/${escapeHtml(run.id)}/approve">
        <button type="submit">Approve as baseline</button>
    </form>`;
}

function renderFailures(run: Run): string {
    if (run.failures.length === 0) {
        return '';
    }

    const items = run.failures.map((failure) => `<li>
        <a href="${escapeHtml(failure.url)}" target="_blank" rel="noreferrer">${escapeHtml(failure.url)}</a>
        <p>${escapeHtml(failure.message)}</p>
    </li>`).join('');

    return `<section>
        <h2>Scrape failures</h2>
        <ul class="issues">${items}</ul>
    </section>`;
}

function renderPending(run: Run): string {
    if (run.pending.length === 0) {
        return '';
    }

    const items = run.pending.map((url) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></li>`).join('');

    return `<section>
        <h2>Pending URLs</h2>
        <p class="lede">These pages were discovered after the crawl reached its page limit.</p>
        <ul class="plain">${items}</ul>
    </section>`;
}

function renderComparisons(run: Run): string {
    if (run.comparisons.length === 0) {
        if (run.status === 'complete') {
            return '<section><h2>Diffs</h2><p class="empty">No pages were captured.</p></section>';
        }

        return '';
    }

    const ordered = [...run.comparisons].sort((left, right) => {
        return comparisonRank[left.status] - comparisonRank[right.status];
    });

    return `<section data-review data-mode="side">
        <div class="section-heading">
            <h2>Diffs</h2>
            <div class="view-toggle" role="group" aria-label="Diff layout">
                <button type="button" data-view="side" aria-pressed="true">Side by side</button>
                <button type="button" data-view="overlay" aria-pressed="false">Overlay</button>
            </div>
        </div>
        <p class="lede">${escapeHtml(comparisonSummary(ordered))} Red marks changed pixels. The overlay slider fades this run over the baseline.</p>
        ${ordered.map((comparison) => renderComparison(run, comparison)).join('')}
    </section>`;
}

function renderComparison(run: Run, comparison: PageComparison): string {
    const baselineRunId = run.baselineRunId;
    const score = comparison.score === undefined
        ? ''
        : `<p class="score">${comparison.score.toFixed(2)}% · ${comparison.differentPixels ?? 0} pixels</p>`;
    const message = comparison.message ? `<p class="banner">${escapeHtml(comparison.message)}</p>` : '';

    return `<article class="comparison">
        <header>
            <h3><a href="${escapeHtml(comparison.url)}" target="_blank" rel="noreferrer">${escapeHtml(comparison.url)}</a></h3>
            <p class="meta"><span class="status status-${comparison.status}">${comparisonLabel[comparison.status]}</span></p>
            ${score}
            ${message}
        </header>
        ${renderFrames(run, baselineRunId, comparison)}
    </article>`;
}

function renderFrames(run: Run, baselineRunId: string | undefined, comparison: PageComparison): string {
    const current = image(run.id, comparison.urlId, 'images');
    const baseline = baselineRunId ? image(baselineRunId, comparison.urlId, 'images') : '';
    const diff = image(run.id, comparison.urlId, 'diffs');

    if (comparison.status === 'added') {
        return `<div class="frames side">${figure('This run', current)}</div>`;
    }

    if (comparison.status === 'removed') {
        return baseline ? `<div class="frames side">${figure('Baseline', baseline)}</div>` : '';
    }

    if (comparison.status === 'error' || !baseline) {
        return '';
    }

    return `<div class="frames side">
        ${figure('Baseline', baseline)}
        ${figure('This run', current)}
        ${figure('Diff', diff)}
    </div>
    <div class="overlay">
        <div class="frame">
            <div class="stack">
                <img src="${baseline}" alt="Baseline screenshot">
                <img class="overlay-top" src="${current}" alt="This run, layered on the baseline">
            </div>
        </div>
        <label>Baseline <input data-opacity type="range" min="0" max="100" value="50"> This run</label>
    </div>`;
}

function figure(caption: string, src: string): string {
    return `<figure class="frame">
        <figcaption>${caption}</figcaption>
        <img src="${src}" alt="${escapeHtml(caption)} screenshot">
    </figure>`;
}

function image(runId: string, urlId: string, kind: 'images' | 'diffs'): string {
    return `/runs/${encodeURIComponent(runId)}/${kind}/${encodeURIComponent(urlId)}`;
}

function baselineCopy(run: Run): string {
    if (!run.baselineRunId || run.status !== 'complete') {
        return '';
    }

    if (run.baselineRunId === run.id) {
        return 'This run is the approved baseline, so the diff compares it with itself.';
    }

    return `Compared with baseline <a href="/runs/${escapeHtml(run.baselineRunId)}">${escapeHtml(run.baselineRunId)}</a>.`;
}

function comparisonSummary(comparisons: PageComparison[]): string {
    const counts = new Map<string, number>();

    for (const comparison of comparisons) {
        counts.set(comparison.status, (counts.get(comparison.status) ?? 0) + 1);
    }

    return [...counts.entries()]
        .map(([status, count]) => `${count} ${status}`)
        .join(', ') + '.';
}

function changeCount(run: Run): number | null {
    if (run.status !== 'complete' || run.baselineRunId === undefined) {
        return null;
    }

    return run.comparisons.filter((comparison) => comparison.status !== 'unchanged').length;
}

function isActive(status: RunStatus): boolean {
    return status === 'queued' || status === 'running';
}

function formatTime(value: string): string {
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

function layout(options: { title: string; polling: boolean; body: string }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(options.title)} · Barracuda</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body${options.polling ? ' data-poll="true"' : ''}>
    <header class="site">
        <a class="brand" href="/">Barracuda</a>
        <p>Visual regression</p>
    </header>
    <main>
        ${options.body}
    </main>
    <script src="/app.js"></script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
