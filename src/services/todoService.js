import {
	getTodos as apiGetTodos,
	createTodo as apiCreateTodo,
	updateTodo as apiUpdateTodo,
	deleteTodo as apiDeleteTodo,
} from './apiService'

export const getTodos = async () => {
	const data = await apiGetTodos()
	return data.sort((a, b) => {
		const dateA = new Date(a.created_at || a.createdAt)
		const dateB = new Date(b.created_at || b.createdAt)
		return dateB - dateA
	})
}

export const getTodo = async (id) => {
	const todos = await getTodos()
	return todos.find((todo) => todo.id === id)
}

export const getTodosByCategory = async (categoryId) => {
	const data = await getTodos()
	const filtered = categoryId ? data.filter((todo) => todo.categoryId == categoryId) : data
	return filtered.sort((a, b) => {
		const dateA = new Date(a.created_at || a.createdAt)
		const dateB = new Date(b.created_at || b.createdAt)
		return dateB - dateA
	})
}

export const createTodo = async (todo) => {
	return apiCreateTodo(todo)
}

export const updateTodo = async (id, todo) => {
	return apiUpdateTodo(id, todo)
}

export const deleteTodo = async (id) => {
	return apiDeleteTodo(id)
}