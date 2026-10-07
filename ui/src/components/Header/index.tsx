import {Link} from "react-router-dom";

export default function Index() {
    return (
        <header className="site">
            <Link className="brand" to="/">Barracuda</Link>
            <p>Visual regression testing</p>
        </header>
    );
}