import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import OAuth2RedirectPage from '@/pages/OAuth2RedirectPage';
import ProblemsPage from '@/pages/ProblemsPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';

import AdminProtectedRoute from '@/routes/AdminProtectedRoute';
import AdminLayout from '@/layouts/LayoutsAdmin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard/AdminDashboard';
import AdminLanguagesPage from '@/pages/admin/AdminLanguagesPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminProblemsPage from '@/pages/admin/AdminProblemsPage';
import AdminProblemForm from '@/pages/admin/AdminProblemForm';
import AdminTagsPage from '@/pages/admin/AdminTagsPage';
import AdminTestcasesPage from '@/pages/admin/AdminTestcasesPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminContestsPage from '@/pages/admin/AdminContestsPage';
import AdminContestForm from '@/pages/admin/AdminContestForm';
import AdminPostsPage from '@/pages/admin/AdminPostsPage';
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage';
import ProfilePage from '@/pages/ProfilePage';
import PublicProfilePage from '@/pages/PublicProfilePage';
import DiscussPage from '@/pages/DiscussPage';
import CreatePostPage from '@/pages/CreatePostPage';
import PostDetailPage from '@/pages/PostDetailPage';
import MessagesPage from '@/pages/MessagesPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ContestPage from '@/pages/ContestPage';
import ContestDetailPage from '@/pages/ContestDetailPage';
import NotificationsPage from '@/pages/NotificationsPage';
import MySubmissionsPage from '@/pages/MySubmissionsPage';
import { ROUTES } from '@/utils/constants';
import ProblemDetailPage from '@/pages/ProblemDetailPage';

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: (
      <MainLayout>
        <HomePage />
      </MainLayout>
    ),
  },
  {
    path: ROUTES.LOGIN,
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.REGISTER,
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.OAUTH2_REDIRECT,
    element: <OAuth2RedirectPage />,
  },
  {
    path: ROUTES.PROBLEMS,
    element: (
      <MainLayout>
        <ProblemsPage />
      </MainLayout>
    ),
  },
  {
    path: `${ROUTES.PROBLEMS}/:id`,

    element: <ProblemDetailPage />,
  },
  {
    path: ROUTES.PROFILE,
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ProfilePage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.CHANGE_PASSWORD,
    element: (
      <ProtectedRoute>
        <ChangePasswordPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:userId',
    element: (
      <MainLayout>
        <PublicProfilePage />
      </MainLayout>
    ),
  },
  {
    path: '/profile/:userId',
    element: (
      <MainLayout>
        <PublicProfilePage />
      </MainLayout>
    ),
  },
  {
    path: ROUTES.CONTEST,
    element: (
      <MainLayout>
        <ContestPage />
      </MainLayout>
    ),
  },
  {
    path: `${ROUTES.CONTEST}/:id`,
    element: <ContestDetailPage />,
  },
  {
    path: ROUTES.CREATE_POST,
    element: (
      <ProtectedRoute>
        <MainLayout>
          <CreatePostPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.DISCUSS,
    element: (
      <MainLayout>
        <DiscussPage />
      </MainLayout>
    ),
  },
  {
    path: `${ROUTES.DISCUSS}/:id`,
    element: (
      <MainLayout>
        <PostDetailPage />
      </MainLayout>
    ),
  },
  {
    path: ROUTES.LEADERBOARD,
    element: (
      <MainLayout>
        <LeaderboardPage />
      </MainLayout>
    ),
  },
  // -- Admin routes (fixed: object with children) --
  {
    path: '/admin',
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'languages',
        element: <AdminLanguagesPage />,
      },
      {
        path: 'categories',
        element: <AdminCategoriesPage />,
      },
      {
        path: 'tags',
        element: <AdminTagsPage />,
      },
      {
        path: 'problems',
        element: <AdminProblemsPage />,
      },
      {
        path: 'problems/new',
        element: <AdminProblemForm />,
      },
      {
        path: 'problems/:id/edit',
        element: <AdminProblemForm />,
      },
      {
        path: 'testcases',
        element: <AdminTestcasesPage />,
      },
      {
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        path: 'posts',
        element: <AdminPostsPage />,
      },
      {
        path: 'audit-logs',
        element: <AdminAuditLogsPage />,
      },
      {
        path: 'contests',
        element: <AdminContestsPage />,
      },
      {
        path: 'contests/new',
        element: <AdminContestForm />,
      },
      {
        path: 'contests/:id/edit',
        element: <AdminContestForm />,
      },
    ],
  },
  {
    path: ROUTES.MESSAGES,
    element: (
      <ProtectedRoute>
        <MainLayout>
          <MessagesPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: `${ROUTES.MESSAGES}/:conversationId`,
    element: (
      <ProtectedRoute>
        <MainLayout>
          <MessagesPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.NOTIFICATIONS,
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.SUBMISSIONS,
    element: (
      <ProtectedRoute>
        <MainLayout>
          <MySubmissionsPage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
]);


export default router;