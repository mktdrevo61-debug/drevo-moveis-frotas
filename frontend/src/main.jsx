// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{ zIndex: 9999 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#32363A',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#30914C', secondary: '#FFFFFF' },
            style: { borderLeft: '4px solid #30914C' },
          },
          error: {
            iconTheme: { primary: '#BB0000', secondary: '#FFFFFF' },
            style: { borderLeft: '4px solid #BB0000' },
          },
        }}
      />
    </HashRouter>
  </React.StrictMode>,
);
