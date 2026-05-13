// ── Field name mapper: camelCase (frontend) <-> snake_case (backend) ─────
// The PHP CodeIgniter backend stores fields with snake_case names,
// while the Vue frontend uses camelCase. This utility handles the conversion.

const TODO_FIELDS_MAP = {
	// camelCase -> snake_case (for sending to backend)
	toBackend: {
		dueDate: "due_date",
		dueTime: "due_time",
		syncEnabled: "sync_enabled",
		reminderEnabled: "reminder_enabled",
		recurringEnabled: "recurring_enabled",
		projectId: "project_id",
		categoryId: "category_id",
		createdAt: "created_at",
		updatedAt: "updated_at",
		categoryIds: "category_ids",
		categoryNames: "category_names",
	},
	// snake_case -> camelCase (for receiving from backend)
	toFrontend: {},
};

// Build reverse map
for (const [frontend, backend] of Object.entries(TODO_FIELDS_MAP.toBackend)) {
	TODO_FIELDS_MAP.toFrontend[backend] = frontend;
}

/**
 * Convert camelCase keys to snake_case (for sending to the backend).
 */
export function toBackendCase(obj) {
	if (!obj || typeof obj !== "object") return obj;
	const map = TODO_FIELDS_MAP.toBackend;
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		result[map[key] || key] = value;
	}
	return result;
}

/**
 * Convert snake_case keys to camelCase (for receiving from the backend).
 */
export function toFrontendCase(obj) {
	if (!obj || typeof obj !== "object") return obj;
	const map = TODO_FIELDS_MAP.toFrontend;
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		result[map[key] || key] = value;
	}
	return result;
}

/**
 * Map todo status values: frontend "done" -> backend "completed".
 */
export function mapStatusToBackend(status) {
	if (status === "done") return "completed";
	return status;
}

/**
 * Map todo status values: backend "completed" -> frontend "done".
 */
export function mapStatusToFrontend(status) {
	if (status === "completed") return "done";
	return status;
}
