import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject bearer token dynamically
api.interceptors.request.use(
  async (config) => {
    try {
      if (typeof window !== "undefined") {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.warn("Axios auth interceptor: session fetch failed", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);