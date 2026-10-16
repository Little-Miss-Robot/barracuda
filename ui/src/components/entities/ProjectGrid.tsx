import {Grid, Text} from '@mantine/core';
import {Project} from "../../../../src/entities/Project";
import {ProjectCard} from "./ProjectCard";
import {ListedRun} from "../../../../src/entities/ListedRun";

type Props = {
    projects: Project[],
    runs: ListedRun[],
};

export default function ProjectGrid({ projects, runs }: Props) {
    return (
        <>
            {projects === null ? <Text c="dimmed">Loading projects…</Text> : null}
            {projects?.length === 0 ? <Text c="dimmed">No projects yet. Add a URL to create one.</Text> : null}
            {projects && projects.length > 0 ? (
                <Grid>
                    {projects.map((project) => {
                        const latest = (runs ?? []).find((item) => item.run.urlId === project.urlId);

                        return (
                            <Grid.Col key={project.urlId} span={{ base: 12, sm: 6, lg: 3 }}>
                                <ProjectCard project={project} latestRun={latest} />
                            </Grid.Col>
                        );
                    })}
                </Grid>
            ) : null}
        </>
    )
}
