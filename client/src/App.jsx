import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import AttemptDetailPage from './pages/AttemptDetailPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import AdminUsersPage from './pages/AdminUsersPage';

export default function App() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/result/:attemptId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/history/:attemptId" element={<ProtectedRoute><AttemptDetailPage /></ProtectedRoute>} />

          <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategoriesPage /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute requireAdmin><AdminQuestionsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <small>IQ Tester &middot; Detyre Kursi &middot; React + Express + PostgreSQL</small>
      </footer>
    </>
  );
}
