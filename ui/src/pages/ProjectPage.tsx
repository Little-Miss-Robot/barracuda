import {ActionIcon, Button, Group, Stack, Title} from '@mantine/core';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { createRun } from '../api';
import { RunsTable } from '../components/entities/RunsTable';
import { ProjectHeader } from '../components/project/ProjectHeader';
import {useWindowTitle} from "../hooks/useWindowTitle";
import Module from "../components/Module";
import {useProject} from "../hooks/queries/useProject";
import {useListedRuns} from "../hooks/queries/useListedRuns";
import {LoadingState} from "../components/Status";
import {GearIcon} from "@phosphor-icons/react";

export function ProjectPage() {
    const { urlId = '' } = useParams();
    const navigate = useNavigate();

    const { project } = useProject(urlId);
    const { runs } = useListedRuns();

    const runsForProject = (project && runs) ? runs.filter(item => item.run.urlId === project?.urlId) : [];

    useWindowTitle(`${project?.name ?? ''}`);

    async function onStart() {
        try {
            const created = await createRun(project!.url);
            navigate(`/runs/${created.run.id}`);
        } catch (reason) {
            //
        }
    }

    return (
        <Module
            title={project?.name ?? ''}
            crumbs={[
                {
                    label: "Dashboard",
                    to: "/"
                },
                {
                    label: "Projects",
                    to: "/projects"
                },
                {
                    label: project?.name || '',
                }
            ]}
            actions={(
                <Group gap="sm">
                    <Button onClick={onStart}>Start run</Button>
                    <ActionIcon component={Link} to={`/projects/${project?.urlId}/settings`} size="lg" variant="subtle">
                        <GearIcon size={24} />
                    </ActionIcon>
                </Group>
            )}
        >
            {(!project || !runsForProject) ? (
                <LoadingState label="Loading project…" />
            ) : (
                <>
                    <ProjectHeader
                        project={project}
                        latest={runsForProject[0]}
                    />
                    <Stack gap="sm">
                        <Title order={2}>Runs</Title>
                        <RunsTable runs={runsForProject} empty="No runs yet. Start one to capture this project." />
                    </Stack>
                </>
            )}
        </Module>
    );
}
