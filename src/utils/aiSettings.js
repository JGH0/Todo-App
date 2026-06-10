// ── AI Settings ─────────────────────────────────────────────────────────────
// Default server + custom server model. Each server has multiple API endpoints,
// each endpoint can have its own models. All models are combined into one list.

export const AI_SETTINGS_STORAGE_KEY = "todo-app.ai-settings-v2"
export const AI_SETTINGS_EVENT = "todo-app:ai-settings-updated"

const defaultSettings = {
	useDefaultServer: true,

	defaultServer: {
		baseUrl: "https://api.openai.com/v1",
		apiKey: "",
		apikeys: [], // additional API endpoints [{id, url, key, label, models: []}]
		models: [],   // loaded from endpoint(s)
		customModels: [], // manually typed
	},

	customServer: {
		baseUrl: "",
		apiKey: "",
		apikeys: [],
		models: [],
		customModels: [],
	},

	primaryModel: "",
	useSecondModel: false,
	secondaryModel: "",
}

function generateId() { return "ep_" + Math.random().toString(36).substring(2, 8) }

function stripUrl(url) {
	return typeof url === "string" ? url.trim().replace(/\/+$/, "") : ""
}

function normalizeApikeys(list) {
	if (!Array.isArray(list)) return []
	return list.map(a => ({
		id: a.id || generateId(),
		url: stripUrl(a.url),
		key: typeof a.key === "string" ? a.key : "",
		label: typeof a.label === "string" ? a.label : "",
		models: Array.isArray(a.models) ? a.models.filter(Boolean) : [],
	})).filter(a => a.url)
}

function normalizeServer(server) {
	if (!server || typeof server !== "object") {
		return { baseUrl: "", apiKey: "", apikeys: [], models: [], customModels: [] }
	}
	return {
		baseUrl: stripUrl(server.baseUrl),
		apiKey: typeof server.apiKey === "string" ? server.apiKey : "",
		apikeys: normalizeApikeys(server.apikeys),
		models: Array.isArray(server.models) ? server.models.filter(Boolean) : [],
		customModels: Array.isArray(server.customModels) ? server.customModels.filter(Boolean) : [],
	}
}

export function normalizeAiSettings(settings = {}) {
	if (!settings || typeof settings !== "object") {
		return JSON.parse(JSON.stringify(defaultSettings))
	}

	return {
		useDefaultServer: settings.useDefaultServer !== false,
		defaultServer: normalizeServer(settings.defaultServer),
		customServer: normalizeServer(settings.customServer),
		primaryModel: typeof settings.primaryModel === "string" ? settings.primaryModel : "",
		useSecondModel: settings.useSecondModel === true,
		secondaryModel: typeof settings.secondaryModel === "string" ? settings.secondaryModel : "",
	}
}

export function getAllModels(settings) {
	if (!settings) return []
	const s = settings.useDefaultServer ? settings.defaultServer : settings.customServer
	if (!s) return []
	const fromBase = s.models || []
	const fromCustom = s.customModels || []
	const fromApikeys = (s.apikeys || []).flatMap(a => a.models || [])
	return [...new Set([...fromBase, ...fromCustom, ...fromApikeys])]
}

export function getActiveConfig(settings) {
	const s = normalizeAiSettings(settings)
	const server = s.useDefaultServer ? s.defaultServer : s.customServer
	return {
		baseUrl: server.baseUrl,
		apiKey: server.apiKey,
		allModels: getAllModels(s),
	}
}

// ── Persistence ─────────────────────────────────────────────────────────────

export function loadAiSettings() {
	if (typeof window === "undefined") return normalizeAiSettings()
	try {
		const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY)
		if (raw) return normalizeAiSettings(JSON.parse(raw))
		// Try old key for migration
		const oldRaw = window.localStorage.getItem("todo-app.ai-settings")
		if (oldRaw) {
			const old = JSON.parse(oldRaw)
			// Convert old format to new
			const migrated = migrateOldSettings(old)
			saveAiSettings(migrated)
			return migrated
		}
		return normalizeAiSettings()
	} catch {
		return normalizeAiSettings()
	}
}

function migrateOldSettings(old) {
	// Old format had providers array or defaultServer/customServer without apikeys
	const result = normalizeAiSettings()
	if (old.providers && Array.isArray(old.providers)) {
		// Take first as default, rest as extra apis
		const first = old.providers[0]
		result.defaultServer.baseUrl = first.baseUrl || ""
		result.defaultServer.apiKey = first.apiKey || ""
		result.defaultServer.customModels = first.customModels || []
		result.defaultServer.models = first._loadedModels || []
		if (old.activeProviderId && first.id !== old.activeProviderId) {
			const active = old.providers.find(p => p.id === old.activeProviderId)
			if (active) {
				result.customServer.baseUrl = active.baseUrl || ""
				result.customServer.apiKey = active.apiKey || ""
				result.customServer.customModels = active.customModels || []
				result.customServer.models = active._loadedModels || []
				result.useDefaultServer = false
			}
		}
	}
	if (old.primaryModel) result.primaryModel = old.primaryModel
	if (old.useSecondModel) result.useSecondModel = true
	if (old.secondaryModel) result.secondaryModel = old.secondaryModel
	return result
}

export function saveAiSettings(settings = {}) {
	const normalized = normalizeAiSettings(settings)
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(normalized))
			window.dispatchEvent(new CustomEvent(AI_SETTINGS_EVENT, { detail: normalized }))
		} catch (error) {
			console.error("Unable to save AI settings.", error)
		}
	}
	return normalized
}

// ── Legacy helpers for AiAssistantView ──────────────────────────────────────
export function getActiveAiConfig(settings = {}) {
	const s = normalizeAiSettings(settings)
	const server = s.useDefaultServer ? s.defaultServer : s.customServer
	return {
		source: s.useDefaultServer ? "default" : "custom",
		serverUrl: server.baseUrl,
		apiUrl: server.baseUrl,
		requestBaseUrl: server.baseUrl,
		apiKey: server.apiKey,
	}
}

export { stripUrl as normalizeServerUrl }

// ── Endpoint discovery ──────────────────────────────────────────────────────

function getUrlOrigin(url) {
	try { return new URL(url).origin }
	catch { return "" }
}

function getUrlPathname(url) {
	try { return new URL(url).pathname.replace(/\/+$/, "") || "/" }
	catch { return "/" }
}

function isApiBasePath(p) {
	const l = p.toLowerCase()
	return l.endsWith("/api") || /\/v\d[^/]*$/.test(l) || l.includes("/openai")
}

function joinUrl(base, suffix) {
	const b = stripUrl(base)
	if (!b) return ""
	return `${b}${suffix.startsWith("/") ? suffix : `/${suffix}`}`
}

function dedupe(urls) { return [...new Set(urls.map(stripUrl).filter(Boolean))] }

export function buildModelsEndpointCandidates(baseUrl) {
	const url = stripUrl(baseUrl)
	if (!url) return []
	const pathname = getUrlPathname(url)
	const lp = pathname.toLowerCase()
	const origin = getUrlOrigin(url)
	const c = []

	if (/(\/models|\/api\/models|\/api\/tags|\/v\d[^/]*\/models)$/.test(lp)) c.push(url)
	if (isApiBasePath(pathname)) {
		c.push(joinUrl(url, "/models"), joinUrl(url, "/tags"))
	} else {
		c.push(joinUrl(url, "/api/models"), joinUrl(url, "/v1/models"), joinUrl(url, "/models"), joinUrl(url, "/api/tags"))
	}
	if (origin && origin !== url) {
		c.push(joinUrl(origin, "/api/models"), joinUrl(origin, "/v1/models"), joinUrl(origin, "/models"), joinUrl(origin, "/api/tags"))
	}
	return dedupe(c)
}

export function buildChatEndpoint(baseUrl) {
	const url = stripUrl(baseUrl)
	if (!url) return ""
	return joinUrl(url, "/chat/completions")
}

export function buildOllamaChatEndpoint(baseUrl) {
	const url = stripUrl(baseUrl)
	if (!url) return ""
	return joinUrl(url, "/api/chat")
}

export function buildModelsEndpointCandidatesForUrl(url) {
	return buildModelsEndpointCandidates(url)
}

export function parseModels(payload) {
	const items = Array.isArray(payload) ? payload : payload?.data || payload?.models || []
	if (!Array.isArray(items)) return []
	return items.map(m => {
		if (!m) return null
		if (typeof m === "string") return m.trim() || null
		return String(m.id || m.model || m.name || "").trim() || null
	}).filter(Boolean)
}

// Legacy – kept so imports in AiAssistantView still work
export function buildOpenAiChatEndpointCandidates(baseUrl) {
	const url = stripUrl(baseUrl)
	return url ? [joinUrl(url, "/chat/completions")] : []
}

export function buildOllamaChatEndpointCandidates(baseUrl) {
	return [buildOllamaChatEndpoint(baseUrl)].filter(Boolean)
}
