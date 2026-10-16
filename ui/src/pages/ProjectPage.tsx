import { Stack, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, createRun, getProject, listRuns, messageFrom } from '../api';
import { Crumbs } from '../components/Crumbs';
import { RunsTable } from '../components/entities/RunsTable';
import { ProjectHeader } from '../components/project/ProjectHeader';
import { ErrorAlert, LoadingState, MissingResource } from '../components/Status';
import type { ListedRun, Project } from '../types';
import { useLiveRuns } from '../hooks/useLiveRuns';
import {useWindowTitle} from "../hooks/useWindowTitle";

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

    useLiveRuns(runs, setRuns);
    useWindowTitle(`${project?.name ?? (missing ? 'Not found' : 'Project')}`);

    if (missing) {
        return (
            <MissingResource
                title="Not found"
                message="That project could not be found."
            />
        );
    }

    if (!project || runs === null) {
        return error
            ? <ErrorAlert message={error} />
            : <LoadingState label="Loading project…" />;
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

    return (
        <Stack gap="lg">
            <Crumbs items={[{ label: 'Projects', to: '/' }]} />
            <ProjectHeader
                project={project}
                latest={runs[0]}
                starting={starting}
                onStart={onStart}
            />
            <ErrorAlert message={error} />
            <Stack gap="sm">
                <Title order={2}>Runs</Title>
                <RunsTable runs={runs} empty="No runs yet. Start one to capture this project." />
            </Stack>
        </Stack>
    );
}
