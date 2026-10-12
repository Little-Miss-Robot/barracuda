import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, createProject, listProjects, listRuns } from '../api';
import { changeCount, formatResolution, formatTime, isActive, label } from '../format';
import type { ListedRun, Project } from '../types';

export function HomePage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = 'Projects · Barracuda';
    }, []);

    useEffect(() => {
        let cancelled = false;
        let timer = 0;

        const load = () => {
            Promise.all([listProjects(), listRuns()])
                .then(([nextProjects, nextRuns]) => {
                    if (cancelled) {
                        return;
                    }

                    setProjects(nextProjects);
                    setRuns(nextRuns);
                    setError(null);

                    if (nextRuns.some((item) => isActive(item.run.status))) {
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
            const created = await createProject({
                url,
                ...(name.trim() ? { name: name.trim() } : {}),
            });
            navigate(`/projects/${created.urlId}`);
        } catch (reason) {
            setError(messageFrom(reason));
            setSubmitting(false);
        }
    }

    return (
        <>
            <section className="panel">
                <h1>Projects</h1>
                <p className="lede">Add a site, then choose the resolutions and extra URLs its runs should use.</p>
                {error ? <p className="banner" role="alert">{error}</p> : null}
                <form onSubmit={onSubmit}>
                    <div className="form-row">
                        <input
                            id="url"
                            name="url"
                            type="url"
                            required
                            aria-label="URL"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                        />
                        <input
                            id="name"
                            name="name"
                            type="text"
                            aria-label="Name"
                            placeholder="Name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <button type="submit" disabled={submitting}>Add project</button>
                    </div>
                </form>
            </section>
            <section>
                {projects === null ? <p className="empty">Loading projects…</p> : null}
                {projects?.length === 0 ? <p className="empty">No projects yet. Add a URL to create one.</p> : null}
                {projects && projects.length > 0 ? (
                    <ul className="project-grid">
                        {projects.map((project) => {
                            const latest = (runs ?? []).find((item) => item.run.urlId === project.urlId);
                            const changes = latest ? changeCount(latest.run) : null;

                            return (
                                <li className="project-card" key={project.urlId}>
                                    <div className="card-heading">
                                        <h2><Link to={`/projects/${project.urlId}`}>{project.name}</Link></h2>
                                        {latest ? (
                                            <span className={`status status-${latest.run.status}`}>{label(latest.run.status)}</span>
                                        ) : null}
                                    </div>
                                    <a className="card-url" href={project.url} target="_blank" rel="noreferrer">{project.url}</a>
                                    <p className="meta">{project.resolutions.map(formatResolution).join(', ')}</p>
                                    <p className="meta">
                                        {latest ? (
                                            <>
                                                <Link to={`/runs/${latest.run.id}`}>{formatTime(latest.run.createdAt)}</Link>
                                                {' · '}
                                                {changes === null ? 'No comparison yet' : formatChangeCount(changes)}
                                            </>
                                        ) : 'No runs yet'}
                                    </p>
                                    <p className="card-actions">
                                        <Link className="quiet" to={`/projects/${project.urlId}/settings`}>Settings</Link>
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}
            </section>
        </>
    );
}

function formatChangeCount(count: number): string {
    return count === 1 ? '1 change' : `${count} changes`;
}

function messageFrom(reason: unknown): string {
    if (reason instanceof ApiError || reason instanceof Error) {
        return reason.message;
    }

    return 'The request could not be completed.';
}
