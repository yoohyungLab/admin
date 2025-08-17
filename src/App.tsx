import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLoginPage } from './pages/auth/admin-login-page';
import { AdminLayout } from './components/layout/admin-layout';
import { DashboardPage } from './pages/dashboard-page';
import { TestListPage } from './pages/tests/test-list-page';
import { CreateTestPage } from './pages/tests/create-test-page';
import SectionManagementPage from './pages/sections/section-management-page';
// import SectionTestManagementPage from './pages/sections/section-test-management-page';
import CategoryManagementPage from './pages/categories/category-management-page';
import './App.css';
import { FeedbackListPage } from './pages/feedback/feedback-list-page';
import { UserManagementPage } from './pages/users/user-management-page';
// import { EditTestPage } from './pages/tests/edit-test-page';
// import SettingsPage from './pages/settings/settings-page';

export default function App() {
    return (
        <Router>
            <Routes>
                {/* 관리자 로그인 페이지 */}
                <Route path="/auth" element={<AdminLoginPage />} />

                {/* 관리자 대시보드 (보호된 라우트) */}
                <Route path="/" element={<AdminLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="feedbacks" element={<FeedbackListPage />} />
                    <Route path="tests" element={<TestListPage />} />
                    <Route path="tests/create" element={<CreateTestPage />} />
                    {/* <Route path="tests/:id/edit" element={<EditTestPage />} /> */}
                    <Route path="categories" element={<CategoryManagementPage />} />
                    <Route path="sections" element={<SectionManagementPage />} />
                    {/* <Route path="settings" element={<SettingsPage />} /> */}
                </Route>

                {/* 기본 리다이렉트 */}
                <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
        </Router>
    );
}
