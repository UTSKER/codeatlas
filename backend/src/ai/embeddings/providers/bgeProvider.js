const EmbeddingProvider = require("./embeddingProvider");

class BGEProvider extends EmbeddingProvider {

    constructor(config = {}) {
        super();

        this.model = config.model || "bge-m3";
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
    }

    async embed(text) {
        throw new Error("BGEProvider.embed() not implemented.");
    }

    async embedBatch(texts) {
        throw new Error("BGEProvider.embedBatch() not implemented.");
    }

    getInfo() {
        return {
            provider: "BGE",
            model: this.model,
        };
    }
}

module.exports = BGEProvider;