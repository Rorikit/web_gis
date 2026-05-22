import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { RoleGuard } from '@/app/guards/RoleGuard';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { MainLayout } from '@/app/layouts/MainLayout';
import { AccessDeniedPage } from '@/pages/access-denied/AccessDeniedPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { DamageArchivePage } from '@/pages/damage-archive/DamageArchivePage';
import { DamageDetailsPage } from '@/pages/damages/DamageDetailsPage';
import { DamagesPage } from '@/pages/damages/DamagesPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { FullAccessPage } from '@/pages/full-access/FullAccessPage';
import { OrderMapPage } from '@/pages/map/OrderMapPage';
import { OoppprArchivePage } from '@/pages/oopppr/OoppprArchivePage';
import { OoppprPage } from '@/pages/oopppr/OoppprPage';
import { OrderArchivePage } from '@/pages/order-archive/OrderArchivePage';
import { OrderDetailsPage } from '@/pages/orders/OrderDetailsPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { UsersPage } from '@/pages/users/UsersPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/auth', element: <AuthPage /> }],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          {
            element: <RoleGuard permission="damage.read" />,
            children: [
              { path: '/damages', element: <DamagesPage /> },
              { path: '/damages/archive', element: <DamageArchivePage /> },
              { path: '/damages/:id', element: <DamageDetailsPage /> },
            ],
          },
          {
            element: <RoleGuard permission="order.read" />,
            children: [
              { path: '/orders', element: <OrdersPage /> },
              { path: '/orders/archive', element: <OrderArchivePage /> },
              { path: '/orders/:id', element: <OrderDetailsPage /> },
              { path: '/map/orders', element: <OrderMapPage /> },
            ],
          },
          {
            element: <RoleGuard permission="reports.createReference" />,
            children: [
              { path: '/oopppr', element: <OoppprPage /> },
              { path: '/oopppr/archive', element: <OoppprArchivePage /> },
              { path: '/full-access', element: <FullAccessPage /> },
            ],
          },
          {
            element: <RoleGuard permission="users.read" />,
            children: [
              { path: '/admin', element: <AdminPage /> },
              { path: '/admin/users', element: <UsersPage /> },
            ],
          },
          { path: '/access-denied', element: <AccessDeniedPage /> },
        ],
      },
    ],
  },
]);
