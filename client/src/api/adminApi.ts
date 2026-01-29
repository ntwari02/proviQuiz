import { api } from "./http";

export type AdminOverview = {
  userCount: number;
  questionCount: number;
  examCount: number;
  trend: Array<{ date: string; exams: number; accuracy: number }>;
  questionsByIncrement?: Array<{ increment: number; total: number; published: number }>;
  passRate?: number;
  activeExamConfigs?: number;
};

export async function adminOverviewApi() {
  const res = await api.get<AdminOverview>("/admin/overview");
  return res.data;
}

export type AdminUser = {
  id: string;
  email: string;
  name?: string;
  role: "student" | "admin" | "superadmin" | string;
  createdAt: string;
  hasGoogle: boolean;
};

export async function adminUsersApi(input: { limit: number; skip: number; q?: string }) {
  const res = await api.get<{ items: AdminUser[]; total: number }>("/admin/users", {
    params: input,
  });
  return res.data;
}

export async function adminUpdateUserRoleApi(input: { userId: string; role: "student" | "admin" | "superadmin" }) {
  const res = await api.patch<AdminUser>(`/admin/users/${input.userId}/role`, { role: input.role });
  return res.data;
}

export async function adminCreateUserApi(input: {
  email: string;
  password: string;
  name?: string;
  role: "student" | "admin" | "superadmin";
}) {
  const res = await api.post<AdminUser>("/admin/users", input);
  return res.data;
}

export type AdminExamRow = {
  id: string;
  createdAt: string;
  mode: "timed" | "practice";
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  user?: { id?: string; email?: string; name?: string; role?: string };
};

export async function adminExamsApi(input: { limit: number; skip: number }) {
  const res = await api.get<{ items: AdminExamRow[]; total: number }>("/admin/exams", { params: input });
  return res.data;
}

// Category & Topic Management
export type Category = { name: string; questionCount: number };
export type Topic = { name: string; questionCount: number };

export async function adminCategoriesApi() {
  const res = await api.get<Category[]>("/admin/categories");
  return res.data;
}

export async function adminTopicsApi() {
  const res = await api.get<Topic[]>("/admin/topics");
  return res.data;
}

export async function adminRenameCategoryApi(input: { oldName: string; newName: string }) {
  const res = await api.patch<{ message: string; updated: number }>("/admin/categories/rename", input);
  return res.data;
}

export async function adminRenameTopicApi(input: { oldName: string; newName: string }) {
  const res = await api.patch<{ message: string; updated: number }>("/admin/topics/rename", input);
  return res.data;
}

export async function adminDeleteCategoryApi(name: string) {
  const res = await api.delete<{ message: string; updated: number }>(`/admin/categories/${encodeURIComponent(name)}`);
  return res.data;
}

export async function adminDeleteTopicApi(name: string) {
  const res = await api.delete<{ message: string; updated: number }>(`/admin/topics/${encodeURIComponent(name)}`);
  return res.data;
}

// Increment Management
export type IncrementQuestion = {
  id: number;
  question: string;
  category?: string;
  topic?: string;
  status?: "draft" | "published";
  increment?: 1 | 2 | 3;
};

export type IncrementStats = {
  increment: 1 | 2 | 3;
  total: number;
  published: number;
  draft: number;
};

export async function adminIncrementQuestionsApi(increment: number) {
  const res = await api.get<IncrementQuestion[]>(`/admin/increments/${increment}/questions`);
  return res.data;
}

export async function adminIncrementStatsApi() {
  const res = await api.get<IncrementStats[]>("/admin/increments/stats");
  return res.data;
}

export async function adminAssignQuestionsApi(input: { increment: number; questionIds: number[] }) {
  const res = await api.patch<{ message: string; updated: number }>(
    `/admin/increments/${input.increment}/assign`,
    { questionIds: input.questionIds }
  );
  return res.data;
}

export async function adminReorderQuestionsApi(input: { increment: number; questionIds: number[] }) {
  const res = await api.patch<{ message: string; count: number }>(
    `/admin/increments/${input.increment}/reorder`,
    { questionIds: input.questionIds }
  );
  return res.data;
}

export async function adminLockIncrementApi(input: { increment: number; locked: boolean }) {
  const res = await api.patch<{ message: string; increment: number; locked: boolean }>(
    `/admin/increments/${input.increment}/lock`,
    { locked: input.locked }
  );
  return res.data;
}

// Exam Configuration
export type ExamConfig = {
  _id: string;
  name: string;
  description?: string;
  increments: number[];
  questionCount: number;
  timeLimitMinutes?: number;
  passMarkPercent: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function adminExamConfigsApi() {
  const res = await api.get<ExamConfig[]>("/admin/exam-configs");
  return res.data;
}

export async function adminExamConfigApi(id: string) {
  const res = await api.get<ExamConfig>(`/admin/exam-configs/${id}`);
  return res.data;
}

export async function adminCreateExamConfigApi(input: {
  name: string;
  description?: string;
  increments: number[];
  questionCount: number;
  timeLimitMinutes?: number;
  passMarkPercent: number;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  enabled?: boolean;
}) {
  const res = await api.post<ExamConfig>("/admin/exam-configs", input);
  return res.data;
}

export async function adminUpdateExamConfigApi(input: { id: string; data: Partial<ExamConfig> }) {
  const res = await api.put<ExamConfig>(`/admin/exam-configs/${input.id}`, input.data);
  return res.data;
}

export async function adminDeleteExamConfigApi(id: string) {
  const res = await api.delete<{ message: string }>(`/admin/exam-configs/${id}`);
  return res.data;
}

export async function adminPreviewExamConfigApi(id: string) {
  const res = await api.get<{
    config: ExamConfig;
    totalAvailable: number;
    previewQuestions: number;
    questions: Array<{ id: number; question: string; increment?: number; category?: string }>;
  }>(`/admin/exam-configs/${id}/preview`);
  return res.data;
}

// Enhanced User Management
export type AdminUserEnhanced = AdminUser & {
  active?: boolean;
  banned?: boolean;
  bannedReason?: string;
  bannedAt?: string;
};

export async function adminActivateUserApi(input: { userId: string; active: boolean }) {
  const res = await api.patch<AdminUserEnhanced>(`/admin/users/${input.userId}/activate`, { active: input.active });
  return res.data;
}

export async function adminBanUserApi(input: { userId: string; banned: boolean; reason?: string }) {
  const res = await api.patch<AdminUserEnhanced>(`/admin/users/${input.userId}/ban`, {
    banned: input.banned,
    reason: input.reason,
  });
  return res.data;
}

export async function adminResetUserPasswordApi(input: { userId: string; newPassword: string }) {
  const res = await api.post<{ message: string }>(`/admin/users/${input.userId}/reset-password`, {
    newPassword: input.newPassword,
  });
  return res.data;
}

export type UserProgress = {
  totalExams: number;
  totalQuestions: number;
  totalCorrect: number;
  averageAccuracy: number;
  recentExams: Array<{
    id: string;
    score: number;
    totalQuestions: number;
    accuracy: number;
    durationSeconds: number;
    mode: string;
    createdAt: string;
  }>;
};

export async function adminUserProgressApi(userId: string) {
  const res = await api.get<UserProgress>(`/admin/users/${userId}/progress`);
  return res.data;
}

export async function adminUserExamsApi(userId: string, limit?: number) {
  const res = await api.get<AdminExamRow[]>(`/admin/users/${userId}/exams`, { params: { limit } });
  return res.data;
}

// Analytics
export type AnalyticsOverview = {
  totalExams: number;
  passed: number;
  failed: number;
  passRate: number;
  averageAccuracy: number;
  mostFailedQuestions: Array<{
    questionId: number;
    missedCount: number;
    question?: string;
    category?: string;
    increment?: number;
  }>;
  averageByIncrement: Array<{
    increment: number;
    averageAccuracy: number;
    totalQuestions: number;
  }>;
};

export async function adminAnalyticsOverviewApi() {
  const res = await api.get<AnalyticsOverview>("/admin/analytics/overview");
  return res.data;
}

// Enhanced Overview
export type AdminOverviewEnhanced = AdminOverview & {
  questionsByIncrement: Array<{ increment: number; total: number; published: number }>;
  passRate: number;
  activeExamConfigs: number;
};

// System Settings
export type SystemSettings = {
  _id?: string;
  systemName: string;
  logoUrl?: string;
  examRules?: string;
  passingCriteria?: number;
  questionRandomization: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function adminGetSettingsApi() {
  const res = await api.get<SystemSettings>("/admin/settings");
  return res.data;
}

export async function adminUpdateSettingsApi(data: Partial<SystemSettings>) {
  const res = await api.put<SystemSettings>("/admin/settings", data);
  return res.data;
}

// Bulk Import
export async function adminBulkImportQuestionsApi(questions: any[]) {
  const res = await api.post<{ inserted: number }>("/questions/bulk", questions);
  return res.data;
}

