import { Grid, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { listProjects, listRuns, messageFrom } from '../api';
import { CreateProjectForm } from '../components/CreateProjectForm';
import { ProjectCard } from '../components/entities/ProjectCard';
import { ErrorAlert } from '../components/Status';
import type { ListedRun, Project } from '../types';
import { useLiveRuns } from '../useLiveRuns';

export function HomePage() {
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Projects · Barracuda';
    }, []);

    useLiveRuns(runs, setRuns);

    useEffect(() => {
        let cancelled = false;

        Promise.all([listProjects(), listRuns()])
            .then(([nextProjects, nextRuns]) => {
                if (cancelled) {
                    return;
                }

                setProjects(nextProjects);
                setRuns(nextRuns);
                setError(null);
            })
            .catch((reason: unknown) => {
                if (!cancelled) {
                    setError(messageFrom(reason));
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Stack gap="lg">
            <Stack gap="xs">
                <Title order={1}>Projects</Title>
            </Stack>
            <ErrorAlert message={projects === null ? error : null} />
            <CreateProjectForm />
            {projects === null && !error ? <Text c="dimmed">Loading projects…</Text> : null}
            {projects?.length === 0 ? <Text c="dimmed">No projects yet. Add a URL to create one.</Text> : null}
            {projects && projects.length > 0 ? (
                <Grid>
                    {projects.map((project) => {
                        const latest = (runs ?? []).find((item) => item.run.urlId === project.urlId);

                        return (
                            <Grid.Col key={project.urlId} span={{ base: 12, sm: 6, lg: 4 }}>
                                <ProjectCard project={project} latestRun={latest} />
                            </Grid.Col>
                        );
                    })}
                </Grid>
            ) : null}
            {projects && error ? <ErrorAlert message={error} /> : null}
        </Stack>
    );
}
