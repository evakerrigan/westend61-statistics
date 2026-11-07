import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/errors/error-boundary';

type AppProviderProps = {
  children: ReactNode;
};

/**
 * Wraps the app with all global providers (error handling, and later:
 * data-fetching client, theme, i18n, etc.).
 */
export const AppProvider = ({ children }: AppProviderProps) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};
