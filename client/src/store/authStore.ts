import { create } from "zustand";
import type { AuthResponse, AuthUser } from "../api/authApi";
import { meApi } from "../api/authApi";
import { clearAuthToken, readAuthToken, readStoredUser, writeAuthToken, writeStoredUser } from "../auth/authStorage";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  bootstrapped: boolean;
};

type AuthActions = {
  bootstrap: () => Promise<void>;
  setAuth: (auth: AuthResponse, rememberMe: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  token: null,
  user: null,
  bootstrapped: false,

  bootstrap: async () => {
    const token = readAuthToken();
    const storedUser = readStoredUser();

    set({
      token,
      user: storedUser as AuthUser | null,
      bootstrapped: false,
    });

    if (!token) {
      set({ token: null, user: null, bootstrapped: true });
      return;
    }

    try {
      const me = await meApi();
      writeStoredUser(me);
      set({ token, user: me, bootstrapped: true });
    } catch {
      clearAuthToken();
      writeStoredUser(null);
      set({ token: null, user: null, bootstrapped: true });
    }
  },

  setAuth: (auth, rememberMe) => {
    writeAuthToken(auth.token, rememberMe);
    writeStoredUser(auth.user);
    set({ token: auth.token, user: auth.user, bootstrapped: true });
  },

  setUser: (user) => {
    writeStoredUser(user);
    set({ user });
  },

  logout: () => {
    clearAuthToken();
    writeStoredUser(null);
    set({ token: null, user: null, bootstrapped: true });
  },
}));

export function isAuthed(state: Pick<AuthState, "token">) {
  return Boolean(state.token);
}

