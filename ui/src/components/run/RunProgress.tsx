import { Anchor, Image, List, Paper, Progress, Stack, Text, Title } from '@mantine/core';
import { formatResolution, imagePath, isActive } from '../../format';
import type { Capture, Run } from '../../types';

export function RunProgress({ run, latest }: { run: Run; latest: Capture | null }) {
    const captures = run.captures ?? [];

    if (!isActive(run.status) || (run.activity?.step === 'scraping' && captures.length === 0)) {
        return null;
    }

    const total = run.activity?.total ?? 0;
    const done = run.activity?.done ?? captures.length;
    const preview = latest?.status === 'captured'
        ? latest
        : [...captures].reverse().find((capture) => capture.status === 'captured');

    return (
        <Stack gap="sm">
            <Title order={2}>Screenshots</Title>
            {run.activity?.step === 'capturing' && total > 0 ? (
                <Progress value={Math.min(100, (done / total) * 100)} animated />
            ) : null}
            {preview ? (
                <Paper withBorder p="sm">
                    <Text size="sm" mb="xs">
                        <Anchor href={preview.url} target="_blank" rel="noreferrer">{preview.url}</Anchor>
                        {' · '}
                        {formatResolution(preview.resolution)}
                    </Text>
                    <Image
                        src={imagePath(run.id, preview.urlId, 'images', preview.resolution)}
                        alt={`Latest capture of ${preview.url}`}
                        mah={360}
                        fit="contain"
                        radius="sm"
                    />
                </Paper>
            ) : null}
            {captures.length > 0 ? (
                <List spacing="xs">
                    {[...captures].reverse().map((capture) => (
                        <List.Item key={`${capture.urlId}-${capture.resolution.width}x${capture.resolution.height}`}>
                            <Anchor href={capture.url} target="_blank" rel="noreferrer">{capture.url}</Anchor>
                            {' · '}
                            {formatResolution(capture.resolution)}
                            {' · '}
                            <Text span c={capture.status === 'failed' ? 'red' : 'dimmed'}>
                                {capture.status === 'captured' ? 'Captured' : capture.message || 'Failed'}
                            </Text>
                        </List.Item>
                    ))}
                </List>
            ) : null}
        </Stack>
    );
}
