import { NavLink } from '@mantine/core';
import { HouseIcon, TerminalWindowIcon } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';

export function AppNavbar() {
    const { pathname } = useLocation();

    return (
        <>
            <NavLink
                component={Link}
                to="/"
                label="Projects"
                leftSection={<HouseIcon size={16} />}
                active={pathname === '/' || pathname.startsWith('/projects')}
            />
            <NavLink
                component={Link}
                to="/runs"
                label="Runs"
                leftSection={<TerminalWindowIcon size={16} />}
                active={pathname.startsWith('/runs')}
            />
        </>
    );
}
