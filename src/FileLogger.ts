import {Filesystem, Logger, LogLevel} from "@littlemissrobot/highfive";

export default class FileLogger implements Logger {

    private filesystem: Filesystem;

    private writeQueue: Promise<void> = Promise.resolve();

    constructor(filesystem: Filesystem) {
        this.filesystem = filesystem;
    }

    private appendLine(message: string): void {
        this.writeQueue = this.writeQueue
            .then(async () => {
                const path = 'log.txt';
                let content = '';

                if (await this.filesystem.exists(path)) {
                    const contents = await this.filesystem.read(path);
                    content = new TextDecoder().decode(contents);
                }

                await this.filesystem.write(
                    path,
                    new TextEncoder().encode(
                        content ? `${content}\n${message}` : message,
                    ),
                );
            })
            .catch((error) => {
                console.error('Failed to write log:', error);
            });
    }

    public error(message: string): void {
        this.appendLine(`[ERROR] ${message}`);
    }

    public info(message: string): void {
        this.appendLine(`[INFO] ${message}`);
    }

    public warning(message: string): void {
        this.appendLine(`[WARN] ${message}`);
    }

    public log(level: LogLevel, message: string): void {
        if (level === LogLevel.INFO) {
            this.info(message);
        }
        if (level === LogLevel.ERROR) {
            this.error(message);
        }
        if (level === LogLevel.WARNING) {
            this.warning(message);
        }
    }
}