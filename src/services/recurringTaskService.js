import api from '@/services/api'

// Transform backend response to frontend format
const transformRecurringTask = (task) => {
	return {
		...task,
		customDays: task.custom_days || [],
		categories: task.categories?.map(cat => cat.name) || []
	}
}

// Transform frontend format to backend format
const transformToBackend = (task) => {
	return {
		...task,
		custom_days: task.customDays || [],
		// Backend expects category IDs, but frontend sends names
		// This will need to be adjusted based on how the backend handles it
		categories: task.categories || []
	}
}

export const getRecurringTasks = async () => {
	const { data } = await api.get('/recurring-tasks')
	const tasks = data.data || data
	return tasks.map(transformRecurringTask)
}

export const getRecurringTask = async (id) => {
	const { data } = await api.get(`/recurring-tasks/${id}`)
	const task = data.data || data
	return transformRecurringTask(task)
}

export const createRecurringTask = async (task) => {
	const { data } = await api.post('/recurring-tasks', transformToBackend(task))
	const created = data.data || data
	return transformRecurringTask(created)
}

export const updateRecurringTask = async (id, task) => {
	const { data } = await api.put(`/recurring-tasks/${id}`, transformToBackend(task))
	const updated = data.data || data
	return transformRecurringTask(updated)
}

export const deleteRecurringTask = async (id) => {
	await api.delete(`/recurring-tasks/${id}`)
}