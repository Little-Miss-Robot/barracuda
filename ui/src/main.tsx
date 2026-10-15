import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import '@mantine/core/styles.css';

import {createTheme, MantineProvider} from '@mantine/core';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Root element is missing.');
}

const theme = createTheme({
    primaryColor: 'gray',
    colors: {
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
    }
});

createRoot(root).render(
    <StrictMode>
        <BrowserRouter>
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <App />
            </MantineProvider>
        </BrowserRouter>
    </StrictMode>,
);
