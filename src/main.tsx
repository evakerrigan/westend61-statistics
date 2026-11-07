import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/app';
import { applyTheme, getInitialTheme } from '@/lib/theme';
import '@/styles/index.scss';

// Before the first render, so the page never flashes in the wrong theme.
applyTheme(getInitialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
