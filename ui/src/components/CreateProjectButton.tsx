import { useDisclosure } from '@mantine/hooks';
import { Modal, Button } from '@mantine/core';
import {CreateProjectForm} from "./CreateProjectForm";

export default function CreateProjectButton() {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Modal opened={opened} onClose={close} title="Create project">
                <CreateProjectForm />
            </Modal>

            <Button variant="default" onClick={open}>
                Create project
            </Button>
        </>
    );
}