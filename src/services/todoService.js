import api from '@/services/api'

export const getTodos = async () => {
	const { data } = await api.get('/todos')
	return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const getTodo = async (id) => {
	const { data } = await api.get(`/todos/${id}`)
	return data
}

export const getTodosByCategory = async (categoryId) => {
	const { data } = await api.get('/todos')
	const filtered = categoryId ? data.filter(todo => todo.categoryId == categoryId) : data
	return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const createTodo = async (todo) => {
	const { data } = await api.post('/todos', todo)
	return data
}

export const updateTodo = async (id, todo) => {
	const { data } = await api.put(`/todos/${id}`, todo)
	return data
}

export const deleteTodo = async (id) => {
	await api.delete(`/todos/${id}`)
}