import { Route, Routes } from 'react-router-dom';
import { AdminProvider } from '../../data/admin';
import AdminLayout from './AdminLayout';
import ContentEditor from './ContentEditor';
import Guests from './Guests';
import Overview from './Overview';

export default function AdminRoutes() {
  return (
    <AdminProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="guests" element={<Guests />} />
          <Route path="content" element={<ContentEditor />} />
        </Route>
      </Routes>
    </AdminProvider>
  );
}
