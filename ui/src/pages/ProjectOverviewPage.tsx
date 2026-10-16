import { LoadingState } from '../components/Status';
import CreateProjectButton from "../components/CreateProjectButton";
import ProjectGrid from "../components/entities/ProjectGrid";
import {useWindowTitle} from "../hooks/useWindowTitle";
import {useProjects} from "../hooks/queries/useProjects";
import {useListedRuns} from "../hooks/queries/useListedRuns";
import Module from "../components/Module";

export function ProjectOverviewPage() {

    useWindowTitle('Projects');

    const {projects, isLoading: isProjectsLoading} = useProjects();
    const {runs, isLoading: isListedRunsLoading} = useListedRuns();

    return (
        <Module title="Projects" actions={<CreateProjectButton />}>
            {isProjectsLoading || isListedRunsLoading ? (
                <LoadingState label="Loading projects…" />
            ) : (
                <ProjectGrid projects={projects || []} runs={runs || []} />
            )}
        </Module>
    );
}
