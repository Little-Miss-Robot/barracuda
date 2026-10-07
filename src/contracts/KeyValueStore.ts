export interface KeyValueStore<Value = unknown> {
    get: (key: string) => Promise<Value | undefined>;
    set: (key: string, value: Value) => Promise<void>;
    delete: (key: string) => Promise<void>;
    has: (key: string) => Promise<boolean>;
    keys: () => Promise<string[]>;
}