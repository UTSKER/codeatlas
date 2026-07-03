export const extractFunctionCalls = (tree) => {

    const calls = [];

    let currentFunction = null;

    function getCallName(node) {

        if (!node) return null;

        // login()
        if (node.type === "identifier") {
            return node.text;
        }

        // jwt.sign()
        // prisma.user.findUnique()
        if (node.type === "member_expression") {
            return node.text;
        }

        return null;
    }

    function visit(node) {

        // ===========================================
        // Track Current Function
        // ===========================================

        if (
            node.type === "function_declaration" ||
            node.type === "method_definition" ||
            node.type === "arrow_function" ||
            node.type === "function"
        ) {

            const previousFunction = currentFunction;

            if (node.type === "method_definition") {

                currentFunction =
                    node.childForFieldName("name")?.text ??
                    "anonymous";

            } else {

                const parent = node.parent;

                if (
                    parent &&
                    parent.type === "variable_declarator"
                ) {

                    currentFunction =
                        parent.childForFieldName("name")?.text ??
                        "anonymous";

                } else {

                    currentFunction =
                        node.childForFieldName("name")?.text ??
                        "anonymous";

                }

            }

            for (const child of node.namedChildren) {
                visit(child);
            }

            currentFunction = previousFunction;

            return;
        }

        // ===========================================
        // Function Call
        // ===========================================

        if (node.type === "call_expression") {

            const fn = node.childForFieldName("function");

            const callee = getCallName(fn);

            if (callee) {

                calls.push({

                    callerName:
                        currentFunction ?? "__GLOBAL__",

                    calleeName: callee,

                    line:
                        node.startPosition.row + 1,

                    column:
                        node.startPosition.column,

                });

            }

        }

        for (const child of node.namedChildren) {
            visit(child);
        }

    }

    visit(tree.rootNode);

    return calls;

};