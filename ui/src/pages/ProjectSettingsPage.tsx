import { Anchor } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, deleteProject, getProject, messageFrom, updateProject } from '../api';
import { ProjectSettingsForm, type ProjectSettingsInput } from '../components/ProjectSettingsForm';
import { ErrorAlert, LoadingState, MissingResource } from '../components/Status';
import type { Project } from '../types';
import Module from "../components/Module";

export function ProjectSettingsPage() {
    const { urlId = '' } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [missing, setMissing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        setProject(null);
        setMissing(false);
        setError(null);

        getProject(urlId)
            .then((nextProject) => {
                if (!cancelled) {
                    setProject(nextProject);
                }
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

    useEffect(() => {
        document.title = `${project ? `Settings · ${project.name}` : (missing ? 'Not found' : 'Settings')} · Barracuda`;
    }, [project, missing]);

    if (missing) {
        return (
            <MissingResource
                title="Not found"
                message="That project could not be found."
            />
        );
    }

    if (!project) {
        return error
            ? <ErrorAlert message={error} />
            : <LoadingState label="Loading settings…" />;
    }

    async function onSave(input: ProjectSettingsInput) {
        setSaving(true);
        setError(null);

        try {
            setProject(await updateProject(project!.urlId, input));
        } catch (reason) {
            setError(messageFrom(reason));
        } finally {
            setSaving(false);
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

    return (
        <>
            <Module
                title="Settings"
                crumbs={[
                    { label: 'Dashboard', to: '/' },
                    { label: 'Projects', to: '/projects' },
                    { label: project.name, to: `/projects/${project.urlId}` },
                    { label: 'Settings' },
                ]}
            >
                <Anchor href={project.url} target="_blank" rel="noreferrer">{project.url}</Anchor>
                <ProjectSettingsForm
                    project={project}
                    saving={saving}
                    removing={removing}
                    error={error}
                    onSave={onSave}
                    onRemove={onRemove}
                />
            </Module>
        </>
    );
}
