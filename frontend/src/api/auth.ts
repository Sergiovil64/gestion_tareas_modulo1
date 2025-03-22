import axios from "axios";

const API_URL = "https://gestion-tareas-modulo1.onrender.com/api/auth";

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};

export const register = async (name: string, email: string, password: string) => {
  const response = await axios.post(`${API_URL}/register`, { name, email, password });
  return response.data;
};

export const currentUser = async () => {
  const response = await axios.get(`${API_URL}/me`, {
    withCredentials: true
  });
  return response.data.user;
};

export const logout = async () => {
  const response = await axios.get(`${API_URL}/me`, {
    withCredentials: true
  });
  return response.data.user;
};