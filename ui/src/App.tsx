import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { RunPage } from './pages/RunPage';

export function App() {
    return (
        <>
            <header className="site">
                <Link className="brand" to="/">Barracuda</Link>
                <p>Visual regression</p>
            </header>
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/runs/:runId" element={<RunPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </>
    );
}

function NotFound() {
    return (
        <>
            <p className="crumb"><Link to="/">All runs</Link></p>
            <h1>Not found</h1>
            <p className="lede">That page does not exist.</p>
        </>
    );
}
