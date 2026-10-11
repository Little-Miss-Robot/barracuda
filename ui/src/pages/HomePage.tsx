import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, createProject, deleteProject, listProjects, listRuns } from '../api';
import { formatResolution, formatTime, isActive, label } from '../format';
import type { ListedRun, Project } from '../types';

export function HomePage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

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

    async function onRemove(project: Project) {
        setRemovingId(project.urlId);
        setError(null);

        try {
            await deleteProject(project.urlId);
            setProjects((current) => current?.filter((item) => item.urlId !== project.urlId) ?? null);
            setRuns((current) => current?.filter((item) => item.run.urlId !== project.urlId) ?? null);
            setConfirmingId(null);
        } catch (reason) {
            setError(messageFrom(reason));
        } finally {
            setRemovingId(null);
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
                <h2>All projects</h2>
                {projects === null ? <p className="empty">Loading projects…</p> : null}
                {projects?.length === 0 ? <p className="empty">No projects yet. Add a URL to create one.</p> : null}
                {projects && projects.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>URL</th>
                                <th>Resolutions</th>
                                <th>Latest run</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => {
                                const projectRuns = (runs ?? []).filter((item) => item.run.urlId === project.urlId);
                                const latest = projectRuns[0];

                                return (
                                    <tr key={project.urlId}>
                                        <td><Link to={`/projects/${project.urlId}`}>{project.name}</Link></td>
                                        <td><a href={project.url} target="_blank" rel="noreferrer">{project.url}</a></td>
                                        <td>{project.resolutions.map(formatResolution).join(', ')}</td>
                                        <td>
                                            {latest ? (
                                                <>
                                                    <Link to={`/runs/${latest.run.id}`}>{formatTime(latest.run.createdAt)}</Link>
                                                    {' '}
                                                    <span className={`status status-${latest.run.status}`}>{label(latest.run.status)}</span>
                                                </>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {confirmingId === project.urlId ? (
                                                <div className="inline-actions">
                                                    <button
                                                        type="button"
                                                        className="danger"
                                                        disabled={removingId === project.urlId}
                                                        onClick={() => onRemove(project)}
                                                    >
                                                        Remove project and runs
                                                    </button>
                                                    <button type="button" className="quiet" onClick={() => setConfirmingId(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button type="button" className="quiet" onClick={() => setConfirmingId(project.urlId)}>Remove</button>
                                            )}
                                        </td>
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
