class EmbeddingTextBuilderService {

    MAX_CODE_LENGTH = 4000;

    build(symbol, code) {

        const trimmedCode =
            code.length > this.MAX_CODE_LENGTH
                ? code.substring(0, this.MAX_CODE_LENGTH)
                : code;

        return `
File:
${symbol.file.path}

Language:
${symbol.file.language}

Symbol:
${symbol.name}

Kind:
${symbol.kind}

Signature:
${symbol.signature ?? ""}

Code:
${trimmedCode}
`.trim();

    }

}

export default new EmbeddingTextBuilderService();