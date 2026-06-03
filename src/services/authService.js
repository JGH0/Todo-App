import api from './api'

export const register = async (userData) => {
	const { data } = await api.post('/auth/register', userData)

	if (data.success && data.data.api_key) {
		localStorage.setItem('api_key', data.data.api_key)
		localStorage.setItem('key_prefix', data.data.key_prefix || '')
		localStorage.setItem('user', JSON.stringify(data.data.user))
	}

	return data
}

export const login = async (email, password) => {
	const { data } = await api.post('/auth/login', { email, password })

	if (data.success) {
		// When login reuses an existing key, the backend returns
		// api_key_prefix but NOT api_key. Store whatever we get.
		if (data.data.api_key) {
			localStorage.setItem('api_key', data.data.api_key)
		}
		if (data.data.key_prefix) {
			localStorage.setItem('key_prefix', data.data.key_prefix)
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
