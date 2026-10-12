import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, createRun, getProject, listRuns } from '../api';
import { changeCount, formatResolution, formatTime, isActive, label } from '../format';
import type { ListedRun, Project } from '../types';

export function ProjectPage() {
    const { urlId = '' } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [missing, setMissing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        setProject(null);
        setRuns(null);
        setMissing(false);
        setError(null);

        Promise.all([getProject(urlId), listRuns()])
            .then(([nextProject, nextRuns]) => {
                if (cancelled) {
                    return;
                }

                setProject(nextProject);
                setRuns(nextRuns.filter((item) => item.run.urlId === nextProject.urlId));
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
    }, [urlId]);

    const active = runs?.some((item) => isActive(item.run.status)) ?? false;

    useEffect(() => {
        if (!project || !active) {
            return;
        }

        const timer = window.setInterval(() => {
            listRuns()
                .then((nextRuns) => {
                    setRuns(nextRuns.filter((item) => item.run.urlId === project.urlId));
                    setError(null);
                })
                .catch((reason: unknown) => {
                    setError(messageFrom(reason));
                });
        }, 2000);

        return () => window.clearInterval(timer);
    }, [project, active]);

    useEffect(() => {
        document.title = `${project?.name ?? (missing ? 'Not found' : 'Project')} · Barracuda`;
    }, [project, missing]);

    if (missing) {
        return (
            <>
                <p className="crumb"><Link to="/">Projects</Link></p>
                <h1>Not found</h1>
                <p className="lede">That project could not be found.</p>
            </>
        );
    }

    if (!project || runs === null) {
        return error
            ? <p className="banner" role="alert">{error}</p>
            : <p className="lede">Loading project…</p>;
    }

    const latest = runs[0];
    const latestChanges = latest ? changeCount(latest.run) : null;

    async function onStart() {
        setStarting(true);
        setError(null);

        try {
            const created = await createRun(project!.url);
            navigate(`/runs/${created.run.id}`);
        } catch (reason) {
            setError(messageFrom(reason));
            setStarting(false);
        }
    }

    return (
        <>
            <p className="crumb"><Link to="/">Projects</Link></p>
            <header className="run-header">
                <div>
                    <h1>{project.name}</h1>
                    <p className="meta"><a href={project.url} target="_blank" rel="noreferrer">{project.url}</a></p>
                    <p className="meta">Resolutions: {project.resolutions.map(formatResolution).join(', ')}</p>
                    <p className="meta">
                        {latest ? (
                            <>
                                Latest run{' '}
                                <Link to={`/runs/${latest.run.id}`}>{formatTime(latest.run.createdAt)}</Link>
                                {' '}
                                <span className={`status status-${latest.run.status}`}>{label(latest.run.status)}</span>
                                {latest.approved ? <span className="status status-approved"> Baseline</span> : null}
                                {latestChanges === null ? null : ` · ${formatChangeCount(latestChanges)}`}
                            </>
                        ) : 'No runs yet'}
                    </p>
                </div>
                <div className="inline-actions">
                    <button type="button" onClick={onStart} disabled={starting}>Start run</button>
                    <Link className="quiet" to={`/projects/${project.urlId}/settings`}>Settings</Link>
                </div>
            </header>
            {error ? <p className="banner" role="alert">{error}</p> : null}
            <section>
                <div className="section-heading">
                    <h2>Runs</h2>
                </div>
                {runs.length === 0 ? <p className="empty">No runs yet. Start one to capture this project.</p> : null}
                {runs.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
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
                                            <Link to={`/runs/${item.run.id}`}>{formatTime(item.run.createdAt)}</Link>
                                            {item.approved ? <span className="status status-approved"> Baseline</span> : null}
                                        </td>
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

function formatChangeCount(count: number): string {
    return count === 1 ? '1 change' : `${count} changes`;
}

function messageFrom(reason: unknown): string {
    if (reason instanceof ApiError || reason instanceof Error) {
        return reason.message;
    }

    return 'The request could not be completed.';
}
