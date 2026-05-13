import {
	getCategories as apiGetCategories,
	createCategory as apiCreateCategory,
	updateCategory as apiUpdateCategory,
	deleteCategory as apiDeleteCategory,
} from './apiService'

export const getCategories = async () => {
	const data = await apiGetCategories()
	return data.sort((a, b) => a.name.localeCompare(b.name))
}

export const createCategory = async (category) => {
	return apiCreateCategory(category)
}

export const updateCategory = async (id, category) => {
	return apiUpdateCategory(id, category)
}

export const deleteCategory = async (id) => {
	return apiDeleteCategory(id)
}