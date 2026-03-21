<script setup>
const props = defineProps({
	title: {
		type: String,
		required: true,
	},
	todos: {
		type: Array,
		default: () => [],
	},
	categoryMap: {
		type: Object,
		default: () => ({}),
	},
	onToggleStatus: {
		type: Function,
		default: null,
	},
	onDeleteTodo: {
		type: Function,
		default: null,
	},
})

const statusLabels = {
	open: 'Offen',
	done: 'Erledigt',
}
</script>

<template>
	<section class="card">
		<div class="card-header">
			<div>
				<p class="eyebrow">Uebersicht</p>
				<h2>{{ title }}</h2>
			</div>
			<span class="badge">{{ todos.length }} Eintraege</span>
		</div>

		<ul v-if="todos.length" class="todo-list">
			<li v-for="todo in todos" :key="todo.id" class="todo-item">
				<div class="todo-item-header">
					<strong>{{ todo.title }}</strong>
					<span class="status-pill" :data-status="todo.status">
						{{ statusLabels[todo.status] || todo.status }}
					</span>
				</div>
				<p v-if="todo.description">{{ todo.description }}</p>
				<div v-if="todo.categoryId" class="todo-meta-row">
					<span class="meta-chip">
						{{ props.categoryMap[todo.categoryId] || `Kategorie #${todo.categoryId}` }}
					</span>
				</div>
				<div v-if="todo.dueDate || todo.dueTime" class="todo-meta-row">
					<small v-if="todo.dueDate">Datum: {{ todo.dueDate }}</small>
					<small v-if="todo.dueTime">Zeit: {{ todo.dueTime }}</small>
				</div>
				<div
					v-if="todo.syncEnabled || todo.reminderEnabled || todo.recurringEnabled"
					class="todo-meta-row"
				>
					<small v-if="todo.syncEnabled">Sync</small>
					<small v-if="todo.reminderEnabled">Erinnerung</small>
					<small v-if="todo.recurringEnabled">Wiederholend</small>
				</div>
				<small v-if="todo.projectId">Projektbezug: {{ todo.projectId }}</small>
				<div class="todo-item-actions">
					<button v-if="onToggleStatus" class="ghost-button" type="button" @click="onToggleStatus(todo.id)">
						{{ todo.status === 'done' ? 'Als offen markieren' : 'Als erledigt markieren' }}
					</button>
					<button v-if="onDeleteTodo" class="ghost-button ghost-button-danger" type="button" @click="onDeleteTodo(todo.id)">
						Loeschen
					</button>
				</div>
			</li>
		</ul>

		<p v-else class="empty-state">Noch keine Todos vorhanden.</p>
	</section>
</template>