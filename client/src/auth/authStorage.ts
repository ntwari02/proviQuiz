const LOCAL_TOKEN_KEY = "proviquiz:authToken";
const SESSION_TOKEN_KEY = "proviquiz:authToken:session";
const USER_KEY = "proviquiz:authUser";

export type StoredAuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: string;
};

export function readAuthToken(): string | null {
  return localStorage.getItem(LOCAL_TOKEN_KEY) ?? sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function writeAuthToken(token: string, rememberMe: boolean) {
  clearAuthToken();
  if (rememberMe) localStorage.setItem(LOCAL_TOKEN_KEY, token);
  else sessionStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(LOCAL_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

export function readStoredUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAuthUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredUser(user: StoredAuthUser | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

