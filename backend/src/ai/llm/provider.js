import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1_000;

let client = null;

function getClient() {
    if (client) {
        return client;
    }

    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is required.");
    }

    client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: OPENROUTER_BASE_URL,
        timeout: getRequestTimeoutMs(),
        maxRetries: 0,
    });

    return client;
}

export async function generate({
    messages,
    temperature = 0,
    responseFormat = "text",
}) {
    if (!process.env.OPENROUTER_MODEL) {
        throw new Error("OPENROUTER_MODEL is required.");
    }

    const request = {
        model: process.env.OPENROUTER_MODEL,
        messages,
        temperature,
    };

    if (responseFormat === "json") {
        request.response_format = {
            type: "json_object",
        };
    }

    const completion = await retryOnRateLimit(() =>
        getClient().chat.completions.create(
            request,
            {
                timeout: getRequestTimeoutMs(),
            }
        )
    );

    return completion.choices?.[0]?.message?.content ?? "";
}

async function retryOnRateLimit(operation) {
    let originalError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (!originalError) {
                originalError = error;
            }

            if (
                !isRateLimitError(error) ||
                attempt >= MAX_RETRIES
            ) {
                throw originalError;
            }

            await sleep(
                INITIAL_RETRY_DELAY_MS *
                2 ** attempt
            );
        }
    }

    throw originalError;
}

function isRateLimitError(error) {
    return error?.status === 429 || error?.code === 429;
}

function getRequestTimeoutMs() {
    return Number(
        process.env.LLM_REQUEST_TIMEOUT_MS ??
        DEFAULT_TIMEOUT_MS
    );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
