import {ActionIcon, Divider, Stack} from '@mantine/core';
import {
    FishSimpleIcon, GaugeIcon,
    GridFourIcon, NotepadIcon,
    TerminalWindowIcon
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import ModuleNavIcon from "./ModuleNavIcon";

export function AppNavbar() {
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
                <ModuleNavIcon path="/" label="Dashboard">
                    <GaugeIcon size={24} />
                </ModuleNavIcon>
                <ModuleNavIcon path="/projects" label="Projects">
                    <GridFourIcon size={24} />
                </ModuleNavIcon>
                <ModuleNavIcon path="/runs" label="Runs">
                    <TerminalWindowIcon size={24} />
                </ModuleNavIcon>
                <ModuleNavIcon path="/logs" label="Logs">
                    <NotepadIcon size={24} />
                </ModuleNavIcon>
            </Stack>
        </Stack>
    );
}
