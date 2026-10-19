import {Route, Routes} from 'react-router-dom';
import {AppShell} from '@mantine/core';
import { AppNavbar } from './components/shell/AppNavbar';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProjectPage } from './pages/ProjectPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { RunPage } from './pages/RunPage';
import { RunOverviewPage } from './pages/RunOverviewPage';
import classes from './App.module.css';
import {DashboardPage} from "./pages/DashboardPage";
import {LogsPage} from "./pages/LogsPage";

export function App() {
    return (
        <AppShell
            padding="xl"
            withBorder={false}
            navbar={{
                width: 62,
                breakpoint: 'sm',
            }}
        >
            <AppShell.Navbar p="xs">
                <AppNavbar />
            </AppShell.Navbar>
            <AppShell.Main className={classes.main}>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectOverviewPage />} />
                    <Route path="/projects/:urlId" element={<ProjectPage />} />
                    <Route path="/projects/:urlId/settings" element={<ProjectSettingsPage />} />
                    <Route path="/runs" element={<RunOverviewPage />} />
                    <Route path="/logs" element={<LogsPage />} />
                    <Route path="/runs/:runId" element={<RunPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AppShell.Main>
        </AppShell>
    );
}
