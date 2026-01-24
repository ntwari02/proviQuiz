import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DemoPage } from "./pages/DemoPage";
import { ExamPage } from "./pages/ExamPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ResultsPage } from "./pages/ResultsPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireRole } from "./components/auth/RequireRole";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { EnhancedUserManagementPage } from "./pages/admin/EnhancedUserManagementPage";
import { AdminExamsPage } from "./pages/admin/AdminExamsPage";
import { QuestionManagementPage } from "./pages/admin/QuestionManagementPage";
import { CategoryTopicManagementPage } from "./pages/admin/CategoryTopicManagementPage";
import { IncrementManagementPage } from "./pages/admin/IncrementManagementPage";
import { ExamCreationPage } from "./pages/admin/ExamCreationPage";
import { AnalyticsDashboardPage } from "./pages/admin/AnalyticsDashboardPage";
import { BulkImportExportPage } from "./pages/admin/BulkImportExportPage";
import { SystemSettingsPage } from "./pages/admin/SystemSettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        path="/admin/*"
        element={
          <RequireAuth>
            <RequireRole roles={["admin", "superadmin"]}>
              <AdminLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<EnhancedUserManagementPage />} />
        <Route path="exams" element={<AdminExamsPage />} />
        <Route path="questions" element={<QuestionManagementPage />} />
        <Route path="categories" element={<CategoryTopicManagementPage />} />
        <Route path="increments" element={<IncrementManagementPage />} />
        <Route path="exam-config" element={<ExamCreationPage />} />
        <Route path="analytics" element={<AnalyticsDashboardPage />} />
        <Route path="bulk" element={<BulkImportExportPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
      </Route>
    </Routes>
  );
}
