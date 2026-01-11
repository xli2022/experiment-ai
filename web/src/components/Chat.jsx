import React, { useState, useEffect, useRef } from 'react';
import ModelSelector from './ModelSelector';
import PromptSelector from './PromptSelector';
import MessageList from './MessageList';
import { useOllama } from '../hooks/useOllama';

const Chat = () => {
    const { ollama, listModels, chat, abort } = useOllama();
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!ollama) return; // Wait for ollama to be initialized

        const fetchModels = async () => {
            const availableModels = await listModels();
            setModels(availableModels);
            if (availableModels.length > 0) {
                setSelectedModel(prev => {
                    // Keep current selection if valid, otherwise pick first
                    const stillExists = availableModels.find(m => m.name === prev);
                    return stillExists ? prev : availableModels[0].name;
                });
            }
        };
        fetchModels();
    }, [ollama, listModels]);

    useEffect(() => {
        // Load available prompts
        fetch(`${import.meta.env.BASE_URL}prompts.json`)
            .then(res => res.json())
            .then(data => setPrompts(data))
            .catch(err => console.error("Failed to load prompts list", err));
    }, []);

    useEffect(() => {
        // Load prompt content when selectedPrompt changes
        if (selectedPrompt) {
            fetch(`${import.meta.env.BASE_URL}prompts/${selectedPrompt}.txt`)
                .then(res => res.text())
                .then(text => {
                    setMessages([{ role: 'system', content: text }]);
                })
                .catch(err => console.error(`Failed to load prompt ${selectedPrompt}`, err));
        } else {
            setMessages([]);
        }
    }, [selectedPrompt]);

    const convertBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
                resolve(fileReader.result);
            };
            fileReader.onerror = (error) => {
                reject(error);
            };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            try {
                const base64 = await convertBase64(file);
                setPreview(base64);
            } catch (error) {
                console.error("Error reading file:", error);
            }
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async () => {
        const userInput = input.trim();
        if (userInput === '/abort' && isStreaming) {
            handleCommand('/abort');
            return;
        }

        if ((!userInput && !selectedFile) || isStreaming) return;

        const currentFile = selectedFile;
        const currentPreview = preview;

        setInput('');
        clearFile();
        setIsStreaming(true);

        // Handle slash commands
        if (userInput.startsWith('/')) {
            await handleCommand(userInput);
            setIsStreaming(false);
            return;
        }

        const userMessage = { role: 'user', content: userInput };

        if (currentFile && currentPreview) {
            // Ollama expects base64 without the data URL prefix "data:image/png;base64,"
            const base64Data = currentPreview.split(',')[1];
            userMessage.images = [base64Data];
            // Store the full data URL for displaying in chat history
            userMessage.imagePreview = currentPreview;
        }

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        let assistantMessage = { role: 'assistant', content: '', thinking: '' };
        setMessages(prev => [...prev, assistantMessage]);

        await chat(selectedModel, newMessages, (part) => {
            assistantMessage.content += part.message.content;
            if (part.message.thinking) {
                assistantMessage.thinking += part.message.thinking;
            }

            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMessage };
                return updated;
            });
        });

        setIsStreaming(false);
    };

    const handleCommand = async (cmd) => {
        if (cmd === '/abort') {
            abort();
            setIsStreaming(false);
            setInput('');
        } else if (cmd === '/clear') {
            setMessages([]);
            // Reload selected prompt if applicable to restore system message
            if (selectedPrompt) {
                const text = await fetch(`${import.meta.env.BASE_URL}prompts/${selectedPrompt}.txt`).then(res => res.text());
                setMessages([{ role: 'system', content: text }]);
            }
        } else {
            setMessages(prev => [...prev, { role: 'system', content: `Unknown command: ${cmd}` }]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };


    return (
        <div className="chat-container">
            <div className="controls">
                <ModelSelector
                    models={models}
                    selectedModel={selectedModel}
                    onSelect={setSelectedModel}
                />
                <PromptSelector
                    prompts={prompts}
                    selectedPrompt={selectedPrompt}
                    onSelect={setSelectedPrompt}
                />
            </div>

            <MessageList messages={messages} />

            <div className="input-area-container">
                {preview && (
                    <div className="image-preview">
                        <img src={preview} alt="Upload preview" />
                        <button className="remove-image-btn" onClick={clearFile} title="Remove image">×</button>
                    </div>
                )}
                <div className="input-area">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload Image"
                    >
                        📷
                    </button>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message or upload an image..."
                        rows={3}
                    />
                    <button onClick={handleSendMessage} disabled={isStreaming || !selectedModel}>
                        {isStreaming ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
