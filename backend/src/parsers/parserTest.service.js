import fs from "fs/promises";
import { parseSourceCode } from "./parser.service.js";

export const parseFile = async (filePath) => {

    const source = await fs.readFile(filePath, "utf8");

    const result = await parseSourceCode(source);

    return {
        symbols: result.symbols,
        imports: result.imports,
        exports: result.exports,
        functionCalls: result.functionCalls,
    };

};