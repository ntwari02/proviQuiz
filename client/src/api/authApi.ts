import { api, API_BASE_URL } from "./http";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: "student" | "admin" | "superadmin" | string;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export async function registerApi(input: { email: string; password: string; name?: string }) {
  const res = await api.post<AuthResponse>("/auth/register", input);
  return res.data;
}

export async function loginApi(input: { email: string; password: string }) {
  const res = await api.post<AuthResponse>("/auth/login", input);
  return res.data;
}

export async function meApi() {
  const res = await api.get<AuthUser>("/auth/me");
  return res.data;
}

export type ForgotPasswordResponse = {
  message: string;
  resetToken?: string;
  expiresAt?: string;
};

export async function forgotPasswordApi(input: { email: string }) {
  const res = await api.post<ForgotPasswordResponse>("/auth/forgot-password", input);
  return res.data;
}

export async function resetPasswordApi(input: { token: string; newPassword: string }) {
  const res = await api.post<{ message: string }>("/auth/reset-password", input);
  return res.data;
}

// Google OAuth helpers
export function getGoogleOAuthUrl(redirect?: string) {
  // Append redirect path so the backend can send you back where you intended
  const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
  return `${API_BASE_URL}/auth/google${redirectParam}`;
}

export function startGoogleOAuth(redirect?: string) {
  window.location.href = getGoogleOAuthUrl(redirect);
}
