import api from '@/services/api'

export const getCategories = async () => {
  const { data } = await api.get('/categories')
  return data.sort((a, b) => a.name.localeCompare(b.name))
}

export const createCategory = async (category) => {
  const { data } = await api.post('/categories', category)
  return data
}

export const updateCategory = async (id, category) => {
  const { data } = await api.put(`/categories/${id}`, category)
  return data
}

export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`)
}