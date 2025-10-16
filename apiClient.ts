import axios from "axios";
import { getApiUrl } from "./lib/apiUrl";

// Create Axios instances
const apiClient = axios.create({
  baseURL: getApiUrl(),
});

export const apiFormClient = axios.create({
  baseURL: getApiUrl(),
});
export default apiClient;
