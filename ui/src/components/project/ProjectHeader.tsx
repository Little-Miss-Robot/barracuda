import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { changeCount, formatChangeCount, formatResolution, formatTime } from '../../format';
import type { ListedRun, Project } from '../../types';
import { BaselineBadge } from '../entities/BaselineBadge';
import { RunStatusBadge } from '../entities/RunStatusBadge';

type Props = {
    project: Project;
    latest?: ListedRun;
    starting: boolean;
    onStart: () => void;
};

export function ProjectHeader({ project, latest, starting, onStart }: Props) {
    const latestChanges = latest ? changeCount(latest.run) : null;

    return (
        <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
                <Title order={1}>{project.name}</Title>
                <Anchor href={project.url} target="_blank" rel="noreferrer">
                    {project.url}
                </Anchor>
                <Text size="sm" c="dimmed">
                    Resolutions: {project.resolutions.map(formatResolution).join(', ')}
                </Text>
                <Text size="sm" c="dimmed" component="div">
                    {latest ? (
                        <Group gap="xs">
                            <Text span size="sm" c="dimmed">
                                Latest run{' '}
                                <Anchor component={Link} to={`/runs/${latest.run.id}`}>
                                    {formatTime(latest.run.createdAt)}
                                </Anchor>
                            </Text>
                            <RunStatusBadge run={latest.run} />
                            {latest.approved ? <BaselineBadge /> : null}
                            {latestChanges === null ? null : (
                                <Text span size="sm" c="dimmed">{formatChangeCount(latestChanges)}</Text>
                            )}
                        </Group>
                    ) : 'No runs yet'}
                </Text>
            </Stack>
            <Group>
                <Button onClick={onStart} loading={starting}>Start run</Button>
                <Button component={Link} to={`/projects/${project.urlId}/settings`} variant="default">
                    Settings
                </Button>
            </Group>
        </Group>
    );
}
