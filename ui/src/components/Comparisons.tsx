import { useState } from 'react';
import { comparisonSummary, imagePath, label, sortComparisons } from '../format';
import type { PageComparison, Run } from '../types';

type ViewMode = 'side' | 'overlay';

export function Comparisons({ run }: { run: Run }) {
    const [mode, setMode] = useState<ViewMode>('side');

    if (run.comparisons.length === 0) {
        if (run.status === 'complete') {
            return (
                <section>
                    <h2>Diffs</h2>
                    <p className="empty">No pages were captured.</p>
                </section>
            );
        }

        return null;
    }

    const ordered = sortComparisons(run.comparisons);

    return (
        <section data-mode={mode}>
            <div className="section-heading">
                <h2>Diffs</h2>
                <div className="view-toggle" role="group" aria-label="Diff layout">
                    <button type="button" aria-pressed={mode === 'side'} onClick={() => setMode('side')}>Side by side</button>
                    <button type="button" aria-pressed={mode === 'overlay'} onClick={() => setMode('overlay')}>Overlay</button>
                </div>
            </div>
            <p className="lede">{comparisonSummary(ordered)} Red marks changed pixels. The overlay slider fades this run over the baseline.</p>
            {ordered.map((comparison) => (
                <Comparison key={comparison.urlId} run={run} comparison={comparison} />
            ))}
        </section>
    );
}

function Comparison({ run, comparison }: { run: Run; comparison: PageComparison }) {
    const score = comparison.score === undefined
        ? null
        : `${comparison.score.toFixed(2)}% · ${comparison.differentPixels ?? 0} pixels`;

    return (
        <article className="comparison">
            <header>
                <h3><a href={comparison.url} target="_blank" rel="noreferrer">{comparison.url}</a></h3>
                <p className="meta"><span className={`status status-${comparison.status}`}>{label(comparison.status)}</span></p>
                {score ? <p className="score">{score}</p> : null}
                {comparison.message ? <p className="banner">{comparison.message}</p> : null}
            </header>
            <Frames run={run} comparison={comparison} />
        </article>
    );
}

function Frames({ run, comparison }: { run: Run; comparison: PageComparison }) {
    const current = imagePath(run.id, comparison.urlId, 'images');
    const baseline = run.baselineRunId ? imagePath(run.baselineRunId, comparison.urlId, 'images') : '';
    const diff = imagePath(run.id, comparison.urlId, 'diffs');

    if (comparison.status === 'added') {
        return (
            <div className="frames side">
                <Figure caption="This run" src={current} />
            </div>
        );
    }

    if (comparison.status === 'removed') {
        if (!baseline) {
            return null;
        }

        return (
            <div className="frames side">
                <Figure caption="Baseline" src={baseline} />
            </div>
        );
    }

    if (comparison.status === 'error' || !baseline) {
        return null;
    }

    return (
        <>
            <div className="frames side">
                <Figure caption="Baseline" src={baseline} />
                <Figure caption="This run" src={current} />
                <Figure caption="Diff" src={diff} />
            </div>
            <Overlay baseline={baseline} current={current} />
        </>
    );
}

function Figure({ caption, src }: { caption: string; src: string }) {
    return (
        <figure className="frame">
            <figcaption>{caption}</figcaption>
            <img src={src} alt={`${caption} screenshot`} />
        </figure>
    );
}

function Overlay({ baseline, current }: { baseline: string; current: string }) {
    const [opacity, setOpacity] = useState(50);

    return (
        <div className="overlay">
            <div className="frame">
                <div className="stack">
                    <img src={baseline} alt="Baseline screenshot" />
                    <img className="overlay-top" src={current} alt="This run, layered on the baseline" style={{ opacity: opacity / 100 }} />
                </div>
            </div>
            <label>
                Baseline
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={(event) => setOpacity(Number(event.target.value))}
                />
                This run
            </label>
        </div>
    );
}
