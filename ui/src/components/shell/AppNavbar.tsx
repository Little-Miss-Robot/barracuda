import {ActionIcon, Divider, Stack} from '@mantine/core';
import {
    FishSimpleIcon,
    GridFourIcon,
    TerminalWindowIcon
} from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';

export function AppNavbar() {
    const { pathname } = useLocation();

    return (
        <Stack>
            <Stack gap="xs">
                <ActionIcon
                    variant="subtle"
                    aria-label="Barracuda"
                    component={Link}
                    to="/"
                    size="xl"
                >
                    <FishSimpleIcon size={24} />
                </ActionIcon>
                <Divider />
                <ActionIcon
                    variant={pathname === '/' || pathname.startsWith('/projects') ? 'filled' : 'subtle'}
                    aria-label="Projects"
                    component={Link}
                    to="/"
                    size="xl"
                >
                    <GridFourIcon size={24} />
                </ActionIcon>
                <ActionIcon
                    variant={pathname.startsWith('/runs') ? 'filled' : 'subtle'}
                    aria-label="Runs"
                    component={Link}
                    to="/runs"
                    size="xl"
                >
                    <TerminalWindowIcon size={24} />
                </ActionIcon>
            </Stack>
        </Stack>
    );
}
