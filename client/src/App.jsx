import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QuizPage from './pages/QuizPage';
import PracticePage from './pages/PracticePage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AttemptDetailPage from './pages/AttemptDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
          <Route path="/result/:attemptId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/history/:attemptId" element={<ProtectedRoute><AttemptDetailPage /></ProtectedRoute>} />

          <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategoriesPage /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute requireAdmin><AdminQuestionsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalyticsPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <small>IQ Tester &middot; Detyre Kursi &middot; React + Express + PostgreSQL</small>
      </footer>
    </>
  );
}
