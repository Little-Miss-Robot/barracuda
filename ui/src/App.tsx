import { useEffect } from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import {AppShell} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AppHeader } from './components/shell/AppHeader';
import { AppNavbar } from './components/shell/AppNavbar';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProjectPage } from './pages/ProjectPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { RunPage } from './pages/RunPage';
import { RunsPage } from './pages/RunsPage';
import classes from './App.module.css';

export function App() {
    const [opened, { toggle, close }] = useDisclosure();
    const { pathname } = useLocation();

    useEffect(() => {
        close();
    }, [pathname, close]);

    return (
        <AppShell
            padding="xl"
            navbar={{
                width: 240,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
        >
            <AppHeader opened={opened} onToggle={toggle} />
            <AppShell.Navbar p="xs" m="xs" withBorder={false}>
                <AppNavbar />
            </AppShell.Navbar>
            <AppShell.Main className={classes.main}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/projects/:urlId" element={<ProjectPage />} />
                    <Route path="/projects/:urlId/settings" element={<ProjectSettingsPage />} />
                    <Route path="/runs" element={<RunsPage />} />
                    <Route path="/runs/:runId" element={<RunPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AppShell.Main>
        </AppShell>
    );
}
