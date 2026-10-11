import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, createRun, deleteProject, getProject, listRuns, updateProject } from '../api';
import { changeCount, formatTime, isActive, label } from '../format';
import type { ListedRun, Project, Resolution } from '../types';

type ResolutionDraft = {
    width: string;
    height: string;
};

export function ProjectPage() {
    const { urlId = '' } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [missing, setMissing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [resolutions, setResolutions] = useState<ResolutionDraft[]>([]);
    const [extraUrls, setExtraUrls] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [starting, setStarting] = useState(false);
    const [confirmingRemove, setConfirmingRemove] = useState(false);
    const [removing, setRemoving] = useState(false);

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
                fillSettings(nextProject, setName, setResolutions, setExtraUrls);
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

    const dirty = settingsChanged(project, name, resolutions, extraUrls);

    async function onSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const parsed = readSettings(name, resolutions, extraUrls);

        if (typeof parsed === 'string') {
            setError(parsed);
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const next = await updateProject(project!.urlId, parsed);
            setProject(next);
            fillSettings(next, setName, setResolutions, setExtraUrls);
        } catch (reason) {
            setError(messageFrom(reason));
        } finally {
            setSaving(false);
        }
    }

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

    async function onRemove() {
        setRemoving(true);
        setError(null);

        try {
            await deleteProject(project!.urlId);
            navigate('/');
        } catch (reason) {
            setError(messageFrom(reason));
            setRemoving(false);
        }
    }

    function updateResolution(index: number, patch: Partial<ResolutionDraft>) {
        setResolutions((current) => current.map((item, itemIndex) => (
            itemIndex === index ? { ...item, ...patch } : item
        )));
    }

    return (
        <>
            <p className="crumb"><Link to="/">Projects</Link></p>
            <header className="run-header">
                <div>
                    <h1>{project.name}</h1>
                    <p className="meta"><a href={project.url} target="_blank" rel="noreferrer">{project.url}</a></p>
                </div>
                <button type="button" onClick={onStart} disabled={starting || dirty}>Start run</button>
            </header>
            {dirty ? <p className="meta">Save settings to use them for the next run.</p> : null}
            {error ? <p className="banner" role="alert">{error}</p> : null}
            <section className="panel">
                <h2>Settings</h2>
                <form className="stack-form" onSubmit={onSave}>
                    <div>
                        <label htmlFor="project-name">Name</label>
                        <input
                            id="project-name"
                            type="text"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>
                    <fieldset>
                        <legend>Resolutions</legend>
                        {resolutions.map((resolution, index) => (
                            <div className="resolution-row" key={index}>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    aria-label={`Resolution ${index + 1} width`}
                                    value={resolution.width}
                                    onChange={(event) => updateResolution(index, { width: event.target.value })}
                                />
                                <span>×</span>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    aria-label={`Resolution ${index + 1} height`}
                                    value={resolution.height}
                                    onChange={(event) => updateResolution(index, { height: event.target.value })}
                                />
                                <button
                                    type="button"
                                    className="quiet"
                                    disabled={resolutions.length === 1}
                                    onClick={() => setResolutions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="quiet"
                            disabled={resolutions.length >= 8}
                            onClick={() => setResolutions((current) => [...current, { width: '390', height: '844' }])}
                        >
                            Add resolution
                        </button>
                    </fieldset>
                    <fieldset>
                        <legend>Extra URLs</legend>
                        <p className="meta">These pages are screenshotted in addition to the crawled site.</p>
                        {extraUrls.map((value, index) => (
                            <div className="url-row" key={index}>
                                <input
                                    type="url"
                                    aria-label={`Extra URL ${index + 1}`}
                                    placeholder="https://example.com/page"
                                    value={value}
                                    onChange={(event) => setExtraUrls((current) => current.map((item, itemIndex) => (
                                        itemIndex === index ? event.target.value : item
                                    )))}
                                />
                                <button
                                    type="button"
                                    className="quiet"
                                    onClick={() => setExtraUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="quiet"
                            disabled={extraUrls.length >= 100}
                            onClick={() => setExtraUrls((current) => [...current, ''])}
                        >
                            Add URL
                        </button>
                    </fieldset>
                    <div className="inline-actions">
                        <button type="submit" disabled={saving || !dirty}>Save settings</button>
                        {confirmingRemove ? (
                            <>
                                <button type="button" className="danger" disabled={removing} onClick={onRemove}>
                                    Remove project and runs
                                </button>
                                <button type="button" className="quiet" onClick={() => setConfirmingRemove(false)}>Cancel</button>
                            </>
                        ) : (
                            <button type="button" className="quiet" onClick={() => setConfirmingRemove(true)}>Remove project</button>
                        )}
                    </div>
                </form>
            </section>
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

function fillSettings(
    project: Project,
    setName: (name: string) => void,
    setResolutions: (resolutions: ResolutionDraft[]) => void,
    setExtraUrls: (urls: string[]) => void,
): void {
    setName(project.name);
    setResolutions(project.resolutions.map((resolution) => ({
        width: String(resolution.width),
        height: String(resolution.height),
    })));
    setExtraUrls(project.extraUrls);
}

function readSettings(
    name: string,
    resolutions: ResolutionDraft[],
    extraUrls: string[],
): { name: string; resolutions: Resolution[]; extraUrls: string[] } | string {
    const trimmedName = name.trim();

    if (!trimmedName) {
        return 'Enter a project name.';
    }

    if (resolutions.length === 0) {
        return 'Choose at least one resolution.';
    }

    const parsedResolutions: Resolution[] = [];
    const seen = new Set<string>();

    for (const resolution of resolutions) {
        const width = Number(resolution.width);
        const height = Number(resolution.height);

        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192) {
            return 'Resolution width and height must be whole numbers from 1 to 8192.';
        }

        const key = `${width}x${height}`;

        if (seen.has(key)) {
            return 'Each resolution can only be listed once.';
        }

        seen.add(key);
        parsedResolutions.push({ width, height });
    }

    const parsedUrls: string[] = [];
    const seenUrls = new Set<string>();

    for (const value of extraUrls) {
        const trimmed = value.trim();

        if (!trimmed) {
            continue;
        }

        let parsed: URL;

        try {
            parsed = new URL(trimmed);
        } catch {
            return 'Each extra URL must be an HTTP or HTTPS URL.';
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return 'Each extra URL must be an HTTP or HTTPS URL.';
        }

        parsed.hash = '';

        if (seenUrls.has(parsed.href)) {
            continue;
        }

        seenUrls.add(parsed.href);
        parsedUrls.push(parsed.href);
    }

    return {
        name: trimmedName,
        resolutions: parsedResolutions,
        extraUrls: parsedUrls,
    };
}

function settingsChanged(
    project: Project,
    name: string,
    resolutions: ResolutionDraft[],
    extraUrls: string[],
): boolean {
    const parsed = readSettings(name, resolutions, extraUrls);

    if (typeof parsed === 'string') {
        return true;
    }

    return parsed.name !== project.name
        || parsed.extraUrls.join('\n') !== project.extraUrls.join('\n')
        || parsed.resolutions.length !== project.resolutions.length
        || parsed.resolutions.some((resolution, index) => (
            resolution.width !== project.resolutions[index]?.width
            || resolution.height !== project.resolutions[index]?.height
        ));
}

function messageFrom(reason: unknown): string {
    if (reason instanceof ApiError || reason instanceof Error) {
        return reason.message;
    }

    return 'The request could not be completed.';
}
