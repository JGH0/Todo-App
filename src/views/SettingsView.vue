<script setup>
import { computed, ref, watch } from 'vue'
import {
  buildModelsEndpointCandidates,
  DEFAULT_AI_SERVER_URL,
  getActiveAiConfig,
  loadAiSettings,
  parseModels,
  saveAiSettings,
} from '@/utils/aiSettings'

const form = ref(loadAiSettings())
const modelsLoading = ref(false)
const connectionStatus = ref(getInitialStatus())

const activeConfig = computed(() => getActiveAiConfig(form.value))
const activeEndpointSignature = computed(
  () => `${activeConfig.value.source}:${activeConfig.value.requestBaseUrl}`,
)

function getInitialStatus() {
  const settings = loadAiSettings()
  const active = getActiveAiConfig(settings)

  if (!active.requestBaseUrl) {
    return 'Configure the active server URL or API base URL to load models.'
  }

  if (settings.models.length) {
    return `Saved ${settings.models.length} model option(s). Refresh to reload from the active profile.`
  }

  return 'Load models from the active profile.'
}

function authHeaders() {
  const headers = {}

  if (activeConfig.value.apiKey) {
    headers.Authorization = `Bearer ${activeConfig.value.apiKey}`
  }

  return headers
}

async function requestJson(options = {}) {
  const urls = buildModelsEndpointCandidates(activeConfig.value.requestBaseUrl)
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

  throw lastError || new Error(`No model endpoint could be reached from ${activeConfig.value.requestBaseUrl}`)
}

function getPreferredSecondaryModel() {
  return (
    form.value.models.find((model) => model.id !== form.value.primaryModel)?.id ||
    form.value.primaryModel ||
    ''
  )
}

function syncModelSelection() {
  if (!form.value.models.length) {
    form.value.primaryModel = ''
    form.value.secondaryModel = ''
    return
  }

  const modelIds = new Set(form.value.models.map((model) => model.id))

  if (!modelIds.has(form.value.primaryModel)) {
    form.value.primaryModel = form.value.models[0].id
  }

  if (!modelIds.has(form.value.secondaryModel)) {
    form.value.secondaryModel = getPreferredSecondaryModel()
  }

  if (
    form.value.useSecondModel &&
    form.value.models.length > 1 &&
    form.value.secondaryModel === form.value.primaryModel
  ) {
    form.value.secondaryModel = getPreferredSecondaryModel()
  }
}

async function loadModels() {
  if (!activeConfig.value.requestBaseUrl) {
    connectionStatus.value = 'Configure the active server URL or API base URL first.'
    return
  }

  modelsLoading.value = true
  connectionStatus.value = 'Loading models...'

  try {
    const payload = await requestJson({
      method: 'GET',
      headers: authHeaders(),
    })

    form.value.models = parseModels(payload)
    syncModelSelection()

    if (!form.value.models.length) {
      connectionStatus.value = 'Connected, but no models were returned.'
      return
    }

    connectionStatus.value = `Connected. Loaded ${form.value.models.length} model(s).`
  } catch (error) {
    connectionStatus.value = `Connection failed: ${error.message}`
    form.value.models = []
    form.value.primaryModel = ''
    form.value.secondaryModel = ''
  } finally {
    modelsLoading.value = false
  }
}

watch(
  form,
  (value) => {
    saveAiSettings(value)
  },
  { deep: true },
)

watch(activeEndpointSignature, (next, previous) => {
  if (!previous || previous === next) return

  form.value.models = []
  form.value.primaryModel = ''
  form.value.secondaryModel = ''
  connectionStatus.value = activeConfig.value.requestBaseUrl
    ? 'Connection target changed. Load models for this profile.'
    : 'Configure the active server URL or API base URL to load models.'
})

watch(
  () => form.value.primaryModel,
  () => {
    if (
      form.value.useSecondModel &&
      form.value.models.length > 1 &&
      form.value.secondaryModel === form.value.primaryModel
    ) {
      form.value.secondaryModel = getPreferredSecondaryModel()
    }
  },
)

watch(
  () => form.value.useSecondModel,
  (enabled) => {
    if (enabled && !form.value.secondaryModel) {
      form.value.secondaryModel = getPreferredSecondaryModel()
    }
  },
)
</script>

<template>
  <section class="settings-page">
    <header class="page-head">
      <h1>Settings</h1>
      <p>Settings are saved automatically in this browser.</p>
    </header>

    <div class="settings-grid">
      <article class="panel">
        <h2>Server & Auth</h2>

        <label class="toggle">
          <input v-model="form.useDefaultServer" type="checkbox" />
          <span>Use default server</span>
        </label>

        <p class="hint">
          The default server starts at <code>{{ DEFAULT_AI_SERVER_URL }}</code>, but both server profiles can be
          customized. You can also override the API base URL for providers like OpenAI or Google.
        </p>

        <div class="server-block" :class="{ active: form.useDefaultServer }">
          <h3>Default server</h3>
          <div class="row">
            <label for="default-server-url">Server URL (optional)</label>
            <input
              id="default-server-url"
              v-model="form.defaultServerUrl"
              type="url"
              placeholder="https://ai.hallenbarter.org"
            />
          </div>
          <div class="row">
            <label for="default-api-url">API base URL</label>
            <input
              id="default-api-url"
              v-model="form.defaultApiUrl"
              type="url"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div class="row">
            <label for="default-api-key">API key</label>
            <input
              id="default-api-key"
              v-model="form.defaultApiKey"
              type="password"
              placeholder="Optional if your API/server is open"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="server-block" :class="{ active: !form.useDefaultServer }">
          <h3>Custom server</h3>
          <div class="row">
            <label for="custom-server-url">Custom domain / URL (optional)</label>
            <input
              id="custom-server-url"
              v-model="form.customServerUrl"
              type="url"
              placeholder="https://your-server.example"
            />
          </div>
          <div class="row">
            <label for="custom-api-url">Custom API base URL</label>
            <input
              id="custom-api-url"
              v-model="form.customApiUrl"
              type="url"
              placeholder="https://generativelanguage.googleapis.com/v1beta/openai"
            />
          </div>
          <div class="row">
            <label for="custom-api-key">Custom API key</label>
            <input
              id="custom-api-key"
              v-model="form.customApiKey"
              type="password"
              placeholder="Paste the key for your custom API or server"
              autocomplete="off"
            />
          </div>
        </div>

        <p class="active-line">
          Active profile:
          <strong>{{ form.useDefaultServer ? 'Default server' : 'Custom server' }}</strong>
          <span v-if="activeConfig.serverUrl">
            server <code>{{ activeConfig.serverUrl }}</code>
          </span>
          <span v-if="activeConfig.apiUrl">
            API <code>{{ activeConfig.apiUrl }}</code>
          </span>
        </p>

        <div class="actions">
          <button :disabled="modelsLoading" @click="loadModels">
            {{ modelsLoading ? 'Loading models...' : 'Load Models' }}
          </button>
          <button :disabled="modelsLoading" @click="loadModels">Refresh</button>
        </div>

        <p class="status">{{ connectionStatus }}</p>
      </article>

      <article class="panel">
        <h2>Model Setup</h2>

        <div class="row">
          <label for="primary-model">Primary model</label>
          <select id="primary-model" v-model="form.primaryModel" :disabled="!form.models.length">
            <option value="">
              {{ form.models.length ? 'Select model from server' : 'Load models from the active server first' }}
            </option>
            <option v-for="model in form.models" :key="model.id" :value="model.id">
              {{ model.label }}
            </option>
          </select>
        </div>

        <label class="toggle">
          <input v-model="form.useSecondModel" type="checkbox" :disabled="!form.models.length" />
          <span>Combine with second model for higher accuracy</span>
        </label>

        <div v-if="form.useSecondModel" class="row">
          <label for="secondary-model">Secondary model</label>
          <select id="secondary-model" v-model="form.secondaryModel" :disabled="!form.models.length">
            <option value="">
              {{ form.models.length ? 'Select second model' : 'Load models first' }}
            </option>
            <option v-for="model in form.models" :key="`secondary-${model.id}`" :value="model.id">
              {{ model.label }}
            </option>
          </select>
        </div>

        <p class="hint">
          Compatible endpoints are detected from the active connection target. OpenAI-style and Ollama-style model lists are both
          supported. Use a base URL such as <code>https://api.openai.com/v1</code>, not the full endpoint path.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head h1 {
  margin: 0 0 6px;
}

.page-head p {
  margin: 0;
  color: #555;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 16px;
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.panel h3 {
  margin: 0 0 10px;
  font-size: 15px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.toggle input {
  margin: 0;
}

.server-block {
  border: 1px solid #d9d9d9;
  padding: 14px;
  margin-bottom: 12px;
  background: #fafafa;
}

.server-block.active {
  border-color: #111;
  background: #fff;
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

button:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.hint,
.status,
.active-line {
  margin: 0;
  color: #555;
}

.hint {
  margin-bottom: 12px;
}

code {
  font-family: monospace;
}

@media (max-width: 960px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
