import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import de React Router
import './css/index.css';

// Import des pages
import Categorie from '../src/component/Categorie';
import Theme from '../src/component/Theme';
import Cartes from '../src/component/Cartes';

const rootElement = document.getElementById('root');
console.log("Root element found:", rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Categorie/>} />,
          <Route path="/themes/:categoryID" element={<Theme/>} />
            <Route path="/cartes" element={<Cartes/>} />,
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
