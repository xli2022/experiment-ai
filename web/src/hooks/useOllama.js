import { useState, useEffect, useRef, useCallback } from 'react';
import { Ollama } from 'ollama/browser';


// Use localhost for local development, production URL otherwise
const OLLAMA_HOST = import.meta.env.DEV
    ? 'http://localhost:11434'
    : 'https://berkeley.babeltimeus.com';

export const useOllama = () => {
    const [ollama, setOllama] = useState(null);
    const [models, setModels] = useState([]);

    useEffect(() => {
        const client = new Ollama({ host: OLLAMA_HOST });
        setOllama(client);
    }, []);

    const listModels = useCallback(async () => {
        if (!ollama) return [];
        try {
            const response = await ollama.list();
            return response.models || [];
        } catch (error) {
            console.error("Failed to list models:", error);
            return [];
        }
    }, [ollama]);

    const chat = useCallback(async (model, messages, onChunk) => {
        if (!ollama) return;

        try {
            // Enable thinking only for specific reasoning models
            const enableThink = model.startsWith("gpt-oss") || model.startsWith("qwen") || model.startsWith("deepseek");

            const response = await ollama.chat({
                model: model,
                messages: messages,
                stream: true,
                ...(enableThink ? { think: true } : {}),
            });

            for await (const part of response) {
                onChunk(part);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Chat error:", error);
            }
        }
    }, [ollama]);

    const abort = useCallback(() => {
        if (ollama) {
            ollama.abort();
        }
    }, [ollama]);

    return { ollama, listModels, chat, abort };
};
