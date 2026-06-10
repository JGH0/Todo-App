// ── AI Settings ─────────────────────────────────────────────────────────────
// Multiple AI providers (OpenAI, DeepSeek, Anthropic, Google, Ollama, etc.)
// Each provider has its own URL, API key, and models.
// All models from all providers are shown in a combined list.

export const AI_SETTINGS_STORAGE_KEY = "todo-app.ai-settings-v2"
export const AI_SETTINGS_EVENT = "todo-app:ai-settings-updated"

function genId() {
	return "prov_" + Math.random().toString(36).substring(2, 8)
}

const defaults = {
	providers: [
		{
			id: genId(),
			name: "Default",
			baseUrl: "https://api.openai.com/v1",
			apiKey: "",
			models: [],
			customModels: [],
		},
	],
	primaryModel: "",
	useSecondModel: false,
	secondaryModel: "",
}

function stripUrl(url) {
	return typeof url === "string" ? url.trim().replace(/\/+$/, "") : ""
}

export function normalizeAiSettings(settings = {}) {
	if (!settings || typeof settings !== "object") return JSON.parse(JSON.stringify(defaults))

	const providers = (Array.isArray(settings.providers) ? settings.providers : []).map(p => ({
		id: p.id || genId(),
		name: typeof p.name === "string" ? p.name : "Provider",
		baseUrl: stripUrl(p.baseUrl),
		apiKey: typeof p.apiKey === "string" ? p.apiKey : "",
		models: Array.isArray(p.models) ? p.models.filter(Boolean) : [],
		customModels: Array.isArray(p.customModels) ? p.customModels.filter(Boolean) : [],
	}))

	// Ensure at least one provider exists
	if (providers.length === 0) {
		providers.push(JSON.parse(JSON.stringify(defaults.providers[0])))
	}

	return {
		providers,
		primaryModel: typeof settings.primaryModel === "string" ? settings.primaryModel : "",
		useSecondModel: settings.useSecondModel === true,
		secondaryModel: typeof settings.secondaryModel === "string" ? settings.secondaryModel : "",
	}
}

export function getAllModels(settings) {
	if (!settings || !settings.providers) return []
	const all = []
	for (const p of settings.providers) {
		for (const m of (p.models || [])) if (m && !all.includes(m)) all.push(m)
		for (const m of (p.customModels || [])) if (m && !all.includes(m)) all.push(m)
	}
	return all
}

export function findProviderForModel(settings, model) {
	if (!settings || !settings.providers || !model) return null
	for (const p of settings.providers) {
		for (const m of [...(p.models || []), ...(p.customModels || [])]) {
			if (m === model) return p
		}
	}
	return null
}

export function loadAiSettings() {
	if (typeof window === "undefined") return normalizeAiSettings()
	try {
		const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY)
		return raw ? normalizeAiSettings(JSON.parse(raw)) : normalizeAiSettings()
	} catch {
		return normalizeAiSettings()
	}
}

export function saveAiSettings(settings = {}) {
	const n = normalizeAiSettings(settings)
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(n))
			window.dispatchEvent(new CustomEvent(AI_SETTINGS_EVENT, { detail: n }))
		} catch (e) { console.error("saveAiSettings error", e) }
	}
	return n
}

// ── Legacy helpers for AiAssistantView ──────────────────────────────────────
export function getActiveAiConfig(settings = {}) {
	const s = normalizeAiSettings(settings)
	const first = s.providers[0]
	return {
		source: first.name,
		serverUrl: first.baseUrl,
		apiUrl: first.baseUrl,
		requestBaseUrl: first.baseUrl,
		apiKey: first.apiKey,
	}
}

export { stripUrl as normalizeServerUrl }

// ── Endpoint discovery ──────────────────────────────────────────────────────
function getUrlOrigin(url) {
	try { return new URL(url).origin } catch { return "" }
}
function getUrlPathname(url) {
	try { return new URL(url).pathname.replace(/\/+$/, "") || "/" } catch { return "/" }
}
function isApiBasePath(p) {
	const l = p.toLowerCase()
	return l.endsWith("/api") || /\/v\d[^/]*$/.test(l) || l.includes("/openai")
}
function joinUrl(base, suffix) {
	const b = stripUrl(base)
	return b ? `${b}${suffix.startsWith("/") ? suffix : `/${suffix}`}` : ""
}
function dedupe(urls) { return [...new Set(urls.filter(Boolean))] }

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
	return url ? joinUrl(url, "/chat/completions") : ""
}

export function buildOllamaChatEndpoint(baseUrl) {
	return baseUrl ? joinUrl(baseUrl, "/api/chat") : ""
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

// Legacy – kept for AiAssistantView imports
export function buildOpenAiChatEndpointCandidates(baseUrl) {
	const url = stripUrl(baseUrl)
	return url ? [joinUrl(url, "/chat/completions")] : []
}
export function buildOllamaChatEndpointCandidates(baseUrl) {
	return [buildOllamaChatEndpoint(baseUrl)].filter(Boolean)
}
