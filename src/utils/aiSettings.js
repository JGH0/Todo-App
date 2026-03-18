export const DEFAULT_AI_SERVER_URL = 'https://ai.hallenbarter.org'
export const AI_SETTINGS_STORAGE_KEY = 'todo-app.ai-settings'
export const AI_SETTINGS_EVENT = 'todo-app:ai-settings-updated'

const defaultAiSettings = {
  useDefaultServer: true,
  defaultServerUrl: DEFAULT_AI_SERVER_URL,
  defaultApiUrl: '',
  defaultApiKey: '',
  customServerUrl: '',
  customApiUrl: '',
  customApiKey: '',
  models: [],
  primaryModel: '',
  useSecondModel: false,
  secondaryModel: '',
}

function normalizeModelOption(model) {
  if (!model) return null

  if (typeof model === 'string') {
    const value = model.trim()
    return value ? { id: value, label: value } : null
  }

  const id = String(model.id || model.model || model.name || '').trim()
  if (!id) return null

  const label = String(model.label || model.name || model.id || model.model || '').trim() || id
  return { id, label }
}

export function normalizeServerUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : ''
}

function joinUrl(baseUrl, suffix) {
  const base = normalizeServerUrl(baseUrl)
  if (!base) return ''
  return `${base}${suffix.startsWith('/') ? suffix : `/${suffix}`}`
}

function getUrlPathname(url) {
  try {
    return new URL(url).pathname.replace(/\/+$/, '') || '/'
  } catch {
    return '/'
  }
}

function getUrlOrigin(url) {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

function dedupeUrls(urls) {
  return [...new Set(urls.map((url) => normalizeServerUrl(url)).filter(Boolean))]
}

function isApiBasePath(pathname) {
  const lower = pathname.toLowerCase()
  return lower.endsWith('/api') || /\/v\d[^/]*$/.test(lower) || lower.includes('/openai')
}

export function buildModelsEndpointCandidates(baseUrl) {
  const normalizedBaseUrl = normalizeServerUrl(baseUrl)
  if (!normalizedBaseUrl) return []

  const pathname = getUrlPathname(normalizedBaseUrl)
  const lowerPath = pathname.toLowerCase()
  const origin = getUrlOrigin(normalizedBaseUrl)
  const candidates = []

  if (/(\/models|\/api\/models|\/api\/tags|\/v\d[^/]*\/models)$/.test(lowerPath)) {
    candidates.push(normalizedBaseUrl)
  }

  if (isApiBasePath(pathname)) {
    candidates.push(joinUrl(normalizedBaseUrl, '/models'))
    candidates.push(joinUrl(normalizedBaseUrl, '/tags'))
  } else {
    candidates.push(joinUrl(normalizedBaseUrl, '/api/models'))
    candidates.push(joinUrl(normalizedBaseUrl, '/v1/models'))
    candidates.push(joinUrl(normalizedBaseUrl, '/models'))
    candidates.push(joinUrl(normalizedBaseUrl, '/api/tags'))
  }

  if (origin && origin !== normalizedBaseUrl) {
    candidates.push(joinUrl(origin, '/api/models'))
    candidates.push(joinUrl(origin, '/v1/models'))
    candidates.push(joinUrl(origin, '/models'))
    candidates.push(joinUrl(origin, '/api/tags'))
  }

  return dedupeUrls(candidates)
}

export function buildOpenAiChatEndpointCandidates(baseUrl) {
  const normalizedBaseUrl = normalizeServerUrl(baseUrl)
  if (!normalizedBaseUrl) return []

  const pathname = getUrlPathname(normalizedBaseUrl)
  const lowerPath = pathname.toLowerCase()
  const origin = getUrlOrigin(normalizedBaseUrl)
  const candidates = []

  if (/(\/chat\/completions|\/api\/chat\/completions|\/v\d[^/]*\/chat\/completions)$/.test(lowerPath)) {
    candidates.push(normalizedBaseUrl)
  }

  if (isApiBasePath(pathname)) {
    candidates.push(joinUrl(normalizedBaseUrl, '/chat/completions'))
    candidates.push(joinUrl(normalizedBaseUrl, '/chat'))
  } else {
    candidates.push(joinUrl(normalizedBaseUrl, '/api/chat/completions'))
    candidates.push(joinUrl(normalizedBaseUrl, '/v1/chat/completions'))
    candidates.push(joinUrl(normalizedBaseUrl, '/chat/completions'))
    candidates.push(joinUrl(normalizedBaseUrl, '/api/chat'))
  }

  if (origin && origin !== normalizedBaseUrl) {
    candidates.push(joinUrl(origin, '/api/chat/completions'))
    candidates.push(joinUrl(origin, '/v1/chat/completions'))
    candidates.push(joinUrl(origin, '/chat/completions'))
    candidates.push(joinUrl(origin, '/api/chat'))
  }

  return dedupeUrls(candidates)
}

export function buildOllamaChatEndpointCandidates(baseUrl) {
  const normalizedBaseUrl = normalizeServerUrl(baseUrl)
  if (!normalizedBaseUrl) return []

  const pathname = getUrlPathname(normalizedBaseUrl)
  const lowerPath = pathname.toLowerCase()
  const origin = getUrlOrigin(normalizedBaseUrl)
  const candidates = []

  if (/(\/api\/chat|\/chat)$/.test(lowerPath)) {
    candidates.push(normalizedBaseUrl)
  }

  if (isApiBasePath(pathname)) {
    candidates.push(joinUrl(normalizedBaseUrl, '/chat'))
  } else {
    candidates.push(joinUrl(normalizedBaseUrl, '/api/chat'))
    candidates.push(joinUrl(normalizedBaseUrl, '/chat'))
  }

  if (origin && origin !== normalizedBaseUrl) {
    candidates.push(joinUrl(origin, '/api/chat'))
    candidates.push(joinUrl(origin, '/chat'))
  }

  return dedupeUrls(candidates)
}

export function parseModels(payload) {
  const candidates = Array.isArray(payload) ? payload : payload?.data || payload?.models || []
  if (!Array.isArray(candidates)) return []

  return candidates.map(normalizeModelOption).filter(Boolean)
}

export function normalizeAiSettings(settings = {}) {
  const merged = { ...defaultAiSettings, ...(settings || {}) }
  const models = Array.isArray(merged.models)
    ? merged.models.map(normalizeModelOption).filter(Boolean)
    : []

  return {
    useDefaultServer: Boolean(merged.useDefaultServer),
    defaultServerUrl: normalizeServerUrl(merged.defaultServerUrl) || DEFAULT_AI_SERVER_URL,
    defaultApiUrl: normalizeServerUrl(merged.defaultApiUrl),
    defaultApiKey: typeof merged.defaultApiKey === 'string' ? merged.defaultApiKey : '',
    customServerUrl: normalizeServerUrl(merged.customServerUrl),
    customApiUrl: normalizeServerUrl(merged.customApiUrl),
    customApiKey: typeof merged.customApiKey === 'string' ? merged.customApiKey : '',
    models,
    primaryModel: typeof merged.primaryModel === 'string' ? merged.primaryModel : '',
    useSecondModel: Boolean(merged.useSecondModel),
    secondaryModel: typeof merged.secondaryModel === 'string' ? merged.secondaryModel : '',
  }
}

export function getActiveAiConfig(settings = {}) {
  const normalized = normalizeAiSettings(settings)
  const source = normalized.useDefaultServer ? 'default' : 'custom'
  const serverUrl = source === 'default' ? normalized.defaultServerUrl : normalized.customServerUrl
  const apiUrl = source === 'default' ? normalized.defaultApiUrl : normalized.customApiUrl
  const apiKey = source === 'default' ? normalized.defaultApiKey.trim() : normalized.customApiKey.trim()

  return {
    source,
    serverUrl,
    apiUrl,
    requestBaseUrl: apiUrl || serverUrl,
    apiKey,
  }
}

export function loadAiSettings() {
  if (typeof window === 'undefined') {
    return normalizeAiSettings()
  }

  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY)
    return raw ? normalizeAiSettings(JSON.parse(raw)) : normalizeAiSettings()
  } catch {
    return normalizeAiSettings()
  }
}

export function saveAiSettings(settings = {}) {
  const normalized = normalizeAiSettings(settings)

  if (typeof window === 'undefined') {
    return normalized
  }

  try {
    window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent(AI_SETTINGS_EVENT, { detail: normalized }))
  } catch (error) {
    console.error('Unable to save AI settings locally.', error)
  }

  return normalized
}
