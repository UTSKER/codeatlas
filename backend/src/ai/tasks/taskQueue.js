export class TaskQueue {
    constructor() {
        this.queue = [];
    }

    add(task) {
        this.queue.push(task);
        this.sort();
    }

    addMany(tasks) {
        for (const task of tasks) {
            this.queue.push(task);
        }

        this.sort();
    }

    sort() {
        this.queue.sort((a, b) => a.priority - b.priority);
    }

    next() {
        return this.queue.find(task => task.isPending()) ?? null;
    }

    hasPending() {
        return this.queue.some(task => task.isPending());
    }

    hasRunning() {
        return this.queue.some(task => task.isRunning());
    }

    hasFailed() {
        return this.queue.some(task => task.isFailed());
    }

    completed() {
        return this.queue.filter(task => task.isCompleted());
    }

    pending() {
        return this.queue.filter(task => task.isPending());
    }

    failed() {
        return this.queue.filter(task => task.isFailed());
    }

    running() {
        return this.queue.filter(task => task.isRunning());
    }

    clearCompleted() {
        this.queue = this.queue.filter(
            task => !task.isCompleted()
        );
    }

    remove(taskId) {
        this.queue = this.queue.filter(
            task => task.id !== taskId
        );
    }

    size() {
        return this.queue.length;
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    snapshot() {
        return this.queue.map(task => task.snapshot());
    }
}