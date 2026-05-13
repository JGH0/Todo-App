<template>
	<div v-if="show" class="modal-overlay" @click.self="close">
		<div class="modal-content">
			<h2>Sync Conflicts</h2>
			<p>
				Changes were found both locally and online. Please decide which version you want to keep.
			</p>

			<div class="conflict-list">
				<div v-for="(conflict, index) in conflicts" :key="index" class="conflict-item">
					<h3>{{ getConflictTitle(conflict) }}</h3>
					<div class="conflict-details">
						<div class="version local">
							<h4>Local Version</h4>
							<pre>{{ formatItem(conflict.local) }}</pre>
							<button @click="resolveItem(index, 'local')" class="btn btn-local">
								Use Local Version
							</button>
						</div>
						<div class="version remote">
							<h4>Online Version</h4>
							<pre>{{ formatItem(conflict.remote) }}</pre>
							<button @click="resolveItem(index, 'remote')" class="btn btn-remote">
								Use Online Version
							</button>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-actions">
				<button @click="resolveAll('local')" class="btn btn-secondary">
					Use All Local Versions
				</button>
				<button @click="resolveAll('remote')" class="btn btn-primary">
					Use All Online Versions
				</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
	show: Boolean,
	conflicts: Array,
})

const emit = defineEmits(['close', 'resolve'])

const itemResolutions = ref({})

watch(
	() => props.conflicts,
	(newConflicts) => {
		if (newConflicts) {
			itemResolutions.value = {}
		}
	},
)

const getConflictTitle = (conflict) => {
	if (conflict.type === 'todo_modified' || conflict.type === 'todo_deleted') {
		return `Todo: ${conflict.remote?.title || conflict.local?.title || 'Deleted'}`
	}
	if (conflict.type === 'category_modified' || conflict.type === 'category_deleted') {
		return `Category: ${conflict.remote?.name || conflict.local?.name || 'Deleted'}`
	}
	return 'Conflict'
}

const formatItem = (item) => {
	if (!item) return 'Deleted'
	return JSON.stringify(item, null, 2)
}

const resolveItem = (index, choice) => {
	itemResolutions.value[index] = choice
}

const resolveAll = (strategy) => {
	emit('resolve', {
		strategy,
		itemResolutions: Object.keys(itemResolutions.value).map((index) => ({
			index: parseInt(index, 10),
			choice: itemResolutions.value[index],
		})),
	})
	close()
}

const close = () => {
	emit('close')
}
</script>

<style scoped>
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: white;
	padding: 2rem;
	border-radius: 8px;
	max-width: 800px;
	max-height: 90vh;
	overflow-y: auto;
	width: 90%;
}

.modal-content h2 {
	margin-top: 0;
	color: #333;
}

.modal-content p {
	color: #666;
	margin-bottom: 1.5rem;
}

.conflict-list {
	margin-bottom: 1.5rem;
}

.conflict-item {
	margin-bottom: 1.5rem;
	padding: 1rem;
	border: 1px solid #ddd;
	border-radius: 4px;
}

.conflict-item h3 {
	margin-top: 0;
	color: #444;
}

.conflict-details {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-top: 1rem;
}

.version {
	padding: 1rem;
	border-radius: 4px;
	background: #f5f5f5;
}

.version h4 {
	margin-top: 0;
	margin-bottom: 0.5rem;
	color: #555;
}

.version pre {
	background: white;
	padding: 0.5rem;
	border-radius: 4px;
	font-size: 0.85rem;
	max-height: 150px;
	overflow-y: auto;
	margin: 0.5rem 0;
}

.btn {
	padding: 0.5rem 1rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.9rem;
	transition: background 0.2s;
}

.btn-local {
	background: #3b82f6;
	color: white;
}

.btn-local:hover {
	background: #2563eb;
}

.btn-remote {
	background: #10b981;
	color: white;
}

.btn-remote:hover {
	background: #059669;
}

.btn-primary {
	background: #10b981;
	color: white;
}

.btn-primary:hover {
	background: #059669;
}

.btn-secondary {
	background: #6b7280;
	color: white;
}

.btn-secondary:hover {
	background: #4b5563;
}

.modal-actions {
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
	margin-top: 1.5rem;
}

@media (max-width: 640px) {
	.conflict-details {
		grid-template-columns: 1fr;
	}

	.modal-actions {
		flex-direction: column;
	}

	.modal-actions button {
		width: 100%;
	}
}
</style>
