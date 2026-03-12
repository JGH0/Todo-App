<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
	<div class="app-shell">
		<!-- Mobile Header -->
		<header class="mobile-header">
			<button class="hamburger" @click="sidebarOpen = true">
				☰
			</button>
			<span class="mobile-title">{{ currentView }}</span>
		</header>

		<!-- Mobile Backdrop -->
		<div
			v-if="sidebarOpen"
			class="backdrop"
			@click="sidebarOpen = false"
		/>

		<!-- Sidebar -->
		<aside
			class="sidebar"
			:class="{ open: sidebarOpen }"
			@click.stop
		>
			<div class="user">User XY</div>

			<nav class="top-links">
				<button class="nav-btn" @click="setView('addTask')">+ Add a Task</button>
				<button class="nav-btn" @click="setView('search')">Search</button>
				<button class="nav-btn" @click="setView('filters')">Filters</button>
				<button class="nav-btn" @click="setView('askAi')">Ask AI</button>
				<button class="nav-btn" @click="setView('todos')">All Todos</button>
			</nav>

			<div class="section-title">Favorites</div>
			<ul class="list">
				<li v-for="fav in favorites" :key="fav" @click="setView(fav)">
					{{ fav.charAt(0).toUpperCase() + fav.slice(1) }}
				</li>
			</ul>

			<button class="settings" @click="setView('settings')">
				Settings
			</button>
		</aside>

		<!-- Content -->
		<main class="content">
			<component :is="currentComponent" :category="currentCategory" />
		</main>
	</div>
</template>

<script>
import SettingsView from '@/views/SettingsView.vue'
import AiAssistantView from './views/AiAssistantView.vue'
import TodoCreateForm from './views/TodoCreateForm.vue'
import TodosListView from './views/TodosListView.vue' // <-- new

const SimpleView = {
	props: ['title'],
	template: `
		<div class="card">
			<h2>{{ title }}</h2>
			<p>This is the {{ title }} view.</p>
		</div>
	`
}

export default {
	components: {
		SettingsView,
		TodoCreateForm,
		TodosListView, // <-- register
		SearchView: { components: { SimpleView }, template: `<SimpleView title="Search" />` },
		FiltersView: { components: { SimpleView }, template: `<SimpleView title="Filters" />` },
		AiAssistantView,
		// WorkView, HomeView, PersonalView removed – now handled by TodosListView with category
	},

	data() {
		return {
			currentView: 'settings',
			currentCategory: null, // <-- new
			sidebarOpen: false,
			favorites: ['work', 'home', 'personal'] // lowercase for easy matching
		}
	},

	computed: {
		currentComponent() {
			const views = {
				settings: 'SettingsView',
				addTask: 'TodoCreateForm',
				search: 'SearchView',
				filters: 'FiltersView',
				askAi: 'AiAssistantView',
				todos: 'TodosListView' // <-- new
			}
			return views[this.currentView]
		}
	},

	methods: {
		setView(view) {
			// If the view is one of the favorite categories, go to todos with that category
			if (this.favorites.includes(view)) {
				this.currentView = 'todos'
				this.currentCategory = view.charAt(0).toUpperCase() + view.slice(1) // capitalize
			} else {
				this.currentView = view
				this.currentCategory = null
			}
			this.sidebarOpen = false
		}
	}
}
</script>

<style scoped>
/* Layout */
.app-shell {
	min-height: 100vh;
	display: grid;
	grid-template-columns: 250px 1fr;
	background: #f5f5f5;
	color: #1f1f1f;
}

/* Sidebar */
.sidebar {
	background: #ffffff;
	border-right: 1px solid #d0d0d0;
	padding: 20px 16px;
	z-index: 20;
}

.user {
	font-size: 20px;
	font-weight: 600;
	color: #111;
	margin-bottom: 18px;
}

.top-links {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.nav-btn,
.settings {
	background: transparent;
	border: 0;
	padding: 6px 0;
	text-align: left;
	cursor: pointer;
	color: #222;
	font-weight: 500;
}

.nav-btn:hover,
.list li:hover,
.settings:hover {
	color: #000;
}

.section-title {
	border-top: 1px solid #ddd;
	padding-top: 12px;
	margin-top: 14px;
	font-weight: 600;
	color: #222;
}

.list {
	list-style: none;
	padding: 0;
	margin: 10px 0 14px;
}

.list li {
	padding: 6px 0;
	cursor: pointer;
	color: #222;
}

/* Content */
.content {
	padding: 20px;
}

.card {
	background: #fff;
	border: 1px solid #d9d9d9;
	padding: 18px;
}

/* Mobile Header */
.mobile-header {
	display: none;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	background: #fff;
	border-bottom: 1px solid #d0d0d0;
	grid-column: 1 / -1;
}

.hamburger {
	font-size: 22px;
	background: none;
	border: 0;
	cursor: pointer;
	color: #111;
}

/* Backdrop */
.backdrop {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.25);
	z-index: 10;
}

/* Mobile */
@media (max-width: 900px) {
	.app-shell {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr;
	}

	.mobile-header {
		display: flex;
	}

	.sidebar {
		position: fixed;
		top: 52px;
		left: 0;
		right: 0;
		border-right: 0;
		border-bottom: 1px solid #d0d0d0;
		display: none;
	}

	.sidebar.open {
		display: block;
	}

	.content {
		padding-top: 16px;
	}
}
</style>