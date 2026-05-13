import axios from 'axios'

const api = axios.create({
	baseURL: 'http://localhost:8080/api/v1',
	headers: {
		'Content-Type': 'application/json',
	},
})

// Add API key from localStorage if available
api.interceptors.request.use((config) => {
	const apiKey = localStorage.getItem('api_key')
	if (apiKey) {
		config.headers['X-API-Key'] = apiKey
	}
	return config
})

export default api