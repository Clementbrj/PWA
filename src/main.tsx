import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';

// Vérifie si #root existe
const rootElement = document.getElementById('root');
console.log("Root element found:", rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <div>Hello World!</div>
    </React.StrictMode>
  );
} else {
  console.error("Element #root non trouvé !");
}
