import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TaskListPage from './pages/TaskListPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RedirectIfAuthed } from './routes/RedirectIfAuthed';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <RegisterPage />
          </RedirectIfAuthed>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/tasks" element={<TaskListPage />} />
        <Route path="/tasks/new" element={<TaskDetailPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/tasks" replace />} />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}
