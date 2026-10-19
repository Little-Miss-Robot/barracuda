import {useWindowTitle} from "../hooks/useWindowTitle";
import Module from "../components/Module";

export function NotFoundPage() {

    useWindowTitle('Not found');

    return (
        <Module title="Not found">
            That page does not exist.
        </Module>
    );
}
