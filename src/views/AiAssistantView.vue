<script setup>
import { computed, ref } from 'vue'

const serverUrl = ref('')
const apiKey = ref('')
const models = ref([])
const selectedModel = ref('')
const useSecondModel = ref(false)
const secondaryModel = ref('')
const modelsLoading = ref(false)
const sending = ref(false)
const connectionStatus = ref('Not connected')

const taskDraft = ref({
  title: '',
  category: 'General',
  dueDate: '',
  adviceContext: '',
})

const tasks = ref([
  { id: 1, title: 'Buy groceries', category: 'Home', dueDate: '', completed: false },
  { id: 2, title: 'Plan sprint backlog', category: 'Work', dueDate: '', completed: false },
])

const selectedTaskId = ref(tasks.value[0]?.id ?? null)
const chatInput = ref('')
const chatMessages = ref([
  {
    role: 'assistant',
    content:
      'Hello, I am your AI Assistant. I am ready to help you out :)',
  },
])

const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null)

function syncDraftWithSelectedTask() {
  if (!selectedTask.value) return
  taskDraft.value = {
    title: selectedTask.value.title,
    category: selectedTask.value.category,
    dueDate: selectedTask.value.dueDate,
    adviceContext: taskDraft.value.adviceContext,
  }
}

function getNextId() {
  const ids = tasks.value.map((task) => task.id)
  return ids.length ? Math.max(...ids) + 1 : 1
}

function createTaskFromData(payload) {
  const title = (payload.title || taskDraft.value.title || '').trim()
  if (!title) return 'Please provide a task title.'

  tasks.value.push({
    id: getNextId(),
    title,
    category: (payload.category || taskDraft.value.category || 'General').trim() || 'General',
    dueDate: payload.dueDate || taskDraft.value.dueDate || '',
    completed: false,
  })
  selectedTaskId.value = tasks.value[tasks.value.length - 1].id
  syncDraftWithSelectedTask()
  return `Created task: "${title}".`
}

function readTasks() {
  if (!tasks.value.length) return 'No tasks found.'
  return tasks.value.map((task) => `#${task.id} ${task.title} (${task.category})`).join('\n')
}

function updateTaskFromData(payload) {
  const taskId = Number(payload.taskId) || selectedTask.value?.id
  const task = tasks.value.find((item) => item.id === taskId)
  if (!task) return 'Select a valid task to update.'

  const updates = payload.updates || {}
  const newTitle = (updates.title || taskDraft.value.title || task.title).trim()
  task.title = newTitle
  task.category = (updates.category || taskDraft.value.category || task.category).trim() || 'General'
  task.dueDate = updates.dueDate || taskDraft.value.dueDate || task.dueDate || ''

  selectedTaskId.value = task.id
  syncDraftWithSelectedTask()
  return `Updated task #${task.id}.`
}

function deleteTaskFromData(payload) {
  const taskId = Number(payload.taskId) || selectedTask.value?.id
  if (!taskId) return 'Select a task to delete.'

  const exists = tasks.value.some((item) => item.id === taskId)
  if (!exists) return `Task #${taskId} does not exist.`

  tasks.value = tasks.value.filter((task) => task.id !== taskId)
  selectedTaskId.value = tasks.value[0]?.id ?? null
  if (selectedTask.value) syncDraftWithSelectedTask()
  return `Deleted task #${taskId}.`
}

function getLocalAdvice() {
  const openTasks = tasks.value.filter((task) => !task.completed)
  if (!openTasks.length) {
    return 'Great progress. You have no open tasks. Add one priority task for tomorrow.'
  }
  const topThree = openTasks.slice(0, 3).map((task) => `- ${task.title}`).join('\n')
  return `Focus on these next steps:\n${topThree}`
}

function normalizeBaseUrl() {
  return serverUrl.value.trim().replace(/\/$/, '')
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${normalizeBaseUrl()}${path}`, options)
  if (!response.ok) {
    const raw = await response.text()
    throw new Error(raw || `HTTP ${response.status}`)
  }
  return response.json()
}

function authHeaders() {
  return {
    Authorization: `Bearer ${apiKey.value.trim()}`,
    'Content-Type': 'application/json',
  }
}

function parseModels(payload) {
  const candidate = Array.isArray(payload) ? payload : payload?.data || payload?.models || []
  if (!Array.isArray(candidate)) return []

  return candidate
    .map((item) => {
      if (typeof item === 'string') return { id: item, label: item }
      return {
        id: item.id || item.model || item.name,
        label: item.name || item.id || item.model,
      }
    })
    .filter((item) => item.id)
}

async function loadModels() {
  if (!normalizeBaseUrl() || !apiKey.value.trim()) {
    connectionStatus.value = 'Enter server URL and API key first.';
    return;
  }

  modelsLoading.value = true;
  connectionStatus.value = 'Loading models...';

  try {
    let payload;
    try {
      payload = await requestJson('/api/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey.value.trim()}` },
      });
    } catch {
      payload = await requestJson('/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey.value.trim()}` },
      });
    }

    const fetchedModels = parseModels(payload);

    // Filter the models to include only the 'aya:8b' model
    const specificModelId = 'aya:8b';
    const filteredModels = fetchedModels.filter(model => model.id === specificModelId);

    models.value = filteredModels;

    if (!models.value.length) {
      connectionStatus.value = 'Connected, but no models returned.';
      return;
    }

    // Set selectedModel and secondaryModel to 'aya:8b' if available
    selectedModel.value = models.value.length > 0 ? models.value[0].id : '';
    secondaryModel.value = models.value.length > 0 ? models.value[0].id : '';

    connectionStatus.value = `Connected. Loaded ${models.value.length} model(s).`;
  } catch (error) {
    connectionStatus.value = `Connection failed: ${error.message}`;
    models.value = [];
  } finally {
    modelsLoading.value = false;
  }
}

function buildPlannerPrompt(userText) {
  return [
    'You are a task assistant. Decide exactly one action for the todo app.',
    'Allowed actions: create, read, update, delete, advice.',
    'Output JSON only. No markdown.',
    'JSON schema:',
    '{"action":"create|read|update|delete|advice","title":"","taskId":0,"category":"","dueDate":"","updates":{"title":"","category":"","dueDate":""},"advice":""}',
    `Current tasks: ${JSON.stringify(tasks.value)}`,
    `Selected task id: ${selectedTaskId.value || 0}`,
    `Advice context: ${taskDraft.value.adviceContext || ''}`,
    `User request: ${userText}`,
  ].join('\n')
}

function extractJsonObject(text) {
  const cleaned = text.replace(/```json|```/gi, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

async function runChatCompletion(modelId, userText) {
  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: 'Return only valid JSON object.' },
      { role: 'user', content: buildPlannerPrompt(userText) },
    ],
    stream: false,
    temperature: 0.2,
  }

  let payload
  try {
    payload = await requestJson('/api/chat/completions', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
  } catch {
    payload = await requestJson('/v1/chat/completions', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
  }

  const content = payload?.choices?.[0]?.message?.content || ''
  return extractJsonObject(content)
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

function executePlan(plan) {
  const safePlan = plan || { action: 'advice' }

  if (safePlan.action === 'create') {
    return createTaskFromData({
      title: safePlan.title,
      category: safePlan.category,
      dueDate: safePlan.dueDate,
    })
  }

  if (safePlan.action === 'read') {
    return readTasks()
  }

  if (safePlan.action === 'update') {
    return updateTaskFromData({
      taskId: safePlan.taskId,
      updates: safePlan.updates || {
        title: safePlan.title,
        category: safePlan.category,
        dueDate: safePlan.dueDate,
      },
    })
  }

  if (safePlan.action === 'delete') {
    return deleteTaskFromData({ taskId: safePlan.taskId })
  }

  if (safePlan.advice) return safePlan.advice
  return getLocalAdvice()
}

async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || sending.value) return

  if (!normalizeBaseUrl() || !apiKey.value.trim()) {
    chatMessages.value.push({ role: 'assistant', content: 'Please configure the server URL and API key in settings before proceeding.' })
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

    const result = executePlan(finalPlan)
    chatMessages.value.push({ role: 'assistant', content: result })
  } catch (error) {
    chatMessages.value.push({ role: 'assistant', content: `AI request failed: ${error.message}` })
  } finally {
    sending.value = false
  }
}

syncDraftWithSelectedTask()
</script>

<template>
  <section class="assistant-page">
    <header class="assistant-head">
      <h1>AI Task Assistant</h1>
      <p>Uses your Open-WebUI server. Model options are fetched live from the server each time you load models.</p>
    </header>

    <article class="panel chat">
      <h2>Assistant Chat</h2>
      <p class="hint">
        Prompts are sent to your selected server. Example: <code>Create a task to prepare slides for Friday</code>,
        <code>Zeige alle Aufgaben</code>, <code>Donne-moi un conseil pour aujourd'hui</code>
      </p>
      <div class="messages">
        <div v-for="(message, index) in chatMessages" :key="index" :class="['message', message.role]">
          <strong>{{ message.role === 'assistant' ? 'AI' : 'You' }}:</strong>
          <pre>{{ message.content }}</pre>
        </div>
      </div>
      <div class="chat-row">
        <input
          v-model="chatInput"
          type="text"
          placeholder="Ask in DE/EN/FR..."
          :disabled="sending"
          @keyup.enter="sendMessage"
        />
        <button :disabled="sending" @click="sendMessage">{{ sending ? 'Sending...' : 'Send' }}</button>
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
  </section>
</template>

<style scoped>
.assistant-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assistant-head h1 {
  margin: 0 0 6px;
}

.assistant-head p {
  margin: 0;
  color: #444;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  border: 1px solid #d9d9d9;
  background: #fff;
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

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

input,
select,
button {
  border: 1px solid #cfcfcf;
  background: #fff;
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
  color: #444;
}

.chat .hint {
  color: #555;
  margin-top: 0;
}

.messages {
  max-height: 260px;
  overflow: auto;
  border: 1px solid #e6e6e6;
  padding: 10px;
  background: #fafafa;
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

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
