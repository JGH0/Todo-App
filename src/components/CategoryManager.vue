<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  onUpdateCategory: {
    type: Function,
    default: null,
  },
  onDeleteCategory: {
    type: Function,
    default: null,
  },
})

const drafts = reactive({})

watch(
  () => props.categories,
  (categories) => {
    for (const category of categories) {
      drafts[category.id] = category.name
    }
  },
  { immediate: true, deep: true },
)

const handleUpdate = async (category) => {
  if (!props.onUpdateCategory) {
    return
  }

  await props.onUpdateCategory(category.id, {
    ...category,
    name: drafts[category.id]?.trim() || category.name,
  })
}

const handleDelete = async (categoryId) => {
  if (!props.onDeleteCategory) {
    return
  }

  await props.onDeleteCategory(categoryId)
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <div>
        <p class="eyebrow">Kategorien</p>
        <h2>Verwalten</h2>
      </div>
      <span class="badge">{{ categories.length }} Eintraege</span>
    </div>

    <div v-if="categories.length" class="category-manager-list">
      <div v-for="category in categories" :key="category.id" class="category-manager-row">
        <input v-model="drafts[category.id]" type="text" class="category-manager-input">
        <button class="ghost-button" type="button" @click="handleUpdate(category)">
          Speichern
        </button>
        <button class="ghost-button ghost-button-danger" type="button" @click="handleDelete(category.id)">
          Loeschen
        </button>
      </div>
    </div>

    <p v-else class="empty-state">Noch keine Kategorien vorhanden.</p>
  </section>
</template>
