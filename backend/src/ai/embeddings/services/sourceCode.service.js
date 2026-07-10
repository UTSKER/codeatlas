import fs from "fs/promises";
import path from "path";

class SourceCodeService {

    /**
     * Reads the complete source code of a file.
     */
    async getFileContent(repository, file) {

        const absolutePath = path.join(
            repository.localPath,
            file.path
        );

        return await fs.readFile(
            absolutePath,
            "utf8"
        );

    }

    /**
     * Extracts the source code corresponding to a symbol
     * using its start/end lines.
     */
    async getSymbolCode(repository, symbol) {

        const fileContent =
            await this.getFileContent(
                repository,
                symbol.file
            );

        const lines = fileContent.split("\n");

        const code = lines
            .slice(
                symbol.startLine - 1,
                symbol.endLine
            )
            .join("\n");

        return code;

    }

}

export default new SourceCodeService();