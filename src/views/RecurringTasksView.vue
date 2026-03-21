<template>
	<div class="card recurring-tasks-view">
		<div class="card-header">
			<div>
				<p class="eyebrow">Recurring Tasks</p>
				<h2>Manage Recurring Tasks</h2>
			</div>
			<button class="add-btn" @click="openAddModal">+ Add Recurring Task</button>
		</div>

		<div v-if="loading" class="loading-state">Loading...</div>
		<div v-else-if="error" class="error-banner">{{ error }}</div>
		<div v-else-if="recurringTasks.length === 0" class="empty-state">
			No recurring tasks. Create one.
		</div>

		<ul v-else class="recurring-list">
			<li v-for="task in recurringTasks" :key="task.id" class="recurring-item">
				<div class="task-info">
					<button class="favorite-star" :class="{ active: task.favorite }" @click="toggleFavorite(task)">
						<svg width="20" height="20" viewBox="0 0 24 24" :fill="task.favorite ? '#f5b342' : 'none'" stroke="currentColor" stroke-width="2">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.07 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					</button>
					<div class="task-details">
						<div class="task-title">{{ task.title }}</div>
						<div v-if="task.description" class="task-description">{{ task.description }}</div>
						<div class="task-meta">
							<span class="schedule-badge">{{ formatSchedule(task.schedule) }}</span>
							<span v-for="cat in task.categories" :key="cat" class="category-chip">{{ cat }}</span>
						</div>
					</div>
				</div>
				<div class="task-actions">
					<button class="icon-btn edit" @click="openEdit(task)" title="Edit">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
							<path d="M15.6287 5.12132L4.31497 16.435M15.6287 5.12132L19.1642 8.65685M15.6287 5.12132L17.0429 3.70711C17.4334 3.31658 18.0666 3.31658 18.4571 3.70711L20.5784 5.82843C20.969 6.21895 20.969 6.85212 20.5784 7.24264L19.1642 8.65685M7.85051 19.9706L4.31497 16.435M7.85051 19.9706L19.1642 8.65685M7.85051 19.9706L3.25431 21.0312L4.31497 16.435" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					<button class="icon-btn delete" @click="confirmDelete(task)" title="Delete">
						<svg fill="#000000" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="28" height="28">
							<title>trash-line</title>
							<path class="clr-i-outline clr-i-outline-path-1" d="M27.14,34H8.86A2.93,2.93,0,0,1,6,31V11.23H8V31a.93.93,0,0,0,.86,1H27.14A.93.93,0,0,0,28,31V11.23h2V31A2.93,2.93,0,0,1,27.14,34Z"></path>
							<path class="clr-i-outline clr-i-outline-path-2" d="M30.78,9H5A1,1,0,0,1,5,7H30.78a1,1,0,0,1,0,2Z"></path>
							<rect class="clr-i-outline clr-i-outline-path-3" x="21" y="13" width="2" height="15"></rect>
							<rect class="clr-i-outline clr-i-outline-path-4" x="13" y="13" width="2" height="15"></rect>
							<path class="clr-i-outline clr-i-outline-path-5" d="M23,5.86H21.1V4H14.9V5.86H13V4a2,2,0,0,1,1.9-2h6.2A2,2,0,0,1,23,4Z"></path>
							<rect x="0" y="0" width="36" height="36" fill-opacity="0"></rect>
						</svg>
					</button>
				</div>
			</li>
		</ul>

		<!-- Add/Edit Modal -->
		<Teleport to="body">
			<div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
				<div class="modal-card">
					<div class="modal-header">
						<h3>{{ editingTask ? 'Edit Recurring Task' : 'Add Recurring Task' }}</h3>
						<button class="close-btn" @click="closeModal">✕</button>
					</div>
					<div class="modal-body">
						<div class="field">
							<label class="field-label">Title *</label>
							<input v-model="form.title" type="text" placeholder="e.g., Weekly review" />
						</div>
						<div class="field">
							<label class="field-label">Description</label>
							<textarea v-model="form.description" rows="2" placeholder="Optional description"></textarea>
						</div>
						<div class="field">
							<label class="field-label">Schedule</label>
							<select v-model="form.schedule">
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
								<option value="custom">Custom (days)</option>
							</select>
							<div v-if="form.schedule === 'custom'" class="custom-days">
								<label><input type="checkbox" value="mon" v-model="form.customDays" /> Mon</label>
								<label><input type="checkbox" value="tue" v-model="form.customDays" /> Tue</label>
								<label><input type="checkbox" value="wed" v-model="form.customDays" /> Wed</label>
								<label><input type="checkbox" value="thu" v-model="form.customDays" /> Thu</label>
								<label><input type="checkbox" value="fri" v-model="form.customDays" /> Fri</label>
								<label><input type="checkbox" value="sat" v-model="form.customDays" /> Sat</label>
								<label><input type="checkbox" value="sun" v-model="form.customDays" /> Sun</label>
							</div>
						</div>
						<div class="field">
							<label class="field-label">Categories</label>
							<div class="category-list">
								<span v-for="cat in form.categories" :key="cat" class="category-chip">
									{{ cat }}
									<button type="button" class="chip-remove" @click="removeCategory(cat)">✕</button>
								</span>
							</div>
							<div class="input-line">
								<input
									v-model="categoryInput"
									type="text"
									placeholder="Add category"
									@keydown.enter.prevent="addCategory"
								/>
								<button class="inline-icon-button" type="button" @click="addCategory">Add</button>
							</div>
						</div>
						<label class="checkbox-field">
							<input type="checkbox" v-model="form.favorite" />
							<span>⭐ Mark as favorite</span>
						</label>
					</div>
					<div class="modal-footer">
						<button class="secondary-button" @click="closeModal">Cancel</button>
						<button class="primary-button" @click="saveTask" :disabled="!form.title.trim()">
							{{ saving ? 'Saving...' : 'Save' }}
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- Delete Confirmation Modal -->
		<Teleport to="body">
			<div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
				<div class="modal-card small-modal">
					<div class="modal-header">
						<h3>Delete Recurring Task</h3>
						<button class="close-btn" @click="deleteTarget = null">✕</button>
					</div>
					<div class="modal-body">
						<p>Are you sure you want to delete "<strong>{{ deleteTarget.title }}</strong>"?<br>This action cannot be undone.</p>
					</div>
					<div class="modal-footer">
						<button class="secondary-button" @click="deleteTarget = null">Cancel</button>
						<button class="danger-button" @click="performDelete" :disabled="isProcessing">Delete</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
	getRecurringTasks,
	createRecurringTask,
	updateRecurringTask,
	deleteRecurringTask
} from '@/services/recurringTaskService'

const recurringTasks = ref([])
const loading = ref(false)
const error = ref(null)
const isProcessing = ref(false)
const saving = ref(false)

// Modal state
const modalOpen = ref(false)
const editingTask = ref(null)
const form = ref({
	title: '',
	description: '',
	schedule: 'weekly',
	customDays: [],
	categories: [],
	favorite: false
})
const categoryInput = ref('')

// Delete modal
const deleteTarget = ref(null)

// Format schedule for display
function formatSchedule(schedule) {
	if (schedule === 'daily') return 'Daily'
	if (schedule === 'weekly') return 'Weekly'
	if (schedule === 'monthly') return 'Monthly'
	if (schedule === 'custom') return 'Custom days'
	return schedule
}

async function loadTasks() {
	loading.value = true
	error.value = null
	try {
		const data = await getRecurringTasks()
		recurringTasks.value = data
	} catch (err) {
		console.error(err)
		error.value = 'Failed to load recurring tasks.'
	} finally {
		loading.value = false
	}
}

function openAddModal() {
	editingTask.value = null
	form.value = {
		title: '',
		description: '',
		schedule: 'weekly',
		customDays: [],
		categories: [],
		favorite: false
	}
	categoryInput.value = ''
	modalOpen.value = true
}

function openEdit(task) {
	editingTask.value = task
	form.value = {
		title: task.title,
		description: task.description || '',
		schedule: task.schedule,
		customDays: task.customDays || [],
		categories: [...(task.categories || [])],
		favorite: task.favorite || false
	}
	categoryInput.value = ''
	modalOpen.value = true
}

function closeModal() {
	modalOpen.value = false
	editingTask.value = null
}

function addCategory() {
	const value = categoryInput.value.trim()
	if (!value || form.value.categories.includes(value)) {
		categoryInput.value = ''
		return
	}
	form.value.categories.push(value)
	categoryInput.value = ''
}

function removeCategory(cat) {
	form.value.categories = form.value.categories.filter(c => c !== cat)
}

async function saveTask() {
	if (!form.value.title.trim()) return

	saving.value = true
	try {
		const payload = {
			title: form.value.title.trim(),
			description: form.value.description.trim(),
			schedule: form.value.schedule,
			customDays: form.value.schedule === 'custom' ? form.value.customDays : [],
			categories: form.value.categories,
			favorite: form.value.favorite
		}

		if (editingTask.value) {
			const updated = await updateRecurringTask(editingTask.value.id, payload)
			const index = recurringTasks.value.findIndex(t => t.id === updated.id)
			if (index !== -1) recurringTasks.value[index] = updated
		} else {
			const created = await createRecurringTask(payload)
			recurringTasks.value.push(created)
		}
		closeModal()
	} catch (err) {
		console.error(err)
		error.value = 'Failed to save recurring task.'
		setTimeout(() => (error.value = null), 3000)
	} finally {
		saving.value = false
	}
}

async function toggleFavorite(task) {
	const updated = { ...task, favorite: !task.favorite }
	try {
		await updateRecurringTask(task.id, updated)
		const index = recurringTasks.value.findIndex(t => t.id === task.id)
		if (index !== -1) recurringTasks.value[index] = updated
	} catch (err) {
		console.error(err)
		error.value = 'Failed to update favorite.'
		setTimeout(() => (error.value = null), 3000)
	}
}

function confirmDelete(task) {
	deleteTarget.value = task
}

async function performDelete() {
	if (!deleteTarget.value) return
	isProcessing.value = true
	try {
		await deleteRecurringTask(deleteTarget.value.id)
		recurringTasks.value = recurringTasks.value.filter(t => t.id !== deleteTarget.value.id)
		deleteTarget.value = null
	} catch (err) {
		console.error(err)
		error.value = 'Failed to delete recurring task.'
		setTimeout(() => (error.value = null), 3000)
	} finally {
		isProcessing.value = false
	}
}

onMounted(() => {
	loadTasks()
})
</script>

<style scoped>
	.recurring-tasks-view {
		background: var(--surface);
		backdrop-filter: blur(12px);
	}

	.recurring-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 12px;
	}

	.recurring-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background: #f8f8f6;
		border: 1px solid #e2e2de;
		border-radius: 20px;
	}

	.task-info {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		flex: 1;
	}

	.favorite-star {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.favorite-star:hover {
		opacity: 1;
	}

	.favorite-star.active svg {
		fill: #f5b342;
		stroke: #f5b342;
	}

	.task-details {
		flex: 1;
	}

	.task-title {
		font-weight: 600;
		font-size: 1.1rem;
		margin-bottom: 4px;
	}

	.task-description {
		color: var(--text-muted);
		font-size: 0.9rem;
		margin-bottom: 8px;
	}

	.task-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	.schedule-badge {
		background: var(--chip);
		border: 1px solid var(--border);
		padding: 4px 12px;
		border-radius: 999px;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.category-chip {
		background: var(--chip);
		border: 1px solid var(--border);
		padding: 4px 12px;
		border-radius: 999px;
		font-size: 0.8rem;
	}

	.task-actions {
		display: flex;
		gap: 8px;
		margin-left: 12px;
		flex-shrink: 0;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
		transition: opacity 0.2s, transform 0.1s;
	}

	.icon-btn:hover {
		opacity: 1;
		transform: scale(1.05);
	}

	.icon-btn:active {
		transform: scale(0.95);
	}

	.icon-btn.edit svg {
		width: 24px;
		height: 24px;
		stroke: currentColor;
	}

	.icon-btn.delete svg {
		width: 28px;
		height: 28px;
		fill: currentColor;
		stroke: none;
	}

	.add-btn {
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 999px;
		padding: 8px 16px;
		cursor: pointer;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.add-btn:hover {
		opacity: 0.9;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 40px;
		color: var(--text-muted);
	}

	.error-banner {
		background: #fee;
		border: 1px solid #fcc;
		color: #c33;
		padding: 12px;
		border-radius: 12px;
		margin-bottom: 16px;
		text-align: center;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-card {
		background: white;
		border-radius: 28px;
		padding: 24px;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.small-modal {
		max-width: 400px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.modal-header h3 {
		margin: 0;
		color: #333;
	}

	.close-btn {
		background: transparent;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field-label {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.field input,
	.field textarea,
	.field select {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 10px 12px;
		font: inherit;
		background: white;
	}

	.custom-days {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 8px;
	}

	.custom-days label {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
	}

	.category-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 8px;
	}

	.category-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--chip);
		border: 1px solid var(--border);
		padding: 4px 12px;
		font-size: 0.9rem;
		border-radius: 999px;
	}

	.chip-remove {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0 2px;
		font-size: 1rem;
		line-height: 1;
	}

	.input-line {
		display: flex;
		gap: 8px;
	}

	.input-line input {
		flex: 1;
	}

	.inline-icon-button {
		background: var(--chip);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 8px 16px;
		cursor: pointer;
		white-space: nowrap;
	}

	.checkbox-field {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	.primary-button,
	.secondary-button,
	.danger-button {
		border: none;
		border-radius: 999px;
		padding: 10px 20px;
		cursor: pointer;
		font-weight: 500;
	}

	.primary-button {
		background: var(--accent);
		color: white;
	}

	.secondary-button {
		background: #e5e5e2;
		color: #303030;
	}

	.danger-button {
		background: #d32f2f;
		color: white;
	}

	.danger-button:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.danger-button:hover:not(:disabled) {
		background: #b71c1c;
	}

	.card-header {
		margin-bottom: 1rem;
	}
</style>