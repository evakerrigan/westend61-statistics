import React, { type ReactNode } from 'react';
import styles from './error-boundary.module.scss';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div role="alert" className={styles['error-boundary']}>
          <h2 className={styles['error-boundary__title']}>
            Something went wrong.
          </h2>
          {this.state.error?.message && (
            <p className={styles['error-boundary__message']}>
              {this.state.error?.message}
            </p>
          )}
          <div className={styles['error-boundary__actions']}>
            <button
              type="button"
              onClick={this.handleReset}
              className={styles['error-boundary__button']}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`${styles['error-boundary__button']} ${styles['error-boundary__button--primary']}`}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
