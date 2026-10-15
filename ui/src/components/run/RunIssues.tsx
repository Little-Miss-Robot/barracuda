import { Anchor, List, Paper, Stack, Text, Title } from '@mantine/core';
import type { Run } from '../../types';

export function ScrapeFailures({ run }: { run: Run }) {
    if (run.failures.length === 0) {
        return null;
    }

    return (
        <Stack gap="sm">
            <Title order={2}>Scrape failures</Title>
            {run.failures.map((failure) => (
                <Paper key={failure.url} withBorder p="sm">
                    <Anchor href={failure.url} target="_blank" rel="noreferrer">
                        {failure.url}
                    </Anchor>
                    <Text size="sm">{failure.message}</Text>
                </Paper>
            ))}
        </Stack>
    );
}

export function PendingUrls({ run }: { run: Run }) {
    if (run.pending.length === 0) {
        return null;
    }

    return (
        <Stack gap="sm">
            <Title order={2}>Pending URLs</Title>
            <Text c="dimmed">These pages were discovered after the crawl reached its page limit.</Text>
            <List>
                {run.pending.map((url) => (
                    <List.Item key={url}>
                        <Anchor href={url} target="_blank" rel="noreferrer">{url}</Anchor>
                    </List.Item>
                ))}
            </List>
        </Stack>
    );
}
