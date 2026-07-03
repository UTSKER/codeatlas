import { Parser, Language } from "web-tree-sitter";
import path from "path";

import { extractCodeInformation } from "./javascript.visitor.js";
import { extractFunctionCalls } from "./functionCall.visitor.js";
import { extractExports } from "./export.visitor.js";

let parser = null;

export const initializeParser = async () => {

    if (parser) {
        return parser;
    }

    await Parser.init();

    const language = await Language.load(
        path.join(
            process.cwd(),
            "src",
            "parsers",
            "tree-sitter-javascript.wasm"
        )
    );

    parser = new Parser();

    parser.setLanguage(language);

    return parser;
};

export const parseSourceCode = async (sourceCode) => {

    const parserInstance = await initializeParser();

    const tree = parserInstance.parse(sourceCode);

    const {
        symbols,
        imports,
    } = extractCodeInformation(tree);

    const exports = extractExports(tree);

    const functionCalls = extractFunctionCalls(tree);

    return {
        tree,
        symbols,
        imports,
        exports,
        functionCalls,
    };

};