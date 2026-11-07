import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/errors/error-boundary';
import { I18nProvider } from '@/lib/i18n';

type AppProviderProps = {
  children: ReactNode;
};

/** Wraps the app with all global providers (error handling, i18n). */
export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ErrorBoundary>
      <I18nProvider>{children}</I18nProvider>
    </ErrorBoundary>
  );
};
