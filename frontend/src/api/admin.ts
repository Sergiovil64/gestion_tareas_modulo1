import axios from "axios";
import { User, SystemStats } from "../pages/Task.interface";

const API_URL = "https://gestion-tareas-modulo1.onrender.com/api/admin";

export const getAllUsers = async (token: string): Promise<{ users: User[], count: number }> => {
  const response = await axios.get(`${API_URL}/users`, {
    headers: {Authorization: `Bearer ${token}`}
  });
  return response.data;
};

export const getSystemStats = async (token: string): Promise<SystemStats> => {
  const response = await axios.get(`${API_URL}/stats`, {
    headers: {Authorization: `Bearer ${token}`}
  });
  return response.data;
};

export const updateUserRole = async (token: string, userId: number, role: string) => {
  const response = await axios.put(
    `${API_URL}/users/${userId}/role`, 
    { role }, 
    {headers: {Authorization: `Bearer ${token}`}}
  );
  return response.data;
};

export const toggleUserStatus = async (token: string, userId: number) => {
  const response = await axios.put(
    `${API_URL}/users/${userId}/toggle-status`, 
    {}, 
    {headers: {Authorization: `Bearer ${token}`}}
  );
  return response.data;
};

