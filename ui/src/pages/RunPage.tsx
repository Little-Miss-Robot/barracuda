import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, approveRun, getRun } from '../api';
import { Comparisons } from '../components/Comparisons';
import { formatTime, isActive, label } from '../format';
import type { ListedRun, Run } from '../types';

export function RunPage() {
    const { runId = '' } = useParams();
    const [details, setDetails] = useState<ListedRun | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [missing, setMissing] = useState(false);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        getRun(runId)
            .then((next) => {
                if (cancelled) {
                    return;
                }

                setDetails(next);
                setMissing(false);
                setError(null);
            })
            .catch((reason: unknown) => {
                if (cancelled) {
                    return;
                }

                if (reason instanceof ApiError && reason.status === 404) {
                    setMissing(true);
                    return;
                }

                setError(messageFrom(reason));
            });

        return () => {
            cancelled = true;
        };
    }, [runId]);

    const status = details?.run.status;

    useEffect(() => {
        if (!status || !isActive(status)) {
            return;
        }

        const timer = window.setInterval(() => {
            getRun(runId)
                .then((next) => {
                    setDetails(next);
                    setError(null);
                })
                .catch((reason: unknown) => {
                    if (reason instanceof ApiError && reason.status === 404) {
                        setMissing(true);
                        return;
                    }

                    setError(messageFrom(reason));
                });
        }, 2000);

        return () => window.clearInterval(timer);
    }, [runId, status]);

    useEffect(() => {
        document.title = `${details?.run.url ?? (missing ? 'Not found' : 'Run')} · Barracuda`;
    }, [details, missing]);

    if (missing) {
        return (
            <>
                <p className="crumb"><Link to="/">All runs</Link></p>
                <h1>Not found</h1>
                <p className="lede">That run could not be found.</p>
            </>
        );
    }

    if (!details) {
        return error
            ? <p className="banner" role="alert">{error}</p>
            : <p className="lede">Loading run…</p>;
    }

    const { run, approved } = details;

    async function onApprove(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setApproving(true);
        setError(null);

        try {
            setDetails(await approveRun(runId));
        } catch (reason) {
            setError(messageFrom(reason));
        } finally {
            setApproving(false);
        }
    }

    return (
        <>
            <p className="crumb"><Link to="/">All runs</Link></p>
            <header className="run-header">
                <div>
                    <h1><a href={run.url} target="_blank" rel="noreferrer">{run.url}</a></h1>
                    <p className="meta">
                        <span className={`status status-${run.status}`}>{label(run.status)}</span>
                        {approved ? <span className="status status-approved">Approved baseline</span> : null}
                        {' '}
                        <time dateTime={run.createdAt}>{formatTime(run.createdAt)}</time>
                    </p>
                    <BaselineNote run={run} />
                    {isActive(run.status) ? <p className="lede">This page refreshes until the run finishes.</p> : null}
                    {run.error ? <p className="banner" role="alert">{run.error}</p> : null}
                    {error ? <p className="banner" role="alert">{error}</p> : null}
                </div>
                {!approved && run.status === 'complete' ? (
                    <form onSubmit={onApprove}>
                        <button type="submit" disabled={approving}>Approve as baseline</button>
                    </form>
                ) : null}
            </header>
            <Comparisons run={run} />
            <Failures run={run} />
            <Pending run={run} />
        </>
    );
}

function BaselineNote({ run }: { run: Run }) {
    if (!run.baselineRunId || run.status !== 'complete') {
        return null;
    }

    if (run.baselineRunId === run.id) {
        return <p className="lede">This run is the approved baseline, so the diff compares it with itself.</p>;
    }

    return (
        <p className="lede">
            Compared with baseline <Link to={`/runs/${run.baselineRunId}`}>{run.baselineRunId}</Link>.
        </p>
    );
}

function Failures({ run }: { run: Run }) {
    if (run.failures.length === 0) {
        return null;
    }

    return (
        <section>
            <h2>Scrape failures</h2>
            <ul className="issues">
                {run.failures.map((failure) => (
                    <li key={failure.url}>
                        <a href={failure.url} target="_blank" rel="noreferrer">{failure.url}</a>
                        <p>{failure.message}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function Pending({ run }: { run: Run }) {
    if (run.pending.length === 0) {
        return null;
    }

    return (
        <section>
            <h2>Pending URLs</h2>
            <p className="lede">These pages were discovered after the crawl reached its page limit.</p>
            <ul className="plain">
                {run.pending.map((url) => (
                    <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>
                ))}
            </ul>
        </section>
    );
}

function messageFrom(reason: unknown): string {
    if (reason instanceof ApiError || reason instanceof Error) {
        return reason.message;
    }

    return 'The request could not be completed.';
}
