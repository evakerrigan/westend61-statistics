import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/app-layout';
import { NotFoundRoute } from './routes/not-found';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '*',
        element: <NotFoundRoute />,
      },
    ],
  },
]);
