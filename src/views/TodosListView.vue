<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  category: {
    type: String,
    default: null
  }
})

// Dummy todo data – now 15 items
const todos = ref([
  {
    id: 1,
    title: 'Einbauter gehen',
    description: '🏠🚶‍♀️',
    dueDate: '2026-03-15',
    dueTime: '18:00',
    status: 'open',
    favorite: false,
    categories: ['Home', 'Personal']
  },
  {
    id: 2,
    title: 'Blumer giessen',
    description: '🍴🍳',
    dueDate: '2026-03-14',
    dueTime: '12:00',
    status: 'open',
    favorite: true,
    categories: ['Work']
  },
  {
    id: 3,
    title: 'Franz 5.12 a-Z',
    description: 'do dotz in 2009',
    dueDate: '2026-03-13',
    dueTime: '10:00',
    status: 'done',
    favorite: false,
    categories: ['Personal']
  },
  {
    id: 4,
    title: 'Mathe 5.30',
    description: 'dotz in 2009',
    dueDate: '2026-03-16',
    dueTime: '09:00',
    status: 'open',
    favorite: false,
    categories: ['Work']
  },
  {
    id: 5,
    title: 'Physik Printing',
    description: 'kategorien do dotz',
    dueDate: '2026-03-20',
    dueTime: null,
    status: 'done',
    favorite: true,
    categories: ['Home']
  },
  // New todos
  {
    id: 6,
    title: 'Team meeting',
    description: 'Discuss Q2 roadmap',
    dueDate: '2026-03-22',
    dueTime: '14:00',
    status: 'open',
    favorite: false,
    categories: ['Work']
  },
  {
    id: 7,
    title: 'Grocery shopping',
    description: 'Buy vegetables, milk, bread',
    dueDate: '2026-03-18',
    dueTime: '17:30',
    status: 'open',
    favorite: true,
    categories: ['Home', 'Personal']
  },
  {
    id: 8,
    title: 'Yoga class',
    description: 'Bring mat and water',
    dueDate: '2026-03-19',
    dueTime: '09:00',
    status: 'open',
    favorite: false,
    categories: ['Personal']
  },
  {
    id: 9,
    title: 'Finish presentation',
    description: 'Slides for Monday',
    dueDate: '2026-03-21',
    dueTime: '20:00',
    status: 'open',
    favorite: false,
    categories: ['Work']
  },
  {
    id: 10,
    title: 'Call dentist',
    description: 'Appointment for check-up',
    dueDate: '2026-03-17',
    dueTime: '11:15',
    status: 'done',
    favorite: false,
    categories: ['Personal']
  },
  {
    id: 11,
    title: 'Pay electricity bill',
    description: 'Due before 25th',
    dueDate: '2026-03-24',
    dueTime: null,
    status: 'open',
    favorite: true,
    categories: ['Home']
  },
  {
    id: 12,
    title: 'Write blog post',
    description: 'Topic: Vue 3 patterns',
    dueDate: '2026-03-26',
    dueTime: '15:00',
    status: 'open',
    favorite: false,
    categories: ['Work']
  },
  {
    id: 13,
    title: 'Water plants',
    description: 'Indoor and balcony',
    dueDate: '2026-03-15',
    dueTime: '08:00',
    status: 'done',
    favorite: true,
    categories: ['Home']
  },
  {
    id: 14,
    title: 'Read book',
    description: 'Atomic Habits',
    dueDate: '2026-03-30',
    dueTime: null,
    status: 'open',
    favorite: false,
    categories: ['Personal']
  },
  {
    id: 15,
    title: 'Code review',
    description: 'Pull requests #42, #43',
    dueDate: '2026-03-16',
    dueTime: '16:00',
    status: 'open',
    favorite: false,
    categories: ['Work']
  }
])

// Filter todos based on category
const filteredTodos = computed(() => {
  if (!props.category) return todos.value
  return todos.value.filter(todo => todo.categories.includes(props.category))
})

// Toggle completion status
const toggleComplete = (todo) => {
  todo.status = todo.status === 'open' ? 'done' : 'open'
}

// Toggle favorite
const toggleFavorite = (todo) => {
  todo.favorite = !todo.favorite
}

// Dummy countdown text (static 3 days)
const countdownText = '🗑️ 3 days'
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
        <!-- First row: completion circle, title, action icons -->
        <div class="todo-row todo-row-main">
          <!-- Completion circle on the left -->
          <button 
            class="completion-circle" 
            :class="{ completed: todo.status === 'done' }"
            @click="toggleComplete(todo)"
            :aria-label="todo.status === 'done' ? 'Mark as open' : 'Mark as done'"
          />

          <!-- Title in the middle -->
          <span class="todo-title">{{ todo.title }}</span>

          <!-- Action icons on the right -->
          <div class="todo-actions-right">
            <!-- Star SVG (filled when favorite) -->
            <button 
              class="icon-btn star" 
              @click="toggleFavorite(todo)"
              aria-label="Toggle favorite"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                :fill="todo.favorite ? '#f5b342' : 'none'" 
                stroke="currentColor" 
                stroke-width="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.07 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
            <!-- Edit button with SVG -->
            <button class="icon-btn edit" aria-label="Edit task">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" fill="white"/>
                <path d="M15.6287 5.12132L4.31497 16.435M15.6287 5.12132L19.1642 8.65685M15.6287 5.12132L17.0429 3.70711C17.4334 3.31658 18.0666 3.31658 18.4571 3.70711L20.5784 5.82843C20.969 6.21895 20.969 6.85212 20.5784 7.24264L19.1642 8.65685M7.85051 19.9706L4.31497 16.435M7.85051 19.9706L19.1642 8.65685M7.85051 19.9706L3.25431 21.0312L4.31497 16.435" stroke="#000000" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Second row: description -->
        <div v-if="todo.description" class="todo-row todo-description">
          {{ todo.description }}
        </div>

        <!-- Third row: metadata (date/categories) and countdown -->
        <div class="todo-row todo-metadata">
          <div class="meta-left">
            <span v-if="todo.dueDate" class="meta-chip">
              <!-- Calendar SVG -->
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9H21M17 13.0014L7 13M10.3333 17.0005L7 17M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ todo.dueDate }}
              <span v-if="todo.dueTime" class="time-part">
                <!-- Clock SVG -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.9997 20.5815L16.4179 18.0113M4.9997 20.5815L7.58154 18.0113M11.9997 9.58148V12.5815L13.4416 13.9998M6.74234 3.99735C6.36727 3.62228 5.85856 3.41156 5.32812 3.41156C4.79769 3.41156 4.28898 3.62228 3.91391 3.99735C3.53884 4.37242 3.32813 4.88113 3.32812 5.41156C3.32812 5.942 3.53884 6.4507 3.91391 6.82578M20.0858 6.82413C20.4609 6.44905 20.6716 5.94035 20.6716 5.40991C20.6716 4.87948 20.4609 4.37077 20.0858 3.9957C19.7107 3.62063 19.202 3.40991 18.6716 3.40991C18.1411 3.40991 17.6324 3.62063 17.2574 3.9957M18.9997 12.5815C18.9997 16.4475 15.8657 19.5815 11.9997 19.5815C8.1337 19.5815 4.9997 16.4475 4.9997 12.5815C4.9997 8.71549 8.1337 5.58149 11.9997 5.58149C15.8657 5.58149 18.9997 8.71549 18.9997 12.5815Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ todo.dueTime }}
              </span>
            </span>
            <span v-for="cat in todo.categories" :key="cat" class="category-chip">
              {{ cat }}
            </span>
          </div>
          <div v-if="todo.status === 'done'" class="meta-right countdown">
            {{ countdownText }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Reuse existing global styles, add new ones for this view */
.todo-list-view {
  background: var(--surface);
  backdrop-filter: blur(12px);
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 16px;
}

.todo-item {
  padding: 18px 20px;
  border-radius: 24px;
  background: #f8f8f6;
  border: 1px solid #e2e2de;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.todo-row {
  display: flex;
  align-items: center;
}

.todo-row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Completion circle on left */
.completion-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #888;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, border-color 0.2s;
  margin-right: 12px; /* space after circle */
  flex-shrink: 0;
}

.completion-circle.completed {
  background: #4caf50;
  border-color: #4caf50;
}

.todo-title {
  flex: 1;
  font-weight: 600;
  font-size: 1.15rem;
}

/* Right action buttons */
.todo-actions-right {
  display: flex;
  gap: 8px;
  margin-left: 12px;
  flex-shrink: 0;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.icon-btn:hover {
  opacity: 1;
}

.icon-btn.star svg,
.icon-btn.edit svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
}

.icon-btn.star.active svg {
  fill: #f5b342;
}

/* Description and metadata are indented to align under the title */
.todo-description {
  color: var(--text-muted);
  padding-left: 40px; /* width of circle + margin */
  font-size: 0.95rem;
}

.todo-metadata {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-left: 40px;
}

.meta-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.meta-chip,
.category-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--chip);
  border: 1px solid var(--border);
  padding: 6px 14px;
  font-size: 0.9rem;
  border-radius: 999px; /* fully rounded */
}

.meta-chip svg,
.category-chip svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.time-part {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
}

.meta-right {
  font-size: 0.9rem;
  color: #d32f2f; /* red for delete */
  font-weight: 500;
  white-space: nowrap;
}

.countdown {
  background: rgba(211, 47, 47, 0.1);
  padding: 4px 14px;
  border-radius: 999px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  background: rgba(255,255,255,0.4);
  border-radius: 18px;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .todo-item {
    padding: 14px;
  }

  .todo-description,
  .todo-metadata {
    padding-left: 0;
  }

  .todo-metadata {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-right {
    align-self: flex-end;
  }
}
</style>