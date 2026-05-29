import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Bootstraps the React app into the single root element in index.html.
// StrictMode is enabled in development so React can warn about side effects
// and lifecycle issues early while the app is being built.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
