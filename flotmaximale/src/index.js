// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Assurons-nous que les styles de ReactFlow sont importés
import 'reactflow/dist/style.css';

// Utilisation de createRoot au lieu de ReactDOM.render (React 18+)
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);