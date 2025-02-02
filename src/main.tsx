import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import de React Router
import './css/index.css';

// Import des pages
import CatPage from './pages/CategoriePage'
import Test from '../src/component/Categorie';

const rootElement = document.getElementById('root');
console.log("Root element found:", rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={< CatPage/>} />,
          <Route path="/cat" element={<Test/>} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
