export const AUTO_DELETE_MINUTES_KEY = 'todo-auto-delete-minutes'

export function getAutoDeleteMinutes() {
	const stored = localStorage.getItem(AUTO_DELETE_MINUTES_KEY)
	if (stored !== null) {
		const minutes = parseInt(stored, 10)
		if (!isNaN(minutes) && minutes >= 0) return minutes
	}
	return 3 * 24 * 60
}

export function setAutoDeleteMinutes(minutes) {
	localStorage.setItem(AUTO_DELETE_MINUTES_KEY, String(minutes))
}