import React from 'react';

const PromptSelector = ({ prompts, selectedPrompt, onSelect }) => {
    return (
        <div className="selector-container">
            <label htmlFor="prompt-select">Prompt:</label>
            <select
                id="prompt-select"
                value={selectedPrompt}
                onChange={(e) => onSelect(e.target.value)}
            >
                <option value="">(None)</option>
                {prompts.map((prompt) => (
                    <option key={prompt} value={prompt}>
                        {prompt}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default PromptSelector;
