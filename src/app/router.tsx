import { createHashRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/app-layout';
import { DashboardRoute } from './routes/dashboard';
import { NotFoundRoute } from './routes/not-found';

// Hash routing: the extension page is served as a file
// (chrome-extension://<id>/index.html), so there is no server-side fallback.
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardRoute />,
      },
      {
        path: '*',
        element: <NotFoundRoute />,
      },
    ],
  },
]);
