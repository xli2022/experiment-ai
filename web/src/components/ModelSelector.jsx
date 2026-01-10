import React from 'react';

const ModelSelector = ({ models, selectedModel, onSelect }) => {
    return (
        <div className="selector-container">
            <label htmlFor="model-select">Model:</label>
            <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => onSelect(e.target.value)}
                disabled={models.length === 0}
            >
                {models.map((model) => (
                    <option key={model.name} value={model.name}>
                        {model.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ModelSelector;
