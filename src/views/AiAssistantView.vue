<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AI_SETTINGS_EVENT,
  AI_SETTINGS_STORAGE_KEY,
  findProviderForModel,
  getAllModels,
  getActiveAiConfig,
  loadAiSettings,
  normalizeAiSettings,
  normalizeServerUrl,
  saveAiSettings,
} from '@/utils/aiSettings'
import { getTodos, createTodo, updateTodo, deleteTodo } from '@/services/todoService'
import { getCategories, createCategory } from '@/services/categoryService'

const CHATS_STORAGE_KEY = 'ai-assistant-chats-v2'
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

// ── Multi-chat sessions ────────────────────────────────────────────────────
const chats = ref([])
const activeChatId = ref(null)

const activeChat = computed(() => {
  return chats.value.find(c => c.id === activeChatId.value) || chats.value[0] || null
})

const chatMessages = computed({
  get: () => activeChat.value?.messages || [],
  set: (val) => { if (activeChat.value) activeChat.value.messages = val; }
})

// Confirmation modal
const pendingAction = ref(null)
const confirmMessage = ref('')
const confirmModalVisible = ref(false)

// Batch actions
const batchActions = ref([])
const batchSummary = ref('')
const batchModalVisible = ref(false)
let batchResolve = null

// ── Model & config ─────────────────────────────────────────────────────────
const allModels = computed(() => getAllModels(aiSettings.value))
const chatModel = ref('')

const activeConfig = computed(() => getActiveAiConfig(aiSettings.value))
const activeServerUrl = computed(() => normalizeServerUrl(activeConfig.value.serverUrl))
const activeApiBaseUrl = computed(() => normalizeServerUrl(activeConfig.value.requestBaseUrl))

const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null)

function generateChatId() {
  return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6)
}

// Persist chats
function saveChats() {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats.value))
  } catch (e) {
    console.error('Failed to save chats', e)
  }
}

function loadChats() {
  try {
    const saved = localStorage.getItem(CHATS_STORAGE_KEY)
    if (saved) {
      chats.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load chats', e)
  }
  if (!chats.value || !chats.value.length) {
    chats.value = [{
      id: generateChatId(),
      title: 'Chat 1',
      createdAt: Date.now(),
      messages: [{
        role: 'assistant',
        content: 'Hello, I am your AI Assistant. I am ready to help you out :)',
      }],
    }]
  }
  if (!activeChatId.value || !chats.value.find(c => c.id === activeChatId.value)) {
    activeChatId.value = chats.value[0].id
  }
}

function createNewChat() {
  const num = chats.value.length + 1
  const chat = {
    id: generateChatId(),
    title: 'Chat ' + num,
    createdAt: Date.now(),
    messages: [{
      role: 'assistant',
      content: 'New chat started. How can I help you?',
    }],
  }
  chats.value.push(chat)
  activeChatId.value = chat.id
  chatInput.value = ''
  saveChats()
}

function switchChat(id) {
  activeChatId.value = id
  chatInput.value = ''
}

function deleteChat(id) {
  if (chats.value.length <= 1) {
    // Clear instead
    const chat = chats.value[0]
    chat.messages = [{ role: 'assistant', content: 'Chat cleared. Start a new conversation.' }]
    saveChats()
    return
  }
  const idx = chats.value.findIndex(c => c.id === id)
  chats.value.splice(idx, 1)
  if (activeChatId.value === id) {
    activeChatId.value = chats.value[Math.min(idx, chats.value.length - 1)].id
  }
  saveChats()
}

function clearCurrentChat() {
  if (activeChat.value) {
    activeChat.value.messages = [{
      role: 'assistant',
      content: 'Chat cleared. Start a new conversation.',
    }]
    saveChats()
  }
}

function renameChat(id) {
  const chat = chats.value.find(c => c.id === id)
  if (!chat) return
  const name = prompt('Chat name:', chat.title)
  if (name && name.trim()) {
    chat.title = name.trim()
    saveChats()
  }
}

watch(chats, () => { saveChats() }, { deep: true })

// Set default model from settings
watch(aiSettings, (s) => {
  if (!chatModel.value && getAllModels(s).length > 0) {
    chatModel.value = s.primaryModel || getAllModels(s)[0]
  }
}, { immediate: true, deep: true })

function refreshAiSettings() {
  aiSettings.value = loadAiSettings()
  if (!chatModel.value && allModels.value.length > 0) {
    chatModel.value = aiSettings.value.primaryModel || allModels.value[0]
  }
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

function authHeaders(modelId) {
  const headers = { 'Content-Type': 'application/json' }
  // Try to find the provider for this specific model
  let apiKey = activeConfig.value.apiKey
  if (modelId) {
    const n = normalizeAiSettings(aiSettings.value)
    const prov = findProviderForModel(n, modelId)
    if (prov && prov.apiKey) apiKey = prov.apiKey
  }
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
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
  if (!chatModel.value && !selectedModel.value) {
    chatMessages.value.push({
      role: 'assistant',
      content: 'Please select a model from the dropdown or configure one in Settings.',
    })
    return
  }

  chatMessages.value.push({ role: 'user', content: text })
  chatInput.value = ''
  sending.value = true

  try {
    let finalResponse = await runChatCompletion(chatModel.value || selectedModel.value, text)
    
    // Verification loop: secondary model reviews and requests corrections (max 5 rounds)
    if (aiSettings.value.useSecondModel && aiSettings.value.secondaryModel && aiSettings.value.secondaryModel !== (chatModel.value || selectedModel.value)) {
      const verifierModel = aiSettings.value.secondaryModel
      const primaryModel = chatModel.value || selectedModel.value
      let rounds = 0
      const maxRounds = 5

      while (rounds < maxRounds) {
        rounds++
        // Ask verifier to check the response
        const reviewPrompt = `Review the following AI response for any errors, inaccuracies, or improvements needed. If it's correct, respond with only "VERIFIED". If changes are needed, explain what should be fixed.

Response to review:
${finalResponse}`
        const review = await runChatCompletion(verifierModel, reviewPrompt)
        
        if (review.includes('VERIFIED') || rounds >= maxRounds) {
          break
        }
        
        // Send feedback back to primary model for correction
        const correctionPrompt = `Your previous response was reviewed and the following issues were found:

${review}

Please provide a corrected version of your response addressing these issues. Original question was: ${text}`
        finalResponse = await runChatCompletion(primaryModel, correctionPrompt)
      }
    }
    
    if (!finalResponse) {
      chatMessages.value.push({
        role: 'assistant',
        content: 'Sorry, I could not understand that. Please try a simpler request, like "Create a task to buy milk".',
      })
    } else {
      chatMessages.value.push({ role: 'assistant', content: finalResponse })
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
      <div class="head-left">
        <h1>AI Assistant</h1>
        <button class="new-chat-btn" @click="createNewChat" title="New chat">+ New Chat</button>
      </div>
      <div class="head-right">
        <select v-model="chatModel" class="model-select">
          <option value="">Select model</option>
          <option v-for="m in allModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <button class="clear-history-btn" @click="clearCurrentChat">Clear</button>
      </div>
    </header>

    <div class="chat-layout">
      <!-- Sidebar: chat list -->
      <aside class="chat-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">Chats</span>
        </div>
        <div class="chat-list">
          <div
            v-for="chat in chats"
            :key="chat.id"
            class="chat-list-item"
            :class="{ active: chat.id === activeChatId }"
            @click="switchChat(chat.id)"
          >
            <span class="chat-title" @dblclick.stop="renameChat(chat.id)">{{ chat.title }}</span>
            <button class="chat-delete" @click.stop="deleteChat(chat.id)" title="Delete chat">&times;</button>
          </div>
        </div>
      </aside>

      <!-- Main chat area -->
      <article class="panel chat-main">
        <p class="hint" style="margin-top: 0;">
          Model: <strong>{{ chatModel || 'not selected' }}</strong>
          &mdash; Prompts are sent to your configured AI server.
          Examples: <code>Create a task to prepare slides for Friday</code>,
          <code>Zeige alle Aufgaben</code>, <code>Donne-moi un conseil</code>
        </p>
      <p class="config-summary" style="font-size: 0.8em;">
        Server: <code>{{ activeServerUrl || 'not configured' }}</code>
        <span v-if="aiSettings.useSecondModel && aiSettings.secondaryModel && aiSettings.secondaryModel !== chatModel" class="config-gap">
          + second model: <code>{{ aiSettings.secondaryModel }}</code>
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
    </div>

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
.assistant-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assistant-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.assistant-head h1 {
  margin: 0 0 6px;
}

.assistant-head p {
  margin: 0;
  color: var(--text-muted);
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.clear-history-btn {
  background: var(--chip);
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text);
}

.panel {
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 16px;
}

.panel h2 {
  margin-top: 0;
  font-size: 18px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

input,
select,
button {
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  padding: 9px 10px;
  font-size: 14px;
}

button {
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.danger {
  border-color: #b54a4a;
  color: #b54a4a;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status {
  margin: 0;
  color: var(--text-muted);
}

.chat .hint {
  color: var(--text-muted);
  margin-top: 0;
}

.config-summary {
  margin: 0 0 12px;
  color: var(--text-muted);
}

.config-gap {
  margin-left: 12px;
}

.messages {
  max-height: 260px;
  overflow: auto;
  border: 1px solid var(--border);
  padding: 10px;
  background: var(--surface-muted);
  margin-bottom: 10px;
}

.message {
  margin-bottom: 10px;
}

.message pre {
  margin: 4px 0 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.chat-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-bottom: 12px;
}

.loading {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 8px;
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
  background: var(--modal-bg);
  color: var(--text);
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

.batch-modal {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-strong);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: var(--text);
}

.modal-body pre {
  white-space: pre-wrap;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.secondary-button,
.danger-button,
.primary-button {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 500;
}

.primary-button {
  background: var(--accent);
  color: var(--accent-text);
}

.secondary-button {
  background: var(--chip);
  color: var(--text);
}

.danger-button {
  background: #d32f2f;
  color: white;
}

.danger-button:hover {
  background: #b71c1c;
}

/* ── Multi-chat sidebar ───────────────────────────────────────────────────── */
.chat-layout {
  display: flex;
  gap: 12px;
  height: calc(100vh - 200px);
  min-height: 400px;
}
.chat-sidebar {
  width: 200px;
  min-width: 160px;
  background: var(--surface, #f5f5f5);
  border: 1px solid var(--border, #ddd);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border, #ddd);
  font-weight: 600;
  font-size: 0.85em;
}
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}
.chat-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  margin-bottom: 2px;
  transition: background 0.15s;
}
.chat-list-item:hover {
  background: var(--surface-strong, #e8e8e8);
}
.chat-list-item.active {
  background: var(--accent-soft, #cce9f5);
  font-weight: 600;
}
.chat-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chat-delete {
  background: none;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  font-size: 1.1em;
  padding: 0 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.chat-list-item:hover .chat-delete {
  opacity: 1;
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header with model selector ──────────────────────────────────────────── */
.assistant-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.head-left h1 {
  margin: 0;
  font-size: 1.3em;
}
.head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 140px;
}
.new-chat-btn {
  padding: 5px 14px;
  background: var(--accent, #0077B6);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  white-space: nowrap;
}
.new-chat-btn:hover {
  opacity: 0.9;
}
.model-select {
  padding: 5px 10px;
  border: 1px solid var(--border, #ccc);
  border-radius: 5px;
  background: var(--surface, #fff);
  color: var(--text, #333);
  font-size: 0.85em;
  min-width: 160px;
}
.clear-history-btn {
  padding: 5px 12px;
  border: 1px solid var(--border, #ccc);
  border-radius: 5px;
  background: var(--surface, #fff);
  color: var(--text, #333);
  cursor: pointer;
  font-size: 0.85em;
}
.clear-history-btn:hover {
  background: var(--surface-strong, #eee);
}

</style>