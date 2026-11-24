import api from "./axios";
import { User } from "../types";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  accept_terms: boolean;
}

export const loginApi = async (credentials: LoginCredentials): Promise<User> => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const registerApi = async (data: RegisterData): Promise<User> => {
  const response = await api.post<User>("/auth/register", data);
  return response.data;
};
