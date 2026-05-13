import api from './api'

export const register = async (userData) => {
	const { data } = await api.post('/auth/register', userData)
	
	// Store API key if registration successful
	if (data.success && data.data.api_key) {
		localStorage.setItem('api_key', data.data.api_key)
		localStorage.setItem('user', JSON.stringify(data.data.user))
	}
	
	return data
}

export const login = async (email, password) => {
	const { data } = await api.post('/auth/login', { email, password })
	
	// Store API key if login successful
	if (data.success) {
		if (data.data.api_key) {
			localStorage.setItem('api_key', data.data.api_key)
		}
		localStorage.setItem('user', JSON.stringify(data.data.user))
	}
	
	return data
}

export const logout = () => {
	localStorage.removeItem('api_key')
	localStorage.removeItem('user')
}

export const getUser = () => {
	const user = localStorage.getItem('user')
	return user ? JSON.parse(user) : null
}

export const getApiKey = () => {
	return localStorage.getItem('api_key')
}

export const isAuthenticated = () => {
	return !!localStorage.getItem('api_key')
}
