import axios from "axios";
// Create Axios instances
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
});
// Create Axios instances
export const apiFormClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL|| "http://localhost:5001/api",
});
export default apiClient;
