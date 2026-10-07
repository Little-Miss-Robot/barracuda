import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, createRun, listRuns } from '../api';
import { changeCount, formatTime, isActive, label } from '../format';
import type { ListedRun } from '../types';

export function HomePage() {
    const navigate = useNavigate();
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = 'Runs · Barracuda';
    }, []);

    useEffect(() => {
        let cancelled = false;
        let timer = 0;

        const load = () => {
            listRuns()
                .then((next) => {
                    if (cancelled) {
                        return;
                    }

                    setRuns(next);

                    if (next.some((item) => isActive(item.run.status))) {
                        timer = window.setTimeout(load, 2000);
                    }
                })
                .catch((reason: unknown) => {
                    if (!cancelled) {
                        setError(messageFrom(reason));
                    }
                });
        };

        load();

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, []);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const created = await createRun(url);
            navigate(`/runs/${created.run.id}`);
        } catch (reason) {
            setError(messageFrom(reason));
            setSubmitting(false);
        }
    }

    return (
        <>
            <section className="panel">
                <h1>Start a run</h1>
                <p className="lede">Crawl a site, screenshot each page, and compare it with the approved baseline.</p>
                {error ? <p className="banner" role="alert">{error}</p> : null}
                <form onSubmit={onSubmit}>
                    <label htmlFor="url">URL</label>
                    <div className="form-row">
                        <input
                            id="url"
                            name="url"
                            type="url"
                            required
                            placeholder="https://example.com"
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                        />
                        <button type="submit" disabled={submitting}>Start run</button>
                    </div>
                </form>
            </section>
            <section>
                <h2>Past runs</h2>
                {runs === null ? <p className="empty">Loading runs…</p> : null}
                {runs?.length === 0 ? <p className="empty">No runs yet. Enter a URL to capture a baseline.</p> : null}
                {runs && runs.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>URL</th>
                                <th>When</th>
                                <th>Status</th>
                                <th>Changes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map((item) => {
                                const changes = changeCount(item.run);

                                return (
                                    <tr key={item.run.id}>
                                        <td>
                                            <Link to={`/runs/${item.run.id}`}>{item.run.url}</Link>
                                            {item.approved ? <span className="status status-approved"> Baseline</span> : null}
                                        </td>
                                        <td>{formatTime(item.run.createdAt)}</td>
                                        <td><span className={`status status-${item.run.status}`}>{label(item.run.status)}</span></td>
                                        <td>{changes === null ? '—' : changes}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : null}
            </section>
        </>
    );
}

function messageFrom(reason: unknown): string {
    if (reason instanceof ApiError || reason instanceof Error) {
        return reason.message;
    }

    return 'The request could not be completed.';
}
