import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './components/layout/admin-layout';
import { DashboardPage } from './pages/dashboard-page';
import { TestListPage } from './pages/tests/test-list-page';
import { CreateTestPage } from './pages/tests/create-test-page';
import SectionManagementPage from './pages/sections/section-management-page';
import SectionTestManagementPage from './pages/sections/section-test-management-page';
import CategoryManagementPage from './pages/categories/category-management-page';
import './App.css';
import { FeedbackListPage } from './pages/\bfeedback/feedback-list-page';

function App() {
    return (
        <Router>
            <AdminLayout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/tests" element={<TestListPage />} />
                    <Route path="/tests/create" element={<CreateTestPage />} />
                    <Route path="/sections" element={<SectionManagementPage />} />
                    <Route path="/sections/:sectionId/tests" element={<SectionTestManagementPage />} />
                    <Route path="/categories" element={<CategoryManagementPage />} />
                    <Route path="/feedbacks" element={<FeedbackListPage />} />

                    {/* 추가 라우트들은 나중에 구현 */}
                    <Route path="/tests/:id/edit" element={<div>테스트 수정 페이지 (구현 예정)</div>} />
                    <Route path="/results" element={<div>결과 관리 페이지 (구현 예정)</div>} />
                    <Route path="/responses" element={<div>유저 응답 페이지 (구현 예정)</div>} />
                </Routes>
            </AdminLayout>
        </Router>
    );
}

export default App;
