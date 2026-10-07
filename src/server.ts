import container from './container';
import { createApp } from './http/app';

const port = Number(process.env.PORT ?? 3000);

const app = createApp({
    tester: container.make('tester'),
    filesystem: container.make('filesystem'),
});

app.listen(port, () => {
    console.log(`Visual regression UI at http://localhost:${port}`);
});
