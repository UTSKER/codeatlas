import axios from "axios";

class EmbeddingClient {
    constructor() {
        this.baseURL =
            process.env.EMBEDDING_SERVICE_URL ||
            "http://localhost:8000";
    }

    async embed(texts) {
        const response = await axios.post(
            `${this.baseURL}/embed`,
            { texts }
        );

        return response.data;
    }

    async health() {
        const response = await axios.get(
            `${this.baseURL}/health`
        );

        return response.data;
    }
}

export default new EmbeddingClient();