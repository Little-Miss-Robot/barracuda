import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { RunPage } from './pages/RunPage';
import Header from "./components/Header";

export function App() {
    return (
        <>
            <Header />
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
