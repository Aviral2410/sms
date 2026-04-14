import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ToastProvider } from './contexts/ToastContext';
import { Toaster } from './components/common/Toaster';
import './store/useStore';
import './styles/design-system.css';
import './styles/antigravity.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
        <Toaster />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
