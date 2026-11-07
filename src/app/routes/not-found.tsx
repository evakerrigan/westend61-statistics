import { Button } from '@/components/ui/button';
import styles from './not-found.module.scss';

export const NotFoundRoute = () => {
  return (
    <div className={styles.notFound}>
      <div className={styles.notFound__container}>
        <h1 className={styles.notFound__title}>404</h1>
        <h2 className={styles.notFound__subtitle}>Page not found</h2>
        <p className={styles.notFound__description}>
          Sorry, the page you are looking for does not exist or has been moved.
        </p>

        <Button as="a" href="/" className={styles.notFound__link}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};
