// ── AI Provider Settings ───────────────────────────────────────────────────
// Supports multiple AI providers (OpenAI, DeepSeek, Anthropic, Google, Ollama,
// custom) each with its own API key, base URL, and model selection.

export const DEFAULT_AI_SERVER_URL = "https://ai.hallenbarter.org"

export const AI_SETTINGS_STORAGE_KEY = "todo-app.ai-settings"
export const AI_SETTINGS_EVENT = "todo-app:ai-settings-updated"

// Built-in provider presets
export const PROVIDER_PRESETS = [
	{
		id: "openai",
		name: "OpenAI",
		baseUrl: "https://api.openai.com/v1",
		supportsModels: true,
		models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
	},
	{
		id: "deepseek",
		name: "DeepSeek",
		baseUrl: "https://api.deepseek.com",
		supportsModels: true,
		models: ["deepseek-chat", "deepseek-reasoner"],
	},
	{
		id: "anthropic",
		name: "Anthropic",
		baseUrl: "https://api.anthropic.com",
		supportsModels: true,
		models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-3-5-sonnet-20240620"],
	},
	{
		id: "google",
		name: "Google AI",
		baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
		supportsModels: true,
		models: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"],
	},
	{
		id: "ollama",
		name: "Ollama (Local)",
		baseUrl: "http://localhost:11434",
		supportsModels: true,
		models: [],
	},
	{
		id: "custom",
		name: "Custom",
		baseUrl: "",
		supportsModels: true,
		models: [],
	},
]

function generateId() {
	return "prov_" + Math.random().toString(36).substring(2, 10)
}

const defaultSettings = {
	providers: [
		{
			id: generateId(),
			preset: "openai",
			name: "OpenAI",
			baseUrl: "https://api.openai.com/v1",
			apiKey: "",
			model: "",
			customModels: [],
		},
	],
	activeProviderId: null,
}

function normalizeProvider(provider = {}) {
	return {
		id: provider.id || generateId(),
		preset: provider.preset || "",
		name: provider.name || "AI Provider",
		baseUrl: typeof provider.baseUrl === "string" ? provider.baseUrl.trim().replace(/\/+$/, "") : "",
		apiKey: typeof provider.apiKey === "string" ? provider.apiKey : "",
		model: typeof provider.model === "string" ? provider.model : "",
		customModels: Array.isArray(provider.customModels) ? provider.customModels.filter(Boolean) : [],
	}
}

export function normalizeAiSettings(settings = {}) {
	if (!settings || typeof settings !== "object") {
		return JSON.parse(JSON.stringify(defaultSettings))
	}

	const providers = Array.isArray(settings.providers)
		? settings.providers.map(normalizeProvider).filter((p) => p.name.trim())
		: []

	if (providers.length === 0) {
		providers.push(normalizeProvider(defaultSettings.providers[0]))
	}

	let activeProviderId = settings.activeProviderId || null
	if (activeProviderId && !providers.find((p) => p.id === activeProviderId)) {
		activeProviderId = providers[0].id
	}
	if (!activeProviderId) {
		activeProviderId = providers[0].id
	}

	return { providers, activeProviderId }
}

export function getActiveProvider(settings = {}) {
	const normalized = normalizeAiSettings(settings)
	return normalized.providers.find((p) => p.id === normalized.activeProviderId) || normalized.providers[0] || null
}

export function getProviderModels(provider) {
	if (!provider) return []
	const preset = PROVIDER_PRESETS.find((p) => p.id === provider.preset)
	const presetModels = preset?.models || []
	const all = [...new Set([...presetModels, ...(provider.customModels || [])])]
	return all
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

// ── Endpoint / request helpers ──────────────────────────────────────────────

function normalizeUrl(value) {
	return typeof value === "string" ? value.trim().replace(/\/+$/, "") : ""
}

function getUrlOrigin(url) {
	try {
		return new URL(url).origin
	} catch {
		return ""
	}
}

function getUrlPathname(url) {
	try {
		return new URL(url).pathname.replace(/\/+$/, "") || "/"
	} catch {
		return "/"
	}
}

function isApiBasePath(pathname) {
	const lower = pathname.toLowerCase()
	return lower.endsWith("/api") || /\/v\d[^/]*$/.test(lower) || lower.includes("/openai")
}

function dedupeUrls(urls) {
	return [...new Set(urls.map((url) => normalizeUrl(url)).filter(Boolean))]
}

function joinUrl(base, suffix) {
	const b = normalizeUrl(base)
	if (!b) return ""
	return `${b}${suffix.startsWith("/") ? suffix : `/${suffix}`}`
}

export function buildModelsEndpointCandidates(baseUrl) {
	const url = normalizeUrl(baseUrl)
	if (!url) return []
	const pathname = getUrlPathname(url)
	const lowerPath = pathname.toLowerCase()
	const origin = getUrlOrigin(url)
	const candidates = []

	if (/(\/models|\/api\/models|\/api\/tags|\/v\d[^/]*\/models)$/.test(lowerPath)) {
		candidates.push(url)
	}

	if (isApiBasePath(pathname)) {
		candidates.push(joinUrl(url, "/models"))
		candidates.push(joinUrl(url, "/tags"))
	} else {
		candidates.push(joinUrl(url, "/api/models"))
		candidates.push(joinUrl(url, "/v1/models"))
		candidates.push(joinUrl(url, "/models"))
		candidates.push(joinUrl(url, "/api/tags"))
	}

	if (origin && origin !== url) {
		candidates.push(joinUrl(origin, "/api/models"))
		candidates.push(joinUrl(origin, "/v1/models"))
		candidates.push(joinUrl(origin, "/models"))
		candidates.push(joinUrl(origin, "/api/tags"))
	}

	return dedupeUrls(candidates)
}

export function buildChatEndpoint(baseUrl) {
	const url = normalizeUrl(baseUrl)
	if (!url) return ""
	return joinUrl(url, "/chat/completions")
}

export function parseModels(payload) {
	const candidates = Array.isArray(payload) ? payload : payload?.data || payload?.models || []
	if (!Array.isArray(candidates)) return []
	return candidates
		.map((m) => {
			if (!m) return null
			if (typeof m === "string") return m.trim() || null
			return String(m.id || m.model || m.name || "").trim() || null
		})
		.filter(Boolean)
}

// ── Legacy backward compatibility ──────────────────────────────────────────
// For AiAssistantView which uses getActiveAiConfig() and related helpers
export function getActiveAiConfig() {
	const settings = loadAiSettings()
	const provider = getActiveProvider(settings)
	if (!provider) return { source: "", serverUrl: "", apiUrl: "", requestBaseUrl: "", apiKey: "" }

	return {
		source: provider.preset || provider.name,
		serverUrl: provider.baseUrl,
		apiUrl: provider.baseUrl,
		requestBaseUrl: provider.baseUrl,
		apiKey: provider.apiKey,
	}
}

export function buildOpenAiChatEndpointCandidates(baseUrl) {
	return [buildChatEndpoint(baseUrl)].filter(Boolean)
}

export function buildOllamaChatEndpointCandidates(baseUrl) {
	const url = normalizeUrl(baseUrl)
	if (!url) return []
	const pathname = getUrlPathname(url)
	const lowerPath = pathname.toLowerCase()
	const origin = getUrlOrigin(url)
	const candidates = []

	if (/(\/api\/chat|\/chat)$/.test(lowerPath)) {
		candidates.push(url)
	}

	if (isApiBasePath(pathname)) {
		candidates.push(joinUrl(url, "/chat"))
	} else {
		candidates.push(joinUrl(url, "/api/chat"))
		candidates.push(joinUrl(url, "/chat"))
	}

	if (origin && origin !== url) {
		candidates.push(joinUrl(origin, "/api/chat"))
		candidates.push(joinUrl(origin, "/chat"))
	}

	return dedupeUrls(candidates)
}

export { normalizeUrl as normalizeServerUrl }
