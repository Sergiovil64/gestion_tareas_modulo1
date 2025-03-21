import axios from "axios";
import { Task } from "../pages/Task.interface";

const API_URL = "http://localhost:3000/api/tasks";

export const getTasks = async (token: string, params: URLSearchParams) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};

export const createTask = async (token: string, task: Task) => {
  const response = await axios.post(API_URL, task, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateTask = async (token: string, task: Task) => {
  const response = await axios.put(`${API_URL}/${task.id}`, task, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteTask = async (token: string, task: Task) => {
  const response = await axios.delete(`${API_URL}/${task.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};