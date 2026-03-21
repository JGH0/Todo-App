<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
	heading: {
		type: String,
		default: 'Neues Todo erstellen',
	},
	submitLabel: {
		type: String,
		default: 'Todo speichern',
	},
	projectId: {
		type: [String, Number],
		default: null,
	},
	initialStatus: {
		type: String,
		default: 'open',
	},
	categories: {
		type: Array,
		default: () => [],
	},
	createCategory: {
		type: Function,
		default: null,
	},
	submitTodo: {
		type: Function,
		default: null,
	},
})

const emit = defineEmits(['cancel', 'create', 'created'])

const form = reactive({
	title: '',
	description: '',
	status: props.initialStatus,
	categoryId: '',
	categoryInput: '',
	dueDate: '',
	dueTime: '',
	syncEnabled: false,
	reminderEnabled: false,
	recurringEnabled: false,
})

const errors = reactive({
	title: '',
	dueDate: '',
	dueTime: '',
	submit: '',
})

const isSubmitting = ref(false)
const normalizedStatus = computed(() => (form.status === 'done' ? 'Erledigt' : 'Offen'))
const selectedCategory = computed(() =>
	props.categories.find((category) => String(category.id) === String(form.categoryId)) || null,
)

watch(
	() => props.initialStatus,
	(status) => {
		form.status = status
	},
)

watch(
	() => props.categories,
	(categories) => {
		if (!categories.some((category) => String(category.id) === String(form.categoryId))) {
			form.categoryId = ''
		}
	},
	{ deep: true },
)

const resetForm = () => {
	form.title = ''
	form.description = ''
	form.status = props.initialStatus
	form.categoryId = ''
	form.categoryInput = ''
	form.dueDate = ''
	form.dueTime = ''
	form.syncEnabled = false
	form.reminderEnabled = false
	form.recurringEnabled = false
	errors.title = ''
	errors.dueDate = ''
	errors.dueTime = ''
	errors.submit = ''
}

const validate = () => {
	errors.title = form.title.trim() ? '' : 'Bitte gib einen Titel fuer das Todo ein.'
	errors.dueDate = form.dueTime && !form.dueDate ? 'Waehle ein Datum, wenn du eine Uhrzeit angibst.' : ''
	errors.dueTime = form.reminderEnabled && !form.dueTime ? 'Fuer eine Erinnerung wird eine Uhrzeit benoetigt.' : ''
	return !errors.title && !errors.dueDate && !errors.dueTime
}

const toggleStatus = () => {
	form.status = form.status === 'open' ? 'done' : 'open'
}

const handleCreateCategory = async () => {
	if (!props.createCategory) {
		return
	}

	try {
		const category = await props.createCategory(form.categoryInput)
		form.categoryId = String(category.id)
		form.categoryInput = ''
	} catch (error) {
		errors.submit = error instanceof Error ? error.message : 'Kategorie konnte nicht erstellt werden.'
	}
}

const handleSubmit = async () => {
	errors.submit = ''

	if (!validate()) {
		return
	}

	const payload = {
		title: form.title,
		description: form.description,
		status: form.status,
		categoryId: form.categoryId || null,
		dueDate: form.dueDate || null,
		dueTime: form.dueTime || null,
		syncEnabled: form.syncEnabled,
		reminderEnabled: form.reminderEnabled,
		recurringEnabled: form.recurringEnabled,
		projectId: props.projectId,
	}

	try {
		isSubmitting.value = true

		let createdTodo = null

		if (props.submitTodo) {
			createdTodo = await props.submitTodo(payload)
		} else {
			emit('create', payload)
			createdTodo = payload
		}

		resetForm()
		emit('created', createdTodo)
	} catch (error) {
		errors.submit = error instanceof Error ? error.message : 'Todo konnte nicht erstellt werden.'
	} finally {
		isSubmitting.value = false
	}
}
</script>

<template>
	<form class="todo-form card" @submit.prevent="handleSubmit" novalidate>
		<div class="todo-form-header">
			<button class="icon-button" type="button" aria-label="Formular zuruecksetzen" @click="resetForm">
				<span aria-hidden="true">✕</span>
			</button>
			<div class="todo-form-heading">
				<p class="eyebrow">Todo Form</p>
				<h2>{{ heading }}</h2>
			</div>
			<button class="icon-button icon-button-primary" type="submit" :disabled="isSubmitting" :aria-label="submitLabel">
				<span aria-hidden="true">✓</span>
			</button>
		</div>

		<div class="todo-form-grid">
			<section class="todo-form-main">
				<label class="field field-title">
					<span class="field-label">Titel *</span>
					<div class="input-line">
						<input
							v-model="form.title"
							type="text"
							name="title"
							placeholder="Einkaufen"
							:aria-invalid="Boolean(errors.title)"
						>
						<button class="inline-icon-button" type="button" aria-label="Status umschalten" @click="toggleStatus">
							{{ normalizedStatus }}
						</button>
					</div>
					<small v-if="errors.title" class="error">{{ errors.title }}</small>
				</label>

				<label class="field">
					<span class="field-label">Beschreibung</span>
					<textarea
						v-model="form.description"
						name="description"
						rows="4"
						placeholder="Optional: Details, Notizen oder Akzeptanzkriterien"
					/>
				</label>

				<section class="field">
					<span class="field-label">Kategorien</span>

					<div v-if="categories.length" class="category-list">
						<button
							v-for="category in categories"
							:key="category.id"
							type="button"
							class="category-chip"
							:class="{ 'category-chip-active': String(category.id) === String(form.categoryId) }"
							@click="form.categoryId = String(category.id)"
						>
							{{ category.name }}
						</button>
					</div>

					<p v-if="selectedCategory" class="field-hint">
						Aktiv: {{ selectedCategory.name }}
					</p>

					<div class="input-line">
						<input
							v-model="form.categoryInput"
							type="text"
							name="category"
							placeholder="Neue Kategorie hinzufuegen"
							@keydown.enter.prevent="handleCreateCategory"
						>
						<button class="inline-icon-button" type="button" @click="handleCreateCategory">
							Hinzufuegen
						</button>
					</div>
				</section>

				<div class="todo-form-split">
					<label class="field">
						<span class="field-label">Datum</span>
						<div class="input-line">
							<input v-model="form.dueDate" type="date" name="dueDate">
							<span class="inline-icon" aria-hidden="true">📅</span>
						</div>
						<small v-if="errors.dueDate" class="error">{{ errors.dueDate }}</small>
					</label>

					<label class="field">
						<span class="field-label">Zeit</span>
						<div class="input-line">
							<input v-model="form.dueTime" type="time" name="dueTime">
							<span class="inline-icon" aria-hidden="true">⏰</span>
						</div>
						<small v-if="errors.dueTime" class="error">{{ errors.dueTime }}</small>
					</label>
				</div>
			</section>

			<aside class="todo-form-side">
				<div v-if="projectId" class="project-context">
					<span class="field-label">Projekt</span>
					<strong>{{ projectId }}</strong>
				</div>

				<label class="toggle-row">
					<span class="toggle-copy">
						<strong>Sync</strong>
						<small>Synchronisierung aktivieren</small>
					</span>
					<input v-model="form.syncEnabled" class="toggle-input" type="checkbox" name="syncEnabled">
					<span class="toggle-ui" aria-hidden="true" />
				</label>

				<label class="toggle-row">
					<span class="toggle-copy">
						<strong>Erinnerung</strong>
						<small>Benachrichtigung zum Termin</small>
					</span>
					<input v-model="form.reminderEnabled" class="toggle-input" type="checkbox" name="reminderEnabled">
					<span class="toggle-ui" aria-hidden="true" />
				</label>

				<label class="toggle-row">
					<span class="toggle-copy">
						<strong>Wiederholen</strong>
						<small>Wiederkehrende Aufgabe markieren</small>
					</span>
					<input v-model="form.recurringEnabled" class="toggle-input" type="checkbox" name="recurringEnabled">
					<span class="toggle-ui" aria-hidden="true" />
				</label>

				<label class="field">
					<span class="field-label">Status</span>
					<select v-model="form.status" name="status">
						<option value="open">Offen</option>
						<option value="done">Erledigt</option>
					</select>
				</label>
			</aside>
		</div>

		<p v-if="errors.submit" class="error">{{ errors.submit }}</p>

		<div class="actions">
			<button class="primary-button" type="submit" :disabled="isSubmitting">
				{{ isSubmitting ? 'Wird gespeichert...' : submitLabel }}
			</button>
			<button class="ghost-button" type="button" @click="$emit('cancel')">
				Abbrechen
			</button>
		</div>
	</form>
</template>