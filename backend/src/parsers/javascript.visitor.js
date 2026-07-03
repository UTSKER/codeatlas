export const extractCodeInformation = (tree) => {

    const symbols = [];
    const imports = [];

    function addSymbol({
        name,
        kind,
        line,
        column,
        exported = false,
        signature = null,
    }) {

        if (!name) return;

        symbols.push({
            name,
            kind,
            line,
            column,
            exported,
            signature,
        });
    }

    function visit(node) {

        // ====================================================
        // Function Declaration
        // function login(){}
        // ====================================================

        if (node.type === "function_declaration") {

            const name = node.childForFieldName("name");

            addSymbol({
                name: name?.text,
                kind: "FUNCTION",
                line: node.startPosition.row + 1,
                column: node.startPosition.column,
            });
        }

        // ====================================================
        // Class Declaration
        // class User {}
        // ====================================================

        if (node.type === "class_declaration") {

            const name = node.childForFieldName("name");

            addSymbol({
                name: name?.text,
                kind: "CLASS",
                line: node.startPosition.row + 1,
                column: node.startPosition.column,
            });
        }

        // ====================================================
        // Arrow Functions
        //
        // const login = () => {}
        // const login = async () => {}
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
                        line: value.startPosition.row + 1,
                        column: value.startPosition.column,
                    });

                }

            }

        }

        // ====================================================
        // Function Expressions
        //
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
                        line: value.startPosition.row + 1,
                        column: value.startPosition.column,
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
                line: node.startPosition.row + 1,
                column: node.startPosition.column,
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

            if (declaration?.type === "function_declaration") {

                const name = declaration.childForFieldName("name");

                addSymbol({
                    name: name?.text,
                    kind: "FUNCTION",
                    line: declaration.startPosition.row + 1,
                    column: declaration.startPosition.column,
                    exported: true,
                });

            }

            if (declaration?.type === "class_declaration") {

                const name = declaration.childForFieldName("name");

                addSymbol({
                    name: name?.text,
                    kind: "CLASS",
                    line: declaration.startPosition.row + 1,
                    column: declaration.startPosition.column,
                    exported: true,
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