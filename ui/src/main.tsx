import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {QueryClient, QueryClientProvider,} from '@tanstack/react-query';
import { App } from './App';
import '@mantine/core/styles.css';

import {Anchor, Card, createTheme, MantineProvider} from '@mantine/core';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Root element is missing.');
}

const theme = createTheme({
    primaryColor: 'primary',
    primaryShade: 9,
    defaultRadius: 'md',
    colors: {
        primary: [
            "#f1f0ff",
            "#dfdef4",
            "#bcbae2",
            "#9794d0",
            "#7773c0",
            "#635fb7",
            "#5954b4",
            "#49459f",
            "#403d8f",
            "#36347f"
        ],
        dark: [
            '#d6d6d6',
            '#b3b3b3',
            '#929292',
            '#6b6b6b',
            '#505050',
            '#383838',
            '#2b2b2b',
            '#202020',
            '#171717',
            '#000000',
        ],
    },
    components: {
        Card: Card.extend({
            styles: {
                root: {
                    backgroundColor:
                        'light-dark(var(--mantine-color-white), var(--mantine-color-dark-8))',
                },
            },
        }),
        Anchor: Anchor.extend({
            styles: {
                root: {
                    color:
                        'light-dark(var(--mantine-color-black), var(--mantine-color-white))',
                },
            },
        }),
    }
});

const queryClient = new QueryClient()

createRoot(root).render(
    <QueryClientProvider client={queryClient}>
        <StrictMode>
            <BrowserRouter>
                <MantineProvider theme={theme} defaultColorScheme="auto">
                    <App />
                </MantineProvider>
            </BrowserRouter>
        </StrictMode>
    </QueryClientProvider>,
);
