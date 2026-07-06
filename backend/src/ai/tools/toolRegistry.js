class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }

    register(tool) {
        if (!tool.name) {
            throw new Error("Tool name is required.");
        }

        if (typeof tool.execute !== "function") {
            throw new Error(
                `Tool '${tool.name}' must expose execute(args).`
            );
        }

        if (this.tools.has(tool.name)) {
            throw new Error(
                `Tool '${tool.name}' is already registered.`
            );
        }

        this.tools.set(tool.name, tool);
    }

    get(name) {
        const tool = this.tools.get(name);

        if (!tool) {
            throw new Error(`Unknown tool '${name}'.`);
        }

        return tool;
    }

    has(name) {
        return this.tools.has(name);
    }

    list() {
        return [...this.tools.values()];
    }

    describe() {
        return this.list().map(tool => ({
            name: tool.name,
            description: tool.description,
            input: tool.input,
            output: tool.output,
        }));
    }
}

export const toolRegistry = new ToolRegistry();
