import api from '@/services/api'

export const getRecurringTasks = async () => {
	const { data } = await api.get('/recurringTasks')
	return data
}

export const getRecurringTask = async (id) => {
	const { data } = await api.get(`/recurringTasks/${id}`)
	return data
}

export const createRecurringTask = async (task) => {
	const { data } = await api.post('/recurringTasks', task)
	return data
}

export const updateRecurringTask = async (id, task) => {
	const { data } = await api.put(`/recurringTasks/${id}`, task)
	return data
}

export const deleteRecurringTask = async (id) => {
	await api.delete(`/recurringTasks/${id}`)
}