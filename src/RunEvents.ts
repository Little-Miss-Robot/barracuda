import type {Capture} from "./entities/Capture";
import type {ListedRun} from "./entities/ListedRun";

export type RunStreamEvent =
    | { event: 'run'; data: ListedRun }
    | { event: 'screenshot'; data: Capture };

type Listener = (event: RunStreamEvent) => void;

export class RunEvents {
    private listeners = new Map<string, Set<Listener>>();

    public subscribe(runId: string, listener: Listener): () => void {
        const listeners = this.listeners.get(runId) ?? new Set<Listener>();
        listeners.add(listener);
        this.listeners.set(runId, listeners);

        return () => {
            listeners.delete(listener);

            if (listeners.size === 0) {
                this.listeners.delete(runId);
            }
        };
    }

    public publish(runId: string, event: RunStreamEvent): void {
        const listeners = this.listeners.get(runId);

        if (!listeners) {
            return;
        }

        for (const listener of [...listeners]) {
            listener(event);
        }
    }
}
