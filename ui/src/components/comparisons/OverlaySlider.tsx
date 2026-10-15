import { Box, Group, Image, Slider, Stack, Text } from '@mantine/core';
import { useState } from 'react';

type Props = {
    baseline: string;
    current: string;
};

export function OverlaySlider({ baseline, current }: Props) {
    const [opacity, setOpacity] = useState(50);

    return (
        <Stack gap="sm">
            <Box pos="relative">
                <Image src={baseline} alt="Baseline screenshot" w="100%" />
                <Image
                    src={current}
                    alt="This run, layered on the baseline"
                    pos="absolute"
                    top={0}
                    left={0}
                    w="100%"
                    style={{ opacity: opacity / 100 }}
                />
            </Box>
            <Stack gap={4}>
                <Slider
                    min={0}
                    max={100}
                    value={opacity}
                    onChange={setOpacity}
                    aria-label="Fade this run over the baseline"
                    label={(value) => `${value}%`}
                />
                <Group justify="space-between">
                    <Text size="xs" c="dimmed">Baseline</Text>
                    <Text size="xs" c="dimmed">This run</Text>
                </Group>
            </Stack>
        </Stack>
    );
}
