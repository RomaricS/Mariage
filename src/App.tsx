import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ContentProvider } from './data/content';
import { LangProvider } from './i18n';
import Home from './pages/Home';
import InvitePage, { Loading } from './pages/Invite';
import RsvpPage from './pages/Rsvp';

// The admin (and the auth SDK) only loads for /admin.
const AdminRoutes = lazy(() => import('./pages/admin/AdminRoutes'));

export default function App() {
  return (
    <LangProvider>
      <ContentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/i/:token" element={<InvitePage />} />
            <Route path="/i/:token/rsvp" element={<RsvpPage />} />
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<Loading />}>
                  <AdminRoutes />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ContentProvider>
    </LangProvider>
  );
}
