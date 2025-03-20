import axios from "axios";

const API_URL = "http://localhost:3000/api/tasks";

export const getTasks = async (token: string, params: URLSearchParams) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};