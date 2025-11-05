import axios from "axios";
import { Task } from "../pages/Task.interface";

const API_URL = "https://gestion-tareas-modulo1.onrender.com/api/tasks";

export const getTasks = async (token: string, params: URLSearchParams) => {
  const response = await axios.get(API_URL, {
    params,
    headers: {Authorization: `Bearer ${token}`}
  });
  return response.data.tasks || response.data;
};

export const getTask = async (token: string, id: number) => {
  const response = await axios.get(`${API_URL}/${id}`, {
    headers: {Authorization: `Bearer ${token}`}
  });
  return response.data.task;
};

export const createTask = async (token: string, task: Task) => {
  const response = await axios.post(API_URL, task, {headers: {Authorization: `Bearer ${token}`}});
  return response.data;
};

export const updateTask = async (token: string, task: Task) => {
  const response = await axios.put(`${API_URL}/${task.id}`, task, {headers: {Authorization: `Bearer ${token}`}});
  return response.data;
};

export const deleteTask = async (token: string, task: Task) => {
  const response = await axios.delete(`${API_URL}/${task.id}`, {headers: {Authorization: `Bearer ${token}`}});
  return response.data;
};