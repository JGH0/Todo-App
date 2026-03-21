<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import TodoCreateForm from '@/components/TodoCreateForm.vue'
import TodoList from '@/components/TodoList.vue'
import { useTodoStore } from '@/stores/todos'

const route = useRoute()
const todoStore = useTodoStore()
const lastCreatedTitle = ref('')

const projectId = computed(() => route.params.projectId)
const projectTodos = computed(() => todoStore.getTodosByProject(projectId.value))
const categories = computed(() => todoStore.categoryOptions)
const categoryMap = computed(() => todoStore.categoryMap)

onMounted(async () => {
	await todoStore.initialize()
	await todoStore.applyCategoryFilter('')
})

const handleCreateProjectTodo = async (payload) => {
	const createdTodo = await todoStore.createTodo(payload)
	lastCreatedTitle.value = createdTodo.title
	return createdTodo
}
</script>

<template>
	<section class="view-grid">
		<TodoCreateForm
			:project-id="projectId"
			heading="Projektbezogenes Todo erstellen"
			submit-label="Projekt-Todo speichern"
			:categories="categories"
			:create-category="todoStore.createCategory"
			:submit-todo="handleCreateProjectTodo"
			@created="lastCreatedTitle = $event.title"
		/>

		<div class="stack">
			<section class="card project-card">
				<p class="eyebrow">Projektkontext</p>
				<h2>{{ projectId }}</h2>
				<p>
					Todos werden fuer dieses Projekt geladen und ueber dieselbe API-basierte
					Formular-Komponente gespeichert.
				</p>
			</section>

			<section v-if="todoStore.error" class="error-banner">
				{{ todoStore.error }}
			</section>

			<section v-if="lastCreatedTitle" class="success-banner">
				"{{ lastCreatedTitle }}" wurde dem Projekt hinzugefuegt.
			</section>

			<TodoList
				:title="`Todos fuer ${projectId}`"
				:todos="projectTodos"
				:category-map="categoryMap"
				:on-toggle-status="todoStore.toggleTodoStatus"
				:on-delete-todo="todoStore.deleteTodo"
			/>
		</div>
	</section>
</template>