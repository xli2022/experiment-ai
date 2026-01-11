import { useState } from 'react'
import Chat from './components/Chat'
import './index.css'

function App() {
    return (
        <div className="app-container">
            <h1>Sam's Chatbot</h1>
            <Chat />
        </div>
    )
}

export default App
