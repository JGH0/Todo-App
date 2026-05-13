<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTodoStore } from "@/stores/todos";
import ConflictResolutionModal from "@/components/ConflictResolutionModal.vue";
import {
	getUser,
	logout,
	isAuthenticated,
	login,
	register,
} from "@/services/authService";

const todoStore = useTodoStore();
const currentUser = ref(getUser());
const showLoginModal = ref(false);
const loginEmail = ref("");
const loginPassword = ref("");
const loginLoading = ref(false);
const loginError = ref("");
const loginMode = ref("login"); // 'login' or 'register'
const registerName = ref("");

const isAuth = computed(() => isAuthenticated());

onMounted(() => {
	todoStore.initializeNetworkListeners();
});

async function handleLogin() {
	loginLoading.value = true;
	loginError.value = "";

	try {
		if (loginMode.value === "register") {
			const result = await register({
				email: loginEmail.value,
				password: loginPassword.value,
				name: registerName.value,
			});
			if (result.success) {
				currentUser.value = getUser();
				showLoginModal.value = false;
				loginMode.value = "login";
			} else {
				loginError.value = result.message || "Registration failed";
			}
		} else {
			const result = await login(loginEmail.value, loginPassword.value);
			if (result.success) {
				currentUser.value = getUser();
				showLoginModal.value = false;
			} else {
				loginError.value = result.message || "Login failed";
			}
		}
	} catch (error) {
		loginError.value = `Error: ${error.message}`;
	} finally {
		loginLoading.value = false;
	}
}

function handleLogout() {
	logout();
	currentUser.value = null;
}

function toggleLoginMode() {
	loginMode.value = loginMode.value === "login" ? "register" : "login";
	loginError.value = "";
}
</script>

<template>
	<div class="app-shell">
		<!-- Online/Offline Status Indicator -->
		<div
			class="status-indicator"
			:class="{
				online: todoStore.isOnline,
				offline: !todoStore.isOnline,
			}"
		>
			<span v-if="todoStore.isSyncing" class="syncing"
				>⏳ Syncing...</span
			>
			<span v-else-if="todoStore.isOnline" class="online"
				>● Online</span
			>
			<span v-else class="offline">● Offline</span>
		</div>

		<!-- Conflict Resolution Modal -->
		<ConflictResolutionModal
			:show="todoStore.showConflictModal"
			:conflicts="todoStore.currentConflicts"
			@close="todoStore.showConflictModal = false"
			@resolve="todoStore.resolveConflicts"
		/>

		<!-- Login Modal -->
		<div
			v-if="showLoginModal"
			class="modal-overlay"
			@click.self="showLoginModal = false"
		>
			<div class="modal-content">
				<h2>{{
						loginMode === "login" ? "Login" : "Register"
					}}</h2>

				<div v-if="loginMode === 'register'" class="form-group">
					<label for="register-name">Name</label>
					<input
						id="register-name"
						v-model="registerName"
						type="text"
						placeholder="Your name"
					/>
				</div>

				<div class="form-group">
					<label for="login-email">Email</label>
					<input
						id="login-email"
						v-model="loginEmail"
						type="email"
						placeholder="user@example.com"
					/>
				</div>

				<div class="form-group">
					<label for="login-password">Password</label>
					<input
						id="login-password"
						v-model="loginPassword"
						type="password"
						placeholder="Your password"
					/>
				</div>

				<p v-if="loginError" class="error">{{ loginError }}</p>

				<div class="modal-actions">
					<button
						:disabled="loginLoading"
						@click="handleLogin"
					>
						{{ loginLoading ?
								"Loading..." :
								loginMode === "login" ?
								"Login" :
								"Register"
						}}
					</button>
					<button @click="toggleLoginMode">
						{{
							loginMode === "login" ?
								"Create new account" :
								"Back to login"
						}}
					</button>
					<button
						@click="showLoginModal = false"
						class="secondary"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile Header -->
		<header class="mobile-header">
			<button class="hamburger" @click="sidebarOpen = true">
				☰
			</button>
			<span class="mobile-title">{{ currentViewName }}</span>
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
			<div class="user-section">
				<div v-if="currentUser" class="user-info">
					<img
						v-if="currentUser.avatar_url"
						:src="currentUser.avatar_url"
						class="user-avatar"
						alt="Avatar"
					/>
					<div
						v-else
						class="user-avatar-placeholder"
					>{{
							currentUser.name ?
								currentUser.name.charAt(0).toUpperCase() :
								"U"
					}}</div>
					<div class="user-details">
						<div class="user-name">{{
								currentUser.name || currentUser.email
						}}</div>
					</div>
				</div>
				<div v-else class="user-info">
					<div class="user-avatar-placeholder">?</div>
					<div class="user-details">
						<div class="user-name">Not logged in</div>
						<button
							@click="showLoginModal = true"
							class="login-btn"
						>
							Login
						</button>
					</div>
				</div>
			</div>

			<nav class="top-links">
				<button
					class="nav-btn"
					@click="setView('@@addTask')"
				>
					+ Add a Task
				</button>
				<button
					class="nav-btn"
					@click="setView('@@askAi')"
				>
					Ask AI
				</button>
				<button
					class="nav-btn"
					@click="setView('@@recurringTasks')"
				>
					Recurring Tasks
				</button>
				<button
					class="nav-btn"
					@click="setView('@@todos')"
				>
					All Todos
				</button>
				<button
					class="nav-btn"
					@click="setView('@@manageCategories')"
				>
					Manage Categories
				</button>
				<button
					class="nav-btn"
					@click="setView('@@themeBrowser')"
				>
					Theme Browser
				</button>
			</nav>

			<div
				v-if="favoriteCategories.length"
				class="section-title"
			>
				Favorite Categories
			</div>
			<ul class="list">
				<li
					v-for="cat in favoriteCategories"
					:key="cat.id"
					@click="setView(cat.name.toLowerCase())"
				>
					{{ cat.name }}
				</li>
			</ul>

			<div class="section-title">All Categories</div>
			<ul class="list">
				<li
					v-for="cat in allCategories"
					:key="cat.id"
					@click="setView(cat.name.toLowerCase())"
				>
					{{ cat.name }}
				</li>
			</ul>

			<button
				class="settings"
				@click="setView('@@settings')"
			>
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
import {
	applyTheme,
	loadTheme,
	applyWallpaper,
	loadWallpaper,
} from "@/utils/themeSettings";

// Apply stored theme and wallpaper before first render
const urlParams = new URLSearchParams(location.search);

if (urlParams.has("__theme_preview")) {
	try {
		const themeData = JSON.parse(atob(urlParams.get("__theme_preview")));
		const root = document.documentElement;
		Object.entries(themeData.vars).forEach(([prop, value]) => {
			root.style.setProperty(prop, value);
		});
	} catch (error) {
		console.error("Error applying theme preview:", error);
	}
} else if (!urlParams.has("__theme")) {
	applyTheme(loadTheme());
	applyWallpaper(loadWallpaper());
}

import SettingsView from "@/views/SettingsView.vue";
import AiAssistantView from "./views/AiAssistantView.vue";
import TodoCreateForm from "./views/TodoCreateForm.vue";
import TodosListView from "./views/TodosListView.vue";
import CategoryManagementView from "./views/CategoryManagementView.vue";
import RecurringTasksView from "./views/RecurringTasksView.vue";
import ThemeBrowserView from "./views/ThemeBrowserView.vue";
import { getCategories } from "@/services/categoryService";

const SimpleView = {
	props: ["title"],
	template: `
		<div class="card">
			<h2>{{ title }}</h2>
			<p>This is the {{ title }} view.</p>
		</div>
	`,
};

export default {
	components: {
		SettingsView,
		TodoCreateForm,
		TodosListView,
		CategoryManagementView,
		SearchView: {
			components: { SimpleView },
			template: `<SimpleView title="Search" />`,
		},
		FiltersView: {
			components: { SimpleView },
			template: `<SimpleView title="Filters" />`,
		},
		AiAssistantView,
		RecurringTasksView,
		ThemeBrowserView,
	},

	data() {
		return {
			currentView: "todos",
			currentCategory: null,
			sidebarOpen: false,
			categories: [],
		};
	},

	computed: {
		currentComponent() {
			// Navigation views use @@ prefix so they never collide with category names
			const views = {
				"@@settings": "SettingsView",
				"@@addTask": "TodoCreateForm",
				"@@askAi": "AiAssistantView",
				"@@todos": "TodosListView",
				"@@manageCategories": "CategoryManagementView",
				"@@recurringTasks": "RecurringTasksView",
				"@@themeBrowser": "ThemeBrowserView",
			};
			return views[this.currentView] || "TodosListView";
		},
		// Strip @@ prefix for readable display
		currentViewName() {
			const labels = {
				"@@settings": "Settings",
				"@@addTask": "Add Task",
				"@@askAi": "Ask AI",
				"@@todos": "All Todos",
				"@@manageCategories": "Manage Categories",
				"@@recurringTasks": "Recurring Tasks",
				"@@themeBrowser": "Theme Browser",
			};
			return labels[this.currentView] || this.currentView.replace('@@', '');
		},
		favoriteCategories() {
			return this.categories.filter((cat) => cat.favorite === true);
		},
		allCategories() {
			return this.categories.filter((cat) => cat.favorite !== true);
		},
	},

	async mounted() {
		await this.loadCategories();
		window.addEventListener("categories-updated", this.loadCategories);
	},

	beforeUnmount() {
		window.removeEventListener("categories-updated", this.loadCategories);
	},

	methods: {
		async loadCategories() {
			try {
				this.categories = await getCategories();
			} catch (error) {
				console.error("Failed to load categories:", error);
			}
		},
		setView(view) {
			// @@ prefix = navigation view (never collides with category names)
			if (view.startsWith('@@')) {
				this.currentView = view;
				this.currentCategory = null;
			} else {
				// Otherwise, try to match a category by name
				const matchedCategory = (this.categories || []).find(
					(cat) => cat.name.toLowerCase() === view.toLowerCase(),
				);

				if (matchedCategory) {
					this.currentView = "@@todos";
					this.currentCategory = matchedCategory.name;
				} else {
					this.currentView = view;
					this.currentCategory = null;
				}
			}
			this.sidebarOpen = false;
		},
	},
};
</script>

<style scoped>
/* Status Indicator */
.status-indicator {
	position: fixed;
	top: 10px;
	right: 10px;
	padding: 8px 16px;
	border-radius: 20px;
	font-size: 14px;
	font-weight: 600;
	z-index: 1000;
	background: var(--surface);
	border: 1px solid var(--border);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-indicator.online {
	color: #10b981;
}

.status-indicator.offline {
	color: #ef4444;
}

.status-indicator .syncing {
	color: #f59e0b;
}

/* Layout */
.app-shell {
	min-height: 100vh;
	display: grid;
	grid-template-columns: 250px 1fr;
	background: var(--bg);
	background-image: var(--wallpaper, none);
	background-size: cover;
	background-position: center;
	background-attachment: fixed;
	color: var(--text);
	transition:
		background-color 0.3s,
		color 0.3s;
}

/* Sidebar */
.sidebar {
	background: var(--sidebar-bg);
	border-right: 1px solid var(--sidebar-border);
	padding: 20px 16px;
	z-index: 20;
	transition:
		background 0.3s,
		border-color 0.3s;
}

/* User Section */
.user-section {
	margin-bottom: 18px;
}

.user-info {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: var(--surface-muted);
	border-radius: 8px;
}

.user-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
}

.user-avatar-placeholder {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--accent);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	font-weight: 600;
}

.user-details {
	flex: 1;
	min-width: 0;
}

.user-name {
	font-size: 14px;
	font-weight: 600;
	color: var(--sidebar-text);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.login-btn {
	font-size: 12px;
	padding: 4px 8px;
	background: var(--accent);
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	margin-top: 4px;
}

.login-btn:hover {
	opacity: 0.9;
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
	color: var(--sidebar-text);
	font-weight: 500;
}

.nav-btn:hover,
.list li:hover,
.settings:hover {
	opacity: 0.75;
}

.section-title {
	border-top: 1px solid var(--sidebar-border);
	padding-top: 12px;
	margin-top: 14px;
	font-weight: 600;
	color: var(--sidebar-text);
}

.list {
	list-style: none;
	padding: 0;
	margin: 10px 0 14px;
}

.list li {
	padding: 6px 0;
	cursor: pointer;
	color: var(--sidebar-text);
}

/* Content */
.content {
	padding: 20px;
}

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	padding: 18px;
}

/* Mobile Header */
.mobile-header {
	display: none;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	background: var(--sidebar-bg);
	border-bottom: 1px solid var(--sidebar-border);
	grid-column: 1 / -1;
}

.hamburger {
	font-size: 22px;
	background: none;
	border: 0;
	cursor: pointer;
	color: var(--sidebar-text);
}

/* Backdrop */
.backdrop {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.25);
	z-index: 10;
}

/* Login Modal */
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
	z-index: 2000;
}

.modal-content {
	background: var(--surface);
	padding: 2rem;
	border-radius: 8px;
	max-width: 400px;
	width: 90%;
	border: 1px solid var(--border);
}

.modal-content h2 {
	margin-top: 0;
	margin-bottom: 1.5rem;
	color: var(--text);
}

.form-group {
	margin-bottom: 1rem;
}

.form-group label {
	display: block;
	margin-bottom: 0.5rem;
	color: var(--text);
	font-weight: 500;
}

.form-group input {
	width: 100%;
	padding: 0.75rem;
	border: 1px solid var(--input-border);
	border-radius: 4px;
	background: var(--input-bg);
	color: var(--text);
	font-size: 14px;
}

.error {
	color: #ef4444;
	margin: 1rem 0;
	font-size: 14px;
}

.modal-actions {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 1.5rem;
}

.modal-actions button {
	padding: 0.75rem;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
}

.modal-actions button:not(.secondary) {
	background: var(--accent);
	color: white;
}

.modal-actions button:not(.secondary):hover {
	opacity: 0.9;
}

.modal-actions button.secondary {
	background: transparent;
	border: 1px solid var(--border);
	color: var(--text);
}

.modal-actions button.secondary:hover {
	background: var(--surface-muted);
}

.modal-actions button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
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
		border-bottom: 1px solid var(--sidebar-border);
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
