import api from '@/services/api'

export const getTodos = async () => {
  const { data } = await api.get('/todos', {
    params: {
      _sort: 'createdAt',
      _order: 'desc',
    },
  })

  return data
}

export const getTodo = async (id) => {
  const { data } = await api.get(`/todos/${id}`)
  return data
}

export const getTodosByCategory = async (categoryId) => {
  const { data } = await api.get('/todos', {
    params: {
      categoryId,
      _sort: 'createdAt',
      _order: 'desc',
    },
  })

  return data
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
