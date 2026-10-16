import { MissingResource } from '../components/Status';
import {useWindowTitle} from "../hooks/useWindowTitle";

export function NotFoundPage() {

    useWindowTitle('Not found');

    return (
        <MissingResource
            title="Not found"
            message="That page does not exist."
        />
    );
}
