import { useEffect } from 'react';
import { MissingResource } from '../components/Status';

export function NotFoundPage() {
    useEffect(() => {
        document.title = 'Not found · Barracuda';
    }, []);

    return (
        <MissingResource
            title="Not found"
            message="That page does not exist."
        />
    );
}
