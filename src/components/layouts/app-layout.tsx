import { Outlet } from 'react-router-dom';
import styles from './app-layout.module.scss';

export const AppLayout = () => {
  return (
    <div className={styles.appLayout}>
      <main className={styles.appLayout__content}>
        <Outlet />
      </main>
    </div>
  );
};
