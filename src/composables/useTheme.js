import { ref, watch, onMounted } from 'vue'

const THEME_KEY = 'app-theme'
const AVAILABLE_THEMES = [
  { id: 'light', name: 'Light (Default)' },
  { id: 'dark', name: 'Dark' },
  { id: 'solarized-light', name: 'Solarized Light' },
  { id: 'solarized-dark', name: 'Solarized Dark' },
  { id: 'catppuccin-macchiato', name: 'Catppuccin Macchiato' },
  { id: 'vscode-dark', name: 'VS Code Dark+' },
  { id: 'breeze-light', name: 'KDE Breeze Light' },
]

const theme = ref(localStorage.getItem(THEME_KEY) || 'light')

function applyTheme(themeId) {
  const html = document.documentElement
  // Remove all theme classes
  html.classList.remove(...AVAILABLE_THEMES.map(t => `theme-${t.id}`))
  // Add new theme class
  html.classList.add(`theme-${themeId}`)
  localStorage.setItem(THEME_KEY, themeId)
}

export function useTheme() {
  onMounted(() => {
    applyTheme(theme.value)
  })

  watch(theme, (newVal) => {
    applyTheme(newVal)
  })

  return {
    theme,
    availableThemes: AVAILABLE_THEMES,
  }
}