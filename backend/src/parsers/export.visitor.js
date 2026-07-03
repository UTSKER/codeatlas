export const extractExports = (tree) => {

    const exports = [];

    function addExport({
        name,
        kind,
        isDefault = false,
    }) {

        if (!name) return;

        exports.push({
            name,
            kind,
            isDefault,
        });

    }

    function visit(node) {

        // ==========================================
        // export function login(){}
        // export class User{}
        // ==========================================

        if (node.type === "export_statement") {

            const declaration = node.namedChildren[0];

            if (!declaration) {
                return;
            }

            // --------------------------------------
            // export function login(){}
            // --------------------------------------

            if (declaration.type === "function_declaration") {

                const name =
                    declaration.childForFieldName("name");

                addExport({
                    name: name?.text,
                    kind: "FUNCTION",
                });

            }

            // --------------------------------------
            // export class User{}
            // --------------------------------------

            if (declaration.type === "class_declaration") {

                const name =
                    declaration.childForFieldName("name");

                addExport({
                    name: name?.text,
                    kind: "CLASS",
                });

            }

            // --------------------------------------
            // export const login = () => {}
            // --------------------------------------

            if (
                declaration.type === "lexical_declaration" ||
                declaration.type === "variable_declaration"
            ) {

                for (const child of declaration.namedChildren) {

                    if (
                        child.type !==
                        "variable_declarator"
                    )
                        continue;

                    const identifier =
                        child.childForFieldName("name");

                    addExport({
                        name: identifier?.text,
                        kind: "FUNCTION",
                    });

                }

            }

        }

        // ==========================================
        // export default login;
        // export default class {}
        // ==========================================

        if (node.type === "export_default_declaration") {

            const declaration =
                node.namedChildren[0];

            if (!declaration)
                return;

            if (
                declaration.type ===
                "identifier"
            ) {

                addExport({
                    name: declaration.text,
                    kind: "UNKNOWN",
                    isDefault: true,
                });

            }

            if (
                declaration.type ===
                "class_declaration"
            ) {

                const name =
                    declaration.childForFieldName("name");

                addExport({
                    name:
                        name?.text ??
                        "default",
                    kind: "CLASS",
                    isDefault: true,
                });

            }

            if (
                declaration.type ===
                "function_declaration"
            ) {

                const name =
                    declaration.childForFieldName("name");

                addExport({
                    name:
                        name?.text ??
                        "default",
                    kind: "FUNCTION",
                    isDefault: true,
                });

            }

        }

        for (const child of node.namedChildren) {
            visit(child);
        }

    }

    visit(tree.rootNode);

    return exports;

};