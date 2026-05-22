import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  // Intercept and absorb unpreventable background WebSocket or Vite HMR connection errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : (reason?.message || '');
    if (
      message.toLowerCase().includes('websocket') || 
      message.toLowerCase().includes('vite') ||
      message.toLowerCase().includes('hmr')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.toLowerCase().includes('websocket') || 
      message.toLowerCase().includes('vite') ||
      message.toLowerCase().includes('hmr')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
