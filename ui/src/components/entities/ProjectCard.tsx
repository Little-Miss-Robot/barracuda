import { Anchor, Button, Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { changeCount, formatChangeCount, formatResolution, formatTime } from '../../format';
import type { ListedRun, Project } from '../../types';
import { BaselineBadge } from './BaselineBadge';
import { RunStatusBadge } from './RunStatusBadge';

type Props = {
    project: Project;
    latestRun?: ListedRun;
};

export function ProjectCard({ project, latestRun }: Props) {
    const changes = latestRun ? changeCount(latestRun.run) : null;

    return (
        <Card shadow="sm" padding="lg" h="100%">
            <Stack gap="sm" h="100%">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Anchor component={Link} to={`/projects/${project.urlId}`} fw={600}>
                        {project.name}
                    </Anchor>
                    {latestRun ? <RunStatusBadge run={latestRun.run} /> : null}
                </Group>
                <Anchor href={project.url} target="_blank" rel="noreferrer" size="sm" c="dimmed" lineClamp={1}>
                    {project.url}
                </Anchor>
                <Text size="sm" c="dimmed">
                    {project.resolutions.map(formatResolution).join(', ')}
                </Text>
                <Text size="sm" component="div">
                    {latestRun ? (
                        <>
                            <Anchor component={Link} to={`/runs/${latestRun.run.id}`}>
                                {formatTime(latestRun.run.createdAt)}
                            </Anchor>
                            {' · '}
                            {changes === null ? 'No comparison yet' : formatChangeCount(changes)}
                        </>
                    ) : 'No runs yet'}
                </Text>
                {latestRun?.approved ? <BaselineBadge /> : null}
                <Group mt="auto" grow>
                    <Button component={Link} to={`/projects/${project.urlId}`}>
                        View
                    </Button>
                    <Button component={Link} to={`/projects/${project.urlId}/settings`} variant="default">
                        Settings
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
