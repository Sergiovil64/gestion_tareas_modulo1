import axios from "axios";
import { Task } from "../pages/Task.interface";

const API_URL = "http://localhost:3000/api/tasks";

export const getTasks = async (params: URLSearchParams) => {
  const response = await axios.get(API_URL, {
    params,
    withCredentials: true
  });
  return response.data;
};

export const createTask = async (task: Task) => {
  const response = await axios.post(API_URL, task, {
    withCredentials: true
  });
  return response.data;
};

export const updateTask = async (task: Task) => {
  const response = await axios.put(`${API_URL}/${task.id}`, task, {
    withCredentials: true
  });
  return response.data;
};

export const deleteTask = async (task: Task) => {
  const response = await axios.delete(`${API_URL}/${task.id}`, {
    withCredentials: true
  });
  return response.data;
};