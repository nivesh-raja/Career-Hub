import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeProvider.js';
import { ToastProvider } from './components/ui/Toast.js';
import { DashboardLayout } from './components/layout/DashboardLayout.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { UnauthorizedPage } from './pages/UnauthorizedPage.js';
import { AdminDashboard } from './pages/Dashboards/AdminDashboard.js';
import { FacultyDashboard } from './pages/Dashboards/FacultyDashboard.js';
import { StudentDashboard } from './pages/Dashboards/StudentDashboard.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AIWorkspace } from './pages/AIWorkspace.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Admin Protected Routes */}
                <Route element={<DashboardLayout allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard view="dashboard" />} />
                  <Route path="/admin/users" element={<AdminDashboard view="users" />} />
                  <Route path="/admin/roles" element={<AdminDashboard view="roles" />} />
                  <Route path="/admin/classrooms" element={<AdminDashboard view="classrooms" />} />
                  <Route path="/admin/departments" element={<AdminDashboard view="departments" />} />
                  <Route path="/admin/subjects" element={<AdminDashboard view="subjects" />} />
                  <Route path="/admin/ai" element={<AIWorkspace />} />
                  <Route path="/admin/profile" element={<ProfilePage />} />
                  <Route path="/admin/settings" element={<SettingsPage />} />
                  {/* Fallbacks */}
                  <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>

                {/* Faculty Protected Routes */}
                <Route element={<DashboardLayout allowedRoles={['faculty']} />}>
                  <Route path="/faculty/dashboard" element={<FacultyDashboard view="overview" />} />
                  <Route path="/faculty/classrooms" element={<FacultyDashboard view="classrooms" />} />
                  <Route path="/faculty/students" element={<FacultyDashboard view="students" />} />
                  <Route path="/faculty/assignments" element={<FacultyDashboard view="assignments" />} />
                  <Route path="/faculty/materials" element={<FacultyDashboard view="materials" />} />
                  <Route path="/faculty/question-papers" element={<FacultyDashboard view="question-papers" />} />
                  <Route path="/faculty/announcements" element={<FacultyDashboard view="announcements" />} />
                  <Route path="/faculty/schedule" element={<FacultyDashboard view="schedule" />} />
                  <Route path="/faculty/ai" element={<AIWorkspace />} />
                  <Route path="/faculty/profile" element={<ProfilePage />} />
                  <Route path="/faculty/settings" element={<SettingsPage />} />
                  {/* Fallbacks */}
                  <Route path="/faculty/*" element={<Navigate to="/faculty/dashboard" replace />} />
                </Route>

                {/* Student Protected Routes */}
                <Route element={<DashboardLayout allowedRoles={['student']} />}>
                  <Route path="/student/dashboard" element={<StudentDashboard view="overview" />} />
                  <Route path="/student/classroom" element={<StudentDashboard view="classroom" />} />
                  <Route path="/student/subjects" element={<StudentDashboard view="subjects" />} />
                  <Route path="/student/assignments" element={<StudentDashboard view="assignments" />} />
                  <Route path="/student/materials" element={<StudentDashboard view="materials" />} />
                  <Route path="/student/question-papers" element={<StudentDashboard view="question-papers" />} />
                  <Route path="/student/announcements" element={<StudentDashboard view="announcements" />} />
                  <Route path="/student/schedule" element={<StudentDashboard view="schedule" />} />
                  <Route path="/student/ai" element={<AIWorkspace />} />
                  <Route path="/student/profile" element={<ProfilePage />} />
                  <Route path="/student/settings" element={<SettingsPage />} />
                  {/* Fallbacks */}
                  <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />
                </Route>

                {/* 404 Catch-all */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
