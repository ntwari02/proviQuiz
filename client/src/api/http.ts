import axios from "axios";
import { readAuthToken } from "../auth/authStorage";

export const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any;
    const msg =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      (typeof err.message === "string" && err.message);
    return msg || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

