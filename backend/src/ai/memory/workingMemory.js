export class WorkingMemory {
    constructor() {
        this.memory = new Map();
    }

    set(key, value) {
        this.memory.set(key, value);
    }

    get(key) {
        return this.memory.get(key);
    }

    has(key) {
        return this.memory.has(key);
    }

    delete(key) {
        this.memory.delete(key);
    }

    clear() {
        this.memory.clear();
    }

    keys() {
        return [...this.memory.keys()];
    }

    values() {
        return [...this.memory.values()];
    }

    entries() {
        return [...this.memory.entries()];
    }

    merge(object) {
        for (const [key, value] of Object.entries(object)) {
            this.memory.set(key, value);
        }
    }

    snapshot() {
        return Object.fromEntries(this.memory);
    }

    size() {
        return this.memory.size;
    }

    isEmpty() {
        return this.memory.size === 0;
    }

    summary() {
        return [...this.memory.entries()].map(([key, value]) => ({
            key,
            type: Array.isArray(value)
                ? "array"
                : typeof value,
            size: Array.isArray(value)
                ? value.length
                : undefined,
        }));
    }
}