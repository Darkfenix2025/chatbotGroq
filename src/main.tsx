import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Importar funciones de prueba del sistema vectorial (solo en desarrollo)
if (import.meta.env.DEV) {
  import('./test-vectorial-system');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
