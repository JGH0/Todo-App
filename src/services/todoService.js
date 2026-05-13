import {
	getTodos as apiGetTodos,
	createTodo as apiCreateTodo,
	updateTodo as apiUpdateTodo,
	deleteTodo as apiDeleteTodo,
} from './apiService'
import { getCategories, createCategory } from './categoryService'

// Resolve category names to a single category ID.
// If a category name doesn't exist yet, create it first.
async function resolveCategoryId(categories) {
	if (!categories || !Array.isArray(categories) || categories.length === 0) {
		return null
	}

	// Take only the first category for the backend (junction table format)
	const categoryName = categories[0].trim()
	if (!categoryName) return null

	// Load existing categories to find name -> ID mapping
	const existingCategories = await getCategories()
	const match = existingCategories.find(
		(cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
	)

	if (match) {
		return match.id
	}

	// Category doesn't exist yet — create it
	try {
		const newCategory = await createCategory({
			name: categoryName,
			color: '#3B82F6',
			favorite: false,
		})
		return newCategory.id
	} catch (error) {
		console.error("Failed to create category '" + categoryName + "':", error)
		return null
	}
}

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
	if (!categoryId) return data

	// categoryId now matched against the categoryIds array field
	const filtered = data.filter((todo) => {
		if (todo.categoryIds) {
			const ids = todo.categoryIds.split(",").map((id) => id.trim())
			return ids.includes(String(categoryId))
		}
		return false
	})
	return filtered.sort((a, b) => {
		const dateA = new Date(a.created_at || a.createdAt)
		const dateB = new Date(b.created_at || b.createdAt)
		return dateB - dateA
	})
}

export const createTodo = async (todo) => {
	// Resolve category names to a backend category_id
	const categoryId = await resolveCategoryId(todo.categories)

	const payload = {
		title: todo.title,
		description: todo.description,
		status: todo.status,
		dueDate: todo.dueDate,
		dueTime: todo.dueTime,
		syncEnabled: todo.syncEnabled,
		reminderEnabled: todo.reminderEnabled,
		recurringEnabled: todo.recurringEnabled,
		projectId: todo.projectId,
		categoryId: categoryId,
	}

	return apiCreateTodo(payload)
}

export const updateTodo = async (id, todo) => {
	// Resolve category names to a backend category_id
	let categoryId = todo.categoryId
	if (todo.categories && Array.isArray(todo.categories)) {
		categoryId = await resolveCategoryId(todo.categories)
	}

	const payload = {
		title: todo.title,
		description: todo.description,
		status: todo.status,
		dueDate: todo.dueDate,
		dueTime: todo.dueTime,
		syncEnabled: todo.syncEnabled,
		reminderEnabled: todo.reminderEnabled,
		recurringEnabled: todo.recurringEnabled,
		projectId: todo.projectId,
		categoryId: categoryId,
	}

	return apiUpdateTodo(id, payload)
}

export const deleteTodo = async (id) => {
	return apiDeleteTodo(id)
}
