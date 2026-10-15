import { Button, Group, Stack, TextInput } from '@mantine/core';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, messageFrom } from '../api';
import { ErrorAlert } from './Status';

export function CreateProjectForm() {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const created = await createProject({
                url,
                ...(name.trim() ? { name: name.trim() } : {}),
            });
            navigate(`/projects/${created.urlId}`);
        } catch (reason) {
            setError(messageFrom(reason));
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack gap="sm">
                <Group align="flex-end" wrap="wrap">
                    <TextInput
                        label="URL"
                        type="url"
                        required
                        placeholder="https://example.com"
                        value={url}
                        onChange={(event) => setUrl(event.currentTarget.value)}
                        flex="1 1 280px"
                    />
                    <TextInput
                        label="Name"
                        placeholder="Name"
                        value={name}
                        onChange={(event) => setName(event.currentTarget.value)}
                        flex="1 1 180px"
                    />
                    <Button type="submit" loading={submitting}>
                        Add project
                    </Button>
                </Group>
                <ErrorAlert message={error} />
            </Stack>
        </form>
    );
}
