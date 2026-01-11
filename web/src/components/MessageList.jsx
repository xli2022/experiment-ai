import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const MessageList = ({ messages }) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

    const preprocessMath = (text) => {
        if (!text) return text;
        // Replace \[ and \] with $$ for display math
        // Replace \( and \) with $ for inline math
        return text
            .replace(/\\\[/g, '$$$$')
            .replace(/\\\]/g, '$$$$')
            .replace(/\\\(/g, '$')
            .replace(/\\\)/g, '$');
    };

    return (
        <div className="message-list">
            {messages.filter(msg => msg.role !== 'system').map((msg, index) => {
                // Parse for <think> tags (handle both complete and partial/streaming)
                // Added 'i' flag for case insensitivity
                const thinkRegex = /<think>([\s\S]*?)?(?:<\/think>|$)/i;
                const thinkMatch = msg.content.match(thinkRegex);

                let thought = msg.thinking || null;
                let mainContent = msg.content;

                // Fallback: If no structured thinking, check for tags in content
                if (!thought && thinkMatch) {
                    thought = thinkMatch[1] ? thinkMatch[1].trim() : '';
                    // Remove the think block from the main content
                    // If closed, remove up to </think>. If open, remove everything after <think>
                    // Use the same regex approach for replacement to ensure consistency
                    mainContent = msg.content.replace(thinkRegex, '').trim();
                }

                const processedThought = preprocessMath(thought);
                const processedMainContent = preprocessMath(mainContent);

                return (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-content">
                            {msg.imagePreview && (
                                <img
                                    src={msg.imagePreview}
                                    alt="Uploaded"
                                    className="chat-image"
                                />
                            )}
                            {thought && (
                                <div className="thinking">
                                    <div className="thinking-header">
                                        <span>💭</span> Thinking Process
                                    </div>
                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{processedThought}</ReactMarkdown>
                                </div>
                            )}
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{processedMainContent}</ReactMarkdown>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
