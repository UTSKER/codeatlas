const LANGUAGE_MAP = {
    ".js": "javascript",
    ".jsx": "javascript",

    ".ts": "typescript",
    ".tsx": "typescript",

    ".py": "python",

    ".java": "java",

    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",

    ".c": "c",

    ".go": "go",

    ".rs": "rust",

    ".php": "php",

    ".rb": "ruby",

    ".cs": "csharp",

    ".json": "json",

    ".md": "markdown",

    ".yml": "yaml",
    ".yaml": "yaml",
};

export const detectLanguage = (extension) => {
    return LANGUAGE_MAP[extension] || "unknown";
};