import axios from "axios";
import { useSession } from "../store/session";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://stage-cqe9.onrender.com/api"
});

api.interceptors.request.use((config) => {
  const token = useSession.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
