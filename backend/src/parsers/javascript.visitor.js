export const extractCodeInformation = (tree) => {
    const symbols = [];
    const imports = [];

    function getNodeMetadata(node) {
        return {
            startLine: node.startPosition.row + 1,
            startColumn: node.startPosition.column,

            endLine: node.endPosition.row + 1,
            endColumn: node.endPosition.column,

            signature: node.text.split("{")[0].trim(),
        };
    }

    function findExistingSymbol(name, kind) {
        return symbols.find(
            (symbol) =>
                symbol.name === name &&
                symbol.kind === kind
        );
    }

    function addSymbol({
        name,
        kind,
        exported = false,
        ...metadata
    }) {

        if (!name) return;

        const existing = findExistingSymbol(name, kind);

        if (existing) {
            if (exported) {
                existing.exported = true;
            }
            return;
        }

        symbols.push({
            name,
            kind,
            exported,
            ...metadata,
        });
    }

    function visit(node) {

        // ====================================================
        // Function Declaration
        // ====================================================

        if (node.type === "function_declaration") {

            const name = node.childForFieldName("name");

            addSymbol({
                name: name?.text,
                kind: "FUNCTION",
                ...getNodeMetadata(node),
            });

        }

        // ====================================================
        // Class Declaration
        // ====================================================

        if (node.type === "class_declaration") {

            const name = node.childForFieldName("name");

            addSymbol({
                name: name?.text,
                kind: "CLASS",
                ...getNodeMetadata(node),
            });

        }

        // ====================================================
        // Arrow Functions
        // const login = () => {}
        // ====================================================

        if (node.type === "lexical_declaration") {

            for (const child of node.namedChildren) {

                if (child.type !== "variable_declarator") continue;

                const identifier = child.childForFieldName("name");
                const value = child.childForFieldName("value");

                if (
                    value &&
                    (
                        value.type === "arrow_function" ||
                        value.type === "function"
                    )
                ) {

                    addSymbol({
                        name: identifier?.text,
                        kind: "FUNCTION",
                        ...getNodeMetadata(value),
                    });

                }

            }

        }

        // ====================================================
        // Function Expressions
        // var login = function(){}
        // ====================================================

        if (node.type === "variable_declaration") {

            for (const child of node.namedChildren) {

                if (child.type !== "variable_declarator") continue;

                const identifier = child.childForFieldName("name");
                const value = child.childForFieldName("value");

                if (
                    value &&
                    value.type === "function"
                ) {

                    addSymbol({
                        name: identifier?.text,
                        kind: "FUNCTION",
                        ...getNodeMetadata(value),
                    });

                }

            }

        }

        // ====================================================
        // Class Methods
        // ====================================================

        if (node.type === "method_definition") {

            const name = node.childForFieldName("name");

            addSymbol({
                name: name?.text,
                kind: "METHOD",
                ...getNodeMetadata(node),
            });

        }

        // ====================================================
        // Imports
        // ====================================================

        if (node.type === "import_statement") {

            const source = node.childForFieldName("source");

            if (source) {

                const value = source.text.replace(/['"]/g, "");

                imports.push({
                    source: value,
                    type: value.startsWith(".")
                        ? "INTERNAL"
                        : "EXTERNAL",
                });

            }

        }

        // ====================================================
        // Exports
        // ====================================================

        if (node.type === "export_statement") {

            const declaration = node.namedChildren[0];

            if (!declaration) {
                for (const child of node.namedChildren) {
                    visit(child);
                }
                return;
            }

            if (declaration.type === "function_declaration") {

                const name = declaration.childForFieldName("name");

                addSymbol({
                    name: name?.text,
                    kind: "FUNCTION",
                    exported: true,
                    ...getNodeMetadata(declaration),
                });

            }

            else if (declaration.type === "class_declaration") {

                const name = declaration.childForFieldName("name");

                addSymbol({
                    name: name?.text,
                    kind: "CLASS",
                    exported: true,
                    ...getNodeMetadata(declaration),
                });

            }

        }

        for (const child of node.namedChildren) {
            visit(child);
        }

    }

    visit(tree.rootNode);

    return {
        symbols,
        imports,
    };
};