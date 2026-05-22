import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { router } from './router/router';
import { ToastViewport } from '@/shared/ui';

export const App = () => (
  <QueryProvider>
    <RouterProvider router={router} />
    <ToastViewport />
  </QueryProvider>
);
