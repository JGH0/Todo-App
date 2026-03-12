<script setup>
import { computed } from 'vue'

const props = defineProps({
	category: {
		type: String,
		default: null
	}
})

// Dummy todo data
const todos = [
	{
		id: 1,
		title: 'Buy groceries',
		description: 'Milk, bread, eggs, and coffee',
		dueDate: '2026-03-15',
		dueTime: '18:00',
		status: 'open',
		categories: ['Home', 'Personal']
	},
	{
		id: 2,
		title: 'Finish project report',
		description: 'Write summary and add charts',
		dueDate: '2026-03-14',
		dueTime: '12:00',
		status: 'open',
		categories: ['Work']
	},
	{
		id: 3,
		title: 'Call mom',
		description: 'Wish her happy birthday',
		dueDate: '2026-03-13',
		dueTime: '10:00',
		status: 'done',
		categories: ['Personal']
	},
	{
		id: 4,
		title: 'Schedule team meeting',
		description: 'Find a time that works for everyone',
		dueDate: '2026-03-16',
		dueTime: '09:00',
		status: 'open',
		categories: ['Work']
	},
	{
		id: 5,
		title: 'Clean the garage',
		description: 'Sort and donate old items',
		dueDate: '2026-03-20',
		dueTime: null,
		status: 'open',
		categories: ['Home']
	}
]

// Filter todos based on the provided category
const filteredTodos = computed(() => {
	if (!props.category) return todos
	return todos.filter(todo => todo.categories.includes(props.category))
})
</script>

<template>
	<div class="card todo-list-view">
		<div class="card-header">
			<div>
				<p class="eyebrow">Todos</p>
				<h2 v-if="category">{{ category }} Tasks</h2>
				<h2 v-else>All Tasks</h2>
			</div>
		</div>

		<div v-if="filteredTodos.length === 0" class="empty-state">
			<p>No todos found for this category.</p>
		</div>

		<ul v-else class="todo-list">
			<li v-for="todo in filteredTodos" :key="todo.id" class="todo-item">
				<div class="todo-item-header">
					<strong>{{ todo.title }}</strong>
					<span class="status-pill" :data-status="todo.status">
						{{ todo.status === 'open' ? 'Offen' : 'Erledigt' }}
					</span>
				</div>
				<p>{{ todo.description }}</p>
				<div class="todo-meta-row">
					<span v-if="todo.dueDate" class="meta-chip">
						📅 {{ todo.dueDate }} <span v-if="todo.dueTime">⏰ {{ todo.dueTime }}</span>
					</span>
					<span v-for="cat in todo.categories" :key="cat" class="category-chip">
						{{ cat }}
					</span>
				</div>
			</li>
		</ul>
	</div>
</template>

<style scoped>
/* Reuse existing styles from the form; these are just supplements */
.todo-list-view {
	background: var(--surface);
	backdrop-filter: blur(12px);
}

.todo-list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: grid;
	gap: 14px;
}

.todo-item {
	padding: 16px;
	border-radius: 18px;
	background: #f8f8f6;
	border: 1px solid #e2e2de;
}

.todo-item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
}

.todo-item p {
	margin: 0 0 10px 0;
	color: var(--text-muted);
}

.todo-meta-row {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	align-items: center;
}

.meta-chip,
.category-chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border-radius: 0;
	background: var(--chip);
	border: 1px solid var(--border);
	padding: 6px 12px;
	font-size: 0.9rem;
}

.status-pill {
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 0.85rem;
	font-weight: 500;
}

.status-pill[data-status='open'] {
	background: #fff1bf;
	color: #785d00;
}

.status-pill[data-status='done'] {
	background: #d7f8df;
	color: #19643a;
}

.empty-state {
	padding: 40px 20px;
	text-align: center;
	color: var(--text-muted);
	background: rgba(255,255,255,0.4);
	border-radius: 18px;
}
</style>