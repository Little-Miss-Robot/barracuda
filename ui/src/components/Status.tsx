import { Alert, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { Crumbs } from './Crumbs';

export function ErrorAlert({ message }: { message: string | null }) {
    if (!message) {
        return null;
    }

    return (
        <Alert color="red" role="alert">
            {message}
        </Alert>
    );
}

export function LoadingState({ label }: { label: string }) {
    return (
        <Group gap="sm">
            <Loader size="sm" />
            <Text c="dimmed">{label}</Text>
        </Group>
    );
}

export function MissingResource({ title, message }: { title: string; message: string }) {
    return (
        <Stack gap="sm">
            <Crumbs items={[{ label: 'Projects', to: '/' }]} />
            <Title order={1}>{title}</Title>
            <Text c="dimmed">{message}</Text>
        </Stack>
    );
}
