import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRouter from './App.router';
import { ToastProvider } from './Toast';
import reportWebVitals from './reportWebVitals';

// Set a descriptive page title for the app
document.title = 'DOrSU Alumni Tracer';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </React.StrictMode>
);

reportWebVitals();
