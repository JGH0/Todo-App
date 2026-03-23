<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AI_SETTINGS_EVENT,
  AI_SETTINGS_STORAGE_KEY,
  buildOllamaChatEndpointCandidates,
  buildOpenAiChatEndpointCandidates,
  getActiveAiConfig,
  loadAiSettings,
  normalizeServerUrl,
} from '@/utils/aiSettings'
import { getTodos, createTodo, updateTodo, deleteTodo } from '@/services/todoService'
import { getCategories, createCategory } from '@/services/categoryService'

const CHAT_HISTORY_KEY = 'ai-assistant-chat-history'

const aiSettings = ref(loadAiSettings())
const sending = ref(false)
const loadingTasks = ref(false)
const categoriesList = ref([])

const taskDraft = ref({
  title: '',
  category: 'General',
  dueDate: '',
  adviceContext: '',
})

const tasks = ref([])
const selectedTaskId = ref(null)
const chatInput = ref('')
const chatMessages = ref([])

// Confirmation modal
const pendingAction = ref(null)
const confirmMessage = ref('')
const confirmModalVisible = ref(false)

// Batch actions
const batchActions = ref([])
const batchSummary = ref('')
const batchModalVisible = ref(false)
let batchResolve = null

const activeConfig = computed(() => getActiveAiConfig(aiSettings.value))
const activeServerUrl = computed(() => normalizeServerUrl(activeConfig.value.serverUrl))
const activeApiBaseUrl = computed(() => normalizeServerUrl(activeConfig.value.requestBaseUrl))
const selectedModel = computed(() => aiSettings.value.primaryModel || '')
const useSecondModel = computed(() => aiSettings.value.useSecondModel)
const secondaryModel = computed(() => aiSettings.value.secondaryModel || '')

const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null)

// Persist chat history
function saveChatHistory() {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages.value))
}

function loadChatHistory() {
  const saved = localStorage.getItem(CHAT_HISTORY_KEY)
  if (saved) {
    try {
      chatMessages.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse chat history', e)
    }
  }
  if (!chatMessages.value.length) {
    chatMessages.value = [
      {
        role: 'assistant',
        content: 'Hello, I am your AI Assistant. I am ready to help you out :)',
      },
    ]
  }
}

function clearHistory() {
  chatMessages.value = [
    {
      role: 'assistant',
      content: 'Chat history cleared. Hello again! I am ready to help you out :)',
    },
  ]
  saveChatHistory()
}

watch(chatMessages, () => {
  saveChatHistory()
}, { deep: true })

function refreshAiSettings() {
  aiSettings.value = loadAiSettings()
}

function handleStorageChange(event) {
  if (!event || !event.key || event.key === AI_SETTINGS_STORAGE_KEY) {
    refreshAiSettings()
  }
}

async function loadData() {
  loadingTasks.value = true
  try {
    const [todosData, catsData] = await Promise.all([
      getTodos(),
      getCategories()
    ])
    tasks.value = todosData.map(t => ({ ...t, completed: t.status === 'done' }))
    categoriesList.value = catsData
    if (!selectedTaskId.value && tasks.value.length) selectedTaskId.value = tasks.value[0].id
    syncDraftWithSelectedTask()
  } catch (err) {
    console.error(err)
    chatMessages.value.push({ role: 'assistant', content: `Failed to load data: ${err.message}` })
  } finally {
    loadingTasks.value = false
  }
}

function syncDraftWithSelectedTask() {
  if (!selectedTask.value) return
  taskDraft.value = {
    title: selectedTask.value.title,
    category: selectedTask.value.categories?.[0] || 'General',
    dueDate: selectedTask.value.dueDate,
    adviceContext: taskDraft.value.adviceContext,
  }
}

async function ensureCategory(categoryName) {
  if (!categoryName) return null
  const existing = categoriesList.value.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
  if (existing) return existing.name
  try {
    const newCat = await createCategory({ name: categoryName, favorite: false })
    categoriesList.value.push(newCat)
    window.dispatchEvent(new CustomEvent('categories-updated'))
    return newCat.name
  } catch (err) {
    console.error('Failed to create category', err)
    return null
  }
}

async function createTaskFromData(payload) {
  const title = (payload.title || '').trim()
  if (!title) return 'Please provide a task title.'

  let category = (payload.category || 'General').trim()
  if (!category) category = 'General'
  const finalCategory = await ensureCategory(category)
  if (!finalCategory) return `Failed to create category "${category}".`

  const newTask = {
    title,
    description: '',
    status: 'open',
    categories: [finalCategory],
    dueDate: payload.dueDate || null,
    dueTime: payload.dueTime || null,
    syncEnabled: false,
    reminderEnabled: false,
    recurringEnabled: false,
    projectId: null,
  }
  try {
    const created = await createTodo(newTask)
    tasks.value.push(created)
    selectedTaskId.value = created.id
    syncDraftWithSelectedTask()
    return `Created task: "${title}" in category "${finalCategory}".`
  } catch (err) {
    console.error(err)
    return `Failed to create task: ${err.message}`
  }
}

function readTasks() {
  if (!tasks.value.length) return 'No tasks found.'
  return tasks.value.map((task) => `#${task.id} ${task.title} (${task.categories?.[0] || 'No category'})`).join('\n')
}

function findTasksByTitle(title) {
  if (!title) return []
  const lowerTitle = title.toLowerCase()
  const exactMatches = tasks.value.filter(t => t.title.toLowerCase() === lowerTitle)
  if (exactMatches.length) return exactMatches
  return tasks.value.filter(t => t.title.toLowerCase().includes(lowerTitle))
}

function confirmAction(type, task, newData = null) {
  return new Promise((resolve, reject) => {
    pendingAction.value = { type, task, newData, resolve, reject }
    if (type === 'update') {
      confirmMessage.value = `Update task #${task.id} "${task.title}"?\nNew title: ${newData.title}\nNew category: ${newData.category}\nNew due date: ${newData.dueDate}`
    } else if (type === 'delete') {
      confirmMessage.value = `Delete task #${task.id} "${task.title}"? This cannot be undone.`
    }
    confirmModalVisible.value = true
  })
}

async function executeUpdate(taskId, updates) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return 'Task not found.'
  let category = updates.category
  if (category) {
    const finalCategory = await ensureCategory(category)
    if (!finalCategory) return `Failed to create category "${category}".`
    updates.category = finalCategory
  }
  const updatedTask = {
    ...task,
    title: updates.title ?? task.title,
    categories: updates.category ? [updates.category] : task.categories,
    dueDate: updates.dueDate ?? task.dueDate,
  }
  try {
    const saved = await updateTodo(taskId, updatedTask)
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) tasks.value[index] = saved
    selectedTaskId.value = taskId
    syncDraftWithSelectedTask()
    return `Updated task #${taskId}.`
  } catch (err) {
    return `Failed to update task: ${err.message}`
  }
}

async function executeDelete(taskId) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return 'Task not found.'
  try {
    await deleteTodo(taskId)
    tasks.value = tasks.value.filter(t => t.id !== taskId)
    selectedTaskId.value = tasks.value[0]?.id ?? null
    if (selectedTask.value) syncDraftWithSelectedTask()
    return `Deleted task #${taskId}.`
  } catch (err) {
    return `Failed to delete task: ${err.message}`
  }
}

function getLocalAdvice() {
  const openTasks = tasks.value.filter((task) => task.status !== 'done')
  if (!openTasks.length) {
    return 'Great progress. You have no open tasks. Add one priority task for tomorrow.'
  }
  const topThree = openTasks.slice(0, 3).map((task) => `- ${task.title}`).join('\n')
  return `Focus on these next steps:\n${topThree}`
}

async function requestJson(urls, options = {}) {
  let lastError = null
  for (const url of urls) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        const raw = await response.text()
        throw new Error(raw || `HTTP ${response.status}`)
      }
      return response.json()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error(`No chat endpoint could be reached from ${activeApiBaseUrl.value}`)
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (activeConfig.value.apiKey) {
    headers.Authorization = `Bearer ${activeConfig.value.apiKey}`
  }
  return headers
}

function buildPlannerPrompt(userText) {
  const categoriesSet = new Set()
  tasks.value.forEach(t => {
    if (t.categories && Array.isArray(t.categories)) {
      t.categories.forEach(c => categoriesSet.add(c))
    }
  })
  const categoriesListStr = [...categoriesSet].map(c => `"${c}"`).join(', ')
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
  const currentDateTime = now.toLocaleString()

  return [
    'You are a task assistant. Output only a single JSON object. No extra text, no markdown.',
    '',
    'Allowed actions: create, read, update, delete, advice.',
    'You may return a single action object or an array of actions under the key "actions".',
    '',
    'Action schemas:',
    '- create: {"action":"create","title":"","category":"","dueDate":"","dueTime":""}',
    '- read: {"action":"read"}',
    '- update: {"action":"update","taskId":0,"updates":{"title":"","category":"","dueDate":"","dueTime":""}} or use title',
    '- delete: {"action":"delete","taskId":0} or use title',
    '- advice: {"action":"advice","advice":""}',
    '',
    'For batch creation, use {"actions": [create1, create2, ...]}.',
    '',
    `Current date: ${currentDate} (YYYY-MM-DD). Current time: ${currentDateTime}`,
    'Interpret relative dates like "tomorrow", "next Saturday", "this week" using this date.',
    '',
    `Current tasks: ${JSON.stringify(tasks.value)}`,
    `Available categories: ${categoriesListStr || 'none'}`,
    `Selected task id: ${selectedTaskId.value || 0}`,
    `Advice context: ${taskDraft.value.adviceContext || ''}`,
    '',
    `User request: ${userText}`,
  ].join('\n')
}

function extractJsonObject(text) {
  // Try to parse the whole text
  try {
    return JSON.parse(text)
  } catch (e) {
    // Remove code fences
    const cleaned = text.replace(/```json|```/gi, '').trim()
    // Try to parse cleaned
    try {
      return JSON.parse(cleaned)
    } catch (e2) {
      // Try to extract JSON using regex
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return JSON.parse(match[0])
        } catch (e3) {}
      }
    }
  }
  return null
}

async function runChatCompletion(modelId, userText) {
  const messages = [
    { role: 'system', content: 'You are a JSON‑only task planner. Return exactly one valid JSON object. No other text.' },
    { role: 'user', content: buildPlannerPrompt(userText) },
  ]
  const openAiCompatibleBody = {
    model: modelId,
    messages,
    stream: false,
    temperature: 0.2,
  }
  try {
    const payload = await requestJson(buildOpenAiChatEndpointCandidates(activeApiBaseUrl.value), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(openAiCompatibleBody),
    })
    const content = payload?.choices?.[0]?.message?.content || ''
    console.log('AI raw response:', content)
    return extractJsonObject(content)
  } catch {
    const payload = await requestJson(buildOllamaChatEndpointCandidates(activeApiBaseUrl.value), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: false,
        options: { temperature: 0.2 },
      }),
    })
    const content = payload?.message?.content || ''
    console.log('AI raw response:', content)
    return extractJsonObject(content)
  }
}

function mergePlans(primary, secondary) {
  if (!secondary) return primary
  if (!primary) return secondary
  const merged = { ...secondary, ...primary }
  if ((!primary.action || primary.action === 'advice') && secondary.action && secondary.action !== 'advice') {
    merged.action = secondary.action
  }
  if (!merged.title) merged.title = secondary.title || ''
  if (!merged.taskId) merged.taskId = secondary.taskId || 0
  const primaryAdvice = primary.advice || ''
  const secondaryAdvice = secondary.advice || ''
  if (primaryAdvice && secondaryAdvice && primaryAdvice !== secondaryAdvice) {
    merged.advice = `${primaryAdvice}\n\nSecond opinion: ${secondaryAdvice}`
  } else {
    merged.advice = primaryAdvice || secondaryAdvice || ''
  }
  merged.updates = {
    ...(secondary.updates || {}),
    ...(primary.updates || {}),
  }
  return merged
}

function normalizeActions(plan) {
  if (plan.actions && Array.isArray(plan.actions)) return plan.actions
  if (plan.action) return [plan]
  return []
}

function buildBatchSummary(actions) {
  let summary = ''
  for (const act of actions) {
    if (act.action === 'create') {
      summary += `➕ Create task: "${act.title}" (category: ${act.category || 'General'})\n`
    } else if (act.action === 'update') {
      const taskId = act.taskId || (act.title ? findTasksByTitle(act.title)[0]?.id : null)
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        summary += `✏️ Update task #${task.id} "${task.title}" → `
        const updates = act.updates || { title: act.title, category: act.category, dueDate: act.dueDate, dueTime: act.dueTime }
        if (updates.title) summary += `title: "${updates.title}" `
        if (updates.category) summary += `category: "${updates.category}" `
        if (updates.dueDate) summary += `due: ${updates.dueDate} `
        if (updates.dueTime) summary += `time: ${updates.dueTime}`
        summary += '\n'
      } else {
        summary += `✏️ Update (task not found: ${act.title || act.taskId})\n`
      }
    } else if (act.action === 'delete') {
      const taskId = act.taskId || (act.title ? findTasksByTitle(act.title)[0]?.id : null)
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        summary += `❌ Delete task #${task.id} "${task.title}"\n`
      } else {
        summary += `❌ Delete (task not found: ${act.title || act.taskId})\n`
      }
    }
  }
  return summary || 'No actions to perform.'
}

async function executePlan(plan) {
  console.log('Plan received:', plan)
  const actions = normalizeActions(plan)
  if (actions.length === 0) {
    if (plan && plan.advice) return plan.advice
    return 'I could not understand that. Please try again with a clearer request.'
  }

  if (actions.length === 1) {
    const act = actions[0]
    if (act.action === 'create') {
      if (!act.title) return 'Please provide a title for the task.'
      return await createTaskFromData({
        title: act.title,
        category: act.category,
        dueDate: act.dueDate,
        dueTime: act.dueTime,
      })
    }
    if (act.action === 'read') {
      return readTasks()
    }
    if (act.action === 'update') {
      let taskId = act.taskId
      if (!taskId && act.title) {
        const matches = findTasksByTitle(act.title)
        if (matches.length === 1) taskId = matches[0].id
        else if (matches.length > 1) return `Multiple tasks found with title "${act.title}". Please specify by ID.`
        else return `No task found with title "${act.title}".`
      }
      if (!taskId) return 'No task specified for update.'
      const updates = act.updates || { title: act.title, category: act.category, dueDate: act.dueDate, dueTime: act.dueTime }
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) return `Task #${taskId} not found.`
      try {
        await confirmAction('update', task, {
          title: updates.title || task.title,
          category: updates.category || task.categories?.[0] || 'General',
          dueDate: updates.dueDate || task.dueDate,
          dueTime: updates.dueTime || task.dueTime,
        })
        return await executeUpdate(taskId, updates)
      } catch (e) {
        return 'Update cancelled.'
      }
    }
    if (act.action === 'delete') {
      let taskId = act.taskId
      if (!taskId && act.title) {
        const matches = findTasksByTitle(act.title)
        if (matches.length === 1) taskId = matches[0].id
        else if (matches.length > 1) return `Multiple tasks found with title "${act.title}". Please specify by ID.`
        else return `No task found with title "${act.title}".`
      }
      if (!taskId) return 'No task specified for delete.'
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) return `Task #${taskId} not found.`
      try {
        await confirmAction('delete', task)
        return await executeDelete(taskId)
      } catch (e) {
        return 'Delete cancelled.'
      }
    }
    if (act.advice) return act.advice
    return getLocalAdvice()
  }

  // Multiple actions – show batch confirmation
  const summary = buildBatchSummary(actions)
  return new Promise((resolve) => {
    batchActions.value = actions
    batchSummary.value = summary
    batchModalVisible.value = true
    batchResolve = resolve
  })
}

async function executeBatch() {
  const actions = [...batchActions.value]
  const results = []
  for (const act of actions) {
    if (act.action === 'create') {
      const res = await createTaskFromData({
        title: act.title,
        category: act.category,
        dueDate: act.dueDate,
        dueTime: act.dueTime,
      })
      results.push(res)
    } else if (act.action === 'update') {
      let taskId = act.taskId
      if (!taskId && act.title) {
        const matches = findTasksByTitle(act.title)
        if (matches.length === 1) taskId = matches[0].id
        else if (matches.length > 1) {
          results.push(`Multiple tasks found for "${act.title}". Skipping update.`)
          continue
        } else {
          results.push(`Task not found: "${act.title}". Skipping update.`)
          continue
        }
      }
      if (!taskId) {
        results.push('No task specified for update. Skipping.')
        continue
      }
      const updates = act.updates || { title: act.title, category: act.category, dueDate: act.dueDate, dueTime: act.dueTime }
      const res = await executeUpdate(taskId, updates)
      results.push(res)
    } else if (act.action === 'delete') {
      let taskId = act.taskId
      if (!taskId && act.title) {
        const matches = findTasksByTitle(act.title)
        if (matches.length === 1) taskId = matches[0].id
        else if (matches.length > 1) {
          results.push(`Multiple tasks found for "${act.title}". Skipping deletion.`)
          continue
        } else {
          results.push(`Task not found: "${act.title}". Skipping deletion.`)
          continue
        }
      }
      if (!taskId) {
        results.push('No task specified for delete. Skipping.')
        continue
      }
      const res = await executeDelete(taskId)
      results.push(res)
    } else if (act.action === 'read') {
      results.push(readTasks())
    } else if (act.advice) {
      results.push(act.advice)
    }
  }
  batchModalVisible.value = false
  batchActions.value = []
  if (batchResolve) batchResolve(results.join('\n'))
  batchResolve = null
}

function cancelBatch() {
  batchModalVisible.value = false
  batchActions.value = []
  if (batchResolve) batchResolve('Batch cancelled.')
  batchResolve = null
}

async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || sending.value) return

  refreshAiSettings()
  if (!activeApiBaseUrl.value) {
    chatMessages.value.push({
      role: 'assistant',
      content: 'Please configure an active AI server or API base URL in Settings before proceeding.',
    })
    return
  }
  if (!selectedModel.value) {
    chatMessages.value.push({
      role: 'assistant',
      content: 'Please load models and choose a primary model in Settings before proceeding.',
    })
    return
  }

  chatMessages.value.push({ role: 'user', content: text })
  chatInput.value = ''
  sending.value = true

  try {
    const primaryPlan = await runChatCompletion(selectedModel.value, text)
    let finalPlan = primaryPlan
    if (useSecondModel.value && secondaryModel.value && secondaryModel.value !== selectedModel.value) {
      const secondPlan = await runChatCompletion(secondaryModel.value, text)
      finalPlan = mergePlans(primaryPlan, secondPlan)
    }
    if (!finalPlan) {
      chatMessages.value.push({
        role: 'assistant',
        content: 'Sorry, I could not understand that. Please try a simpler request, like "Create a task to buy milk".',
      })
    } else {
      const result = await executePlan(finalPlan)
      chatMessages.value.push({ role: 'assistant', content: result })
    }
  } catch (error) {
    console.error(error)
    chatMessages.value.push({ role: 'assistant', content: `AI request failed: ${error.message}` })
  } finally {
    sending.value = false
  }
}

function handleConfirm() {
  if (pendingAction.value) {
    pendingAction.value.resolve()
    pendingAction.value = null
  }
  confirmModalVisible.value = false
}

function handleCancel() {
  if (pendingAction.value) {
    pendingAction.value.reject()
    pendingAction.value = null
  }
  confirmModalVisible.value = false
}

onMounted(() => {
  refreshAiSettings()
  loadData()
  loadChatHistory()
  if (typeof window !== 'undefined') {
    window.addEventListener(AI_SETTINGS_EVENT, refreshAiSettings)
    window.addEventListener('storage', handleStorageChange)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener(AI_SETTINGS_EVENT, refreshAiSettings)
    window.removeEventListener('storage', handleStorageChange)
  }
})
</script>

<template>
  <!-- Template unchanged – same as before -->
  <section class="assistant-page">
    <header class="assistant-head">
      <h1>AI Task Assistant</h1>
      <div class="header-actions">
        <button class="clear-history-btn" @click="clearHistory">Clear History</button>
      </div>
      <p>Uses the AI server or API base configured in Settings. Auth and model selection are managed there.</p>
    </header>

    <article class="panel chat">
      <h2>Assistant Chat</h2>
      <p class="hint">
        Prompts are sent to your selected server. Example: <code>Create a task to prepare slides for Friday</code>,
        <code>Zeige alle Aufgaben</code>, <code>Donne-moi un conseil pour aujourd'hui</code>
      </p>
      <p class="config-summary">
        Server:
        <code>{{ activeServerUrl || 'not configured' }}</code>
        <span class="config-gap">
          API:
          <code>{{ activeApiBaseUrl || 'not configured' }}</code>
        </span>
        <span class="config-gap">
          Primary model:
          <code v-if="selectedModel">{{ selectedModel }}</code>
          <span v-else>not selected</span>
        </span>
        <span v-if="useSecondModel && secondaryModel && secondaryModel !== selectedModel" class="config-gap">
          Second model: <code>{{ secondaryModel }}</code>
        </span>
      </p>
      <div class="messages">
        <div v-for="(message, index) in chatMessages" :key="index" :class="['message', message.role]">
          <strong>{{ message.role === 'assistant' ? 'AI' : 'You' }}:</strong>
          <pre>{{ message.content }}</pre>
        </div>
        <div v-if="loadingTasks" class="loading">Loading tasks...</div>
      </div>
      <div class="chat-row">
        <input
          v-model="chatInput"
          type="text"
          placeholder="Ask in DE/EN/FR..."
          :disabled="sending || loadingTasks"
          @keyup.enter="sendMessage"
        />
        <button :disabled="sending || loadingTasks" @click="sendMessage">{{ sending ? 'Sending...' : 'Send' }}</button>
      </div>
      <div class="row">
        <label for="advice-context">Advice context (optional)</label>
        <input
          id="advice-context"
          v-model="taskDraft.adviceContext"
          type="text"
          placeholder="I only have 30 minutes tonight."
        />
      </div>
    </article>

    <!-- Single action confirmation modal -->
    <Teleport to="body">
      <div v-if="confirmModalVisible" class="modal-overlay" @click.self="handleCancel">
        <div class="modal-card small-modal">
          <div class="modal-header">
            <h3>Confirm Action</h3>
            <button class="close-btn" @click="handleCancel">✕</button>
          </div>
          <div class="modal-body">
            <pre>{{ confirmMessage }}</pre>
          </div>
          <div class="modal-footer">
            <button class="secondary-button" @click="handleCancel">Cancel</button>
            <button class="danger-button" @click="handleConfirm">Confirm</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Batch confirmation modal -->
    <Teleport to="body">
      <div v-if="batchModalVisible" class="modal-overlay" @click.self="cancelBatch">
        <div class="modal-card batch-modal">
          <div class="modal-header">
            <h3>Confirm Batch Actions</h3>
            <button class="close-btn" @click="cancelBatch">✕</button>
          </div>
          <div class="modal-body">
            <p>The AI wants to perform the following actions:</p>
            <pre>{{ batchSummary }}</pre>
            <p>Do you want to proceed?</p>
          </div>
          <div class="modal-footer">
            <button class="secondary-button" @click="cancelBatch">Cancel</button>
            <button class="primary-button" @click="executeBatch">Confirm</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.assistant-page { display: flex; flex-direction: column; gap: 16px; }
.assistant-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.assistant-head h1 { margin: 0 0 6px; }
.assistant-head p { margin: 0; color: #444; width: 100%; }
.header-actions { display: flex; gap: 12px; }
.clear-history-btn { background: #e5e5e2; border: none; border-radius: 999px; padding: 6px 12px; cursor: pointer; font-size: 0.85rem; }
.panel { border: 1px solid #d9d9d9; background: #fff; padding: 16px; }
.panel h2 { margin-top: 0; font-size: 18px; }
.row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
input, select, button { border: 1px solid #cfcfcf; background: #fff; padding: 9px 10px; font-size: 14px; }
button { cursor: pointer; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.danger { border-color: #b54a4a; color: #b54a4a; }
.check { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.status { margin: 0; color: #444; }
.chat .hint { color: #555; margin-top: 0; }
.config-summary { margin: 0 0 12px; color: #555; }
.config-gap { margin-left: 12px; }
.messages { max-height: 260px; overflow: auto; border: 1px solid #e6e6e6; padding: 10px; background: #fafafa; margin-bottom: 10px; }
.message { margin-bottom: 10px; }
.message pre { margin: 4px 0 0; white-space: pre-wrap; font-family: inherit; }
.chat-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; }
.loading { text-align: center; color: #777; font-style: italic; margin-top: 8px; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: white; border-radius: 28px; padding: 24px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.small-modal { max-width: 400px; }
.batch-modal { max-width: 600px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #333; }
.close-btn { background: transparent; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
.modal-body pre { white-space: pre-wrap; margin: 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.secondary-button, .danger-button, .primary-button { border: none; border-radius: 999px; padding: 10px 20px; cursor: pointer; font-weight: 500; }
.primary-button { background: var(--accent); color: white; }
.secondary-button { background: #e5e5e2; color: #303030; }
.danger-button { background: #d32f2f; color: white; }
.danger-button:hover { background: #b71c1c; }
</style>