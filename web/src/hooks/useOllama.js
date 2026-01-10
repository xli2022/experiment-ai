import { useState, useEffect, useRef, useCallback } from 'react';
import { Ollama } from 'ollama/browser';


const OLLAMA_HOST = 'https://berkeley.babeltimeus.com';

export const useOllama = () => {
    const [ollama, setOllama] = useState(null);
    const [models, setModels] = useState([]);
    const abortControllerRef = useRef(null);

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

        abortControllerRef.current = new AbortController();

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
                if (abortControllerRef.current.signal.aborted) {
                    break;
                }
                onChunk(part);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Chat error:", error);
            }
        }
    }, [ollama]);

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return { ollama, listModels, chat, abort };
};
