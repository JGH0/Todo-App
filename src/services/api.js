import axios from "axios";
import { loadBackendUrl } from "@/utils/backendSettings";

const api = axios.create({
	baseURL: loadBackendUrl(),
	headers: {
		"Content-Type": "application/json",
	},
});

// Allow runtime URL updates without recreating the instance
export function updateApiBaseUrl(newUrl) {
	api.defaults.baseURL = newUrl;
}

// Add API key from localStorage if available
api.interceptors.request.use((config) => {
	const apiKey = localStorage.getItem("api_key");
	if (apiKey) {
		config.headers["X-API-Key"] = apiKey;
	}
	return config;
});

export default api;
