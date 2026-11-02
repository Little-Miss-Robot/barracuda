import { ActionIcon, Anchor, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { TrashIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteRun, messageFrom } from '../../api';
import { activityLabel, changeCount, formatTime, isActive } from '../../format';
import type { ListedRun } from '../../types';
import { BaselineBadge } from './BaselineBadge';
import { RunStatusBadge } from './RunStatusBadge';

type Props = {
    runs: ListedRun[];
    empty: string;
    showUrl?: boolean;
    showId?: boolean;
    showDate?: boolean;
};

export function RunsTable({ runs, empty, showUrl = false, showDate = true, showId = true }: Props) {
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    if (runs.length === 0) {
        return <Text c="dimmed">{empty}</Text>;
    }

    function confirmDelete(runId: string) {
        modals.openConfirmModal({
            title: 'Delete run',
            children: (
                <Text size="sm">
                    Delete run {runId}? Its screenshots and comparison images will be removed. Other runs that used it as a baseline will lose their comparison results.
                </Text>
            ),
            labels: { confirm: 'Delete run', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                void remove(runId);
            },
        });
    }

    async function remove(runId: string) {
        setDeletingId(runId);

        try {
            await deleteRun(runId);
            await queryClient.invalidateQueries({ queryKey: ['listedRuns'] });
            await queryClient.invalidateQueries({ queryKey: ['listedRun'] });
        } catch (reason) {
            notifications.show({
                color: 'red',
                title: 'Could not delete run',
                message: messageFrom(reason),
            });
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <Table.ScrollContainer minWidth={860}>
            <Table withRowBorders={true} borderColor="dark.8">
                <Table.Thead>
                    <Table.Tr>
                        {showId ? <Table.Th>ID</Table.Th> : null}
                        {showDate ? <Table.Th>When</Table.Th> : null}
                        {showUrl ? <Table.Th>Project</Table.Th> : null}
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Changes</Table.Th>
                        <Table.Th />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {runs.map((item) => {
                        const changes = changeCount(item.run);
                        const activity = activityLabel(item.run);

                        return (
                            <Table.Tr key={item.run.id}>
                                {showId ? (
                                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Anchor component={Link} to={`/runs/${item.run.id}`}>
                                            {item.run.id}
                                        </Anchor>
                                    </Table.Td>
                                ) : null}
                                {showDate ? (
                                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Anchor component={Link} to={`/runs/${item.run.id}`}>
                                            {formatTime(item.run.createdAt)}
                                        </Anchor>
                                    </Table.Td>
                                ) : null}
                                {showUrl ? (
                                    <Table.Td>
                                        <Anchor component={Link} to={`/projects/${item.run.urlId}`} lineClamp={1} maw={360}>
                                            {item.run.url}
                                        </Anchor>
                                    </Table.Td>
                                ) : null}
                                <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                    <Stack gap={4}>
                                        <Group gap="xs" wrap="nowrap">
                                            <RunStatusBadge run={item.run} />
                                            {item.approved ? <BaselineBadge /> : null}
                                        </Group>
                                        {activity ? (
                                            <Text size="xs" c="dimmed">{activity}</Text>
                                        ) : null}
                                    </Stack>
                                </Table.Td>
                                <Table.Td>{changes === null ? '—' : changes}</Table.Td>
                                <Table.Td style={{ width: 1 }}>
                                    {item.approved || isActive(item.run.status) ? null : (
                                        <Tooltip label="Delete run">
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                aria-label={`Delete run ${item.run.id}`}
                                                loading={deletingId === item.run.id}
                                                onClick={() => confirmDelete(item.run.id)}
                                            >
                                                <TrashIcon size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
}
