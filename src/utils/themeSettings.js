export const THEME_STORAGE_KEY = 'todo-app.theme'
export const CUSTOM_THEMES_KEY = 'todo-app.custom-themes'
export const WALLPAPER_KEY = 'todo-app.wallpaper'

export const themes = [
  // ── Light themes ──────────────────────────────────────────────────────────
  {
    id: 'light',
    name: 'Light',
    group: 'Light',
    preview: ['#f5f5f5', '#ffffff', '#274f69'],
    vars: {
      '--bg': '#f5f5f5',
      '--surface': '#ffffff',
      '--surface-strong': '#ffffff',
      '--surface-muted': '#fafafa',
      '--border': '#d0d0d0',
      '--line': '#b9b9b5',
      '--text': '#1f1f1f',
      '--text-muted': '#686866',
      '--text-strong': '#111111',
      '--accent': '#274f69',
      '--accent-text': '#ffffff',
      '--accent-soft': '#d6e4ec',
      '--sidebar-bg': '#ffffff',
      '--sidebar-border': '#d0d0d0',
      '--sidebar-text': '#222222',
      '--sidebar-text-muted': '#686866',
      '--input-bg': '#ffffff',
      '--input-border': '#cfcfcf',
      '--modal-bg': '#ffffff',
      '--chip': '#d8d8d8',
      '--success': '#dff7e7',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    group: 'Light',
    preview: ['#f7f3ee', '#fffcf8', '#8b5e3c'],
    vars: {
      '--bg': '#f7f3ee',
      '--surface': '#fffcf8',
      '--surface-strong': '#fffcf8',
      '--surface-muted': '#f5f0ea',
      '--border': '#ddd5c8',
      '--line': '#c8b8a8',
      '--text': '#2d2416',
      '--text-muted': '#7a6a57',
      '--text-strong': '#1a120b',
      '--accent': '#8b5e3c',
      '--accent-text': '#ffffff',
      '--accent-soft': '#f0dece',
      '--sidebar-bg': '#fffcf8',
      '--sidebar-border': '#ddd5c8',
      '--sidebar-text': '#2d2416',
      '--sidebar-text-muted': '#7a6a57',
      '--input-bg': '#fffcf8',
      '--input-border': '#d0c4b4',
      '--modal-bg': '#fffcf8',
      '--chip': '#e8ddd1',
      '--success': '#e8f4e0',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    group: 'Light',
    preview: ['#f0eef8', '#faf9fe', '#6c5fc7'],
    vars: {
      '--bg': '#f0eef8',
      '--surface': '#faf9fe',
      '--surface-strong': '#faf9fe',
      '--surface-muted': '#e8e5f5',
      '--border': '#ccc8e0',
      '--line': '#b0aad4',
      '--text': '#2a2540',
      '--text-muted': '#6b6590',
      '--text-strong': '#1a163a',
      '--accent': '#6c5fc7',
      '--accent-text': '#ffffff',
      '--accent-soft': '#e0dcf8',
      '--sidebar-bg': '#faf9fe',
      '--sidebar-border': '#ccc8e0',
      '--sidebar-text': '#2a2540',
      '--sidebar-text-muted': '#6b6590',
      '--input-bg': '#ffffff',
      '--input-border': '#ccc8e0',
      '--modal-bg': '#faf9fe',
      '--chip': '#d8d4f0',
      '--success': '#ddf5e8',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    group: 'Light',
    preview: ['#eef6f2', '#f8fdfb', '#2d7d5a'],
    vars: {
      '--bg': '#eef6f2',
      '--surface': '#f8fdfb',
      '--surface-strong': '#f8fdfb',
      '--surface-muted': '#e4f2ec',
      '--border': '#c0d9cd',
      '--line': '#a0c8b8',
      '--text': '#1a2e26',
      '--text-muted': '#527a68',
      '--text-strong': '#0d1f18',
      '--accent': '#2d7d5a',
      '--accent-text': '#ffffff',
      '--accent-soft': '#c8eadb',
      '--sidebar-bg': '#f8fdfb',
      '--sidebar-border': '#c0d9cd',
      '--sidebar-text': '#1a2e26',
      '--sidebar-text-muted': '#527a68',
      '--input-bg': '#ffffff',
      '--input-border': '#c0d9cd',
      '--modal-bg': '#f8fdfb',
      '--chip': '#c8e8da',
      '--success': '#d4f4e4',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    group: 'Light',
    preview: ['#fdf0f2', '#fffafa', '#c0395a'],
    vars: {
      '--bg': '#fdf0f2',
      '--surface': '#fffafa',
      '--surface-strong': '#fffafa',
      '--surface-muted': '#f8e8ec',
      '--border': '#e0c0c8',
      '--line': '#c8a0a8',
      '--text': '#2e1a1e',
      '--text-muted': '#8a5462',
      '--text-strong': '#1a0a10',
      '--accent': '#c0395a',
      '--accent-text': '#ffffff',
      '--accent-soft': '#f8d0da',
      '--sidebar-bg': '#fffafa',
      '--sidebar-border': '#e0c0c8',
      '--sidebar-text': '#2e1a1e',
      '--sidebar-text-muted': '#8a5462',
      '--input-bg': '#ffffff',
      '--input-border': '#e0c0c8',
      '--modal-bg': '#fffafa',
      '--chip': '#f0d0d8',
      '--success': '#ddf5e4',
    },
  },

  // ── Dark themes ───────────────────────────────────────────────────────────
  {
    id: 'dark',
    name: 'Dark',
    group: 'Dark',
    preview: ['#1a1a1a', '#252525', '#4a90c4'],
    vars: {
      '--bg': '#1a1a1a',
      '--surface': '#252525',
      '--surface-strong': '#2e2e2e',
      '--surface-muted': '#1f1f1f',
      '--border': '#3a3a3a',
      '--line': '#444444',
      '--text': '#e0e0e0',
      '--text-muted': '#a0a0a0',
      '--text-strong': '#f0f0f0',
      '--accent': '#4a90c4',
      '--accent-text': '#ffffff',
      '--accent-soft': '#1e3a50',
      '--sidebar-bg': '#1e1e1e',
      '--sidebar-border': '#333333',
      '--sidebar-text': '#e0e0e0',
      '--sidebar-text-muted': '#a0a0a0',
      '--input-bg': '#2a2a2a',
      '--input-border': '#444444',
      '--modal-bg': '#2a2a2a',
      '--chip': '#3a3a3a',
      '--success': '#1a3a28',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    group: 'Dark',
    preview: ['#0d1117', '#161b22', '#58a6ff'],
    vars: {
      '--bg': '#0d1117',
      '--surface': '#161b22',
      '--surface-strong': '#1c2128',
      '--surface-muted': '#0d1117',
      '--border': '#30363d',
      '--line': '#30363d',
      '--text': '#c9d1d9',
      '--text-muted': '#8b949e',
      '--text-strong': '#f0f6fc',
      '--accent': '#58a6ff',
      '--accent-text': '#ffffff',
      '--accent-soft': '#1c2e44',
      '--sidebar-bg': '#161b22',
      '--sidebar-border': '#30363d',
      '--sidebar-text': '#c9d1d9',
      '--sidebar-text-muted': '#8b949e',
      '--input-bg': '#0d1117',
      '--input-border': '#30363d',
      '--modal-bg': '#161b22',
      '--chip': '#2a3340',
      '--success': '#0f2d1a',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    group: 'Dark',
    preview: ['#0f1a10', '#152016', '#4caf6a'],
    vars: {
      '--bg': '#0f1a10',
      '--surface': '#152016',
      '--surface-strong': '#1a2a1c',
      '--surface-muted': '#0f1a10',
      '--border': '#2a4030',
      '--line': '#2a4030',
      '--text': '#c8dfc8',
      '--text-muted': '#7a9a7a',
      '--text-strong': '#dff0df',
      '--accent': '#4caf6a',
      '--accent-text': '#001208',
      '--accent-soft': '#0f2e18',
      '--sidebar-bg': '#152016',
      '--sidebar-border': '#2a4030',
      '--sidebar-text': '#c8dfc8',
      '--sidebar-text-muted': '#7a9a7a',
      '--input-bg': '#0f1a10',
      '--input-border': '#2a4030',
      '--modal-bg': '#152016',
      '--chip': '#203028',
      '--success': '#0a2016',
    },
  },
  {
    id: 'mocha',
    name: 'Mocha',
    group: 'Dark',
    preview: ['#1a1410', '#231c16', '#c87940'],
    vars: {
      '--bg': '#1a1410',
      '--surface': '#231c16',
      '--surface-strong': '#2c2418',
      '--surface-muted': '#1a1410',
      '--border': '#3d3028',
      '--line': '#3d3028',
      '--text': '#e0d0c0',
      '--text-muted': '#9a8070',
      '--text-strong': '#f0e0d0',
      '--accent': '#c87940',
      '--accent-text': '#ffffff',
      '--accent-soft': '#3d2010',
      '--sidebar-bg': '#231c16',
      '--sidebar-border': '#3d3028',
      '--sidebar-text': '#e0d0c0',
      '--sidebar-text-muted': '#9a8070',
      '--input-bg': '#1a1410',
      '--input-border': '#3d3028',
      '--modal-bg': '#231c16',
      '--chip': '#3d3028',
      '--success': '#142010',
    },
  },

  // ── Colorful themes ───────────────────────────────────────────────────────
  {
    id: 'ocean',
    name: 'Ocean',
    group: 'Colorful',
    preview: ['#e8f4f8', '#ffffff', '#0080b0'],
    vars: {
      '--bg': '#e8f4f8',
      '--surface': '#ffffff',
      '--surface-strong': '#ffffff',
      '--surface-muted': '#f0f8fc',
      '--border': '#a0cce0',
      '--line': '#80b8d0',
      '--text': '#1a3040',
      '--text-muted': '#4a6070',
      '--text-strong': '#0d2030',
      '--accent': '#0080b0',
      '--accent-text': '#ffffff',
      '--accent-soft': '#b8e0f0',
      '--sidebar-bg': '#1a3a50',
      '--sidebar-border': '#2a5070',
      '--sidebar-text': '#d8f0ff',
      '--sidebar-text-muted': '#7ab0d0',
      '--input-bg': '#ffffff',
      '--input-border': '#a0cce0',
      '--modal-bg': '#ffffff',
      '--chip': '#b0d8ec',
      '--success': '#d0f0e0',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    group: 'Colorful',
    preview: ['#fef3e8', '#ffffff', '#e07020'],
    vars: {
      '--bg': '#fef3e8',
      '--surface': '#ffffff',
      '--surface-strong': '#ffffff',
      '--surface-muted': '#fff8f0',
      '--border': '#e8c8a0',
      '--line': '#d0a870',
      '--text': '#2a1a0a',
      '--text-muted': '#8a6040',
      '--text-strong': '#1a0a00',
      '--accent': '#e07020',
      '--accent-text': '#ffffff',
      '--accent-soft': '#ffe0c0',
      '--sidebar-bg': '#2d1848',
      '--sidebar-border': '#4a2870',
      '--sidebar-text': '#f8e8ff',
      '--sidebar-text-muted': '#c090d8',
      '--input-bg': '#ffffff',
      '--input-border': '#e8c8a0',
      '--modal-bg': '#ffffff',
      '--chip': '#f8d8b0',
      '--success': '#ddf4e4',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    group: 'Colorful',
    preview: ['#eceff4', '#e5e9f0', '#5e81ac'],
    vars: {
      '--bg': '#eceff4',
      '--surface': '#e5e9f0',
      '--surface-strong': '#e5e9f0',
      '--surface-muted': '#d8dee9',
      '--border': '#c0c8d8',
      '--line': '#b0bcd0',
      '--text': '#2e3440',
      '--text-muted': '#4c566a',
      '--text-strong': '#2e3440',
      '--accent': '#5e81ac',
      '--accent-text': '#eceff4',
      '--accent-soft': '#d0dce9',
      '--sidebar-bg': '#3b4252',
      '--sidebar-border': '#434c5e',
      '--sidebar-text': '#eceff4',
      '--sidebar-text-muted': '#8896a8',
      '--input-bg': '#e5e9f0',
      '--input-border': '#c0c8d8',
      '--modal-bg': '#e5e9f0',
      '--chip': '#d0d8e8',
      '--success': '#d4edda',
    },
  },
]

// Labels and groupings used by the custom theme creator UI
export const CSS_VAR_LABELS = {
  '--bg': 'Background',
  '--surface': 'Surface',
  '--surface-strong': 'Surface Strong',
  '--surface-muted': 'Surface Muted',
  '--border': 'Border',
  '--line': 'Line',
  '--text': 'Text',
  '--text-muted': 'Text Muted',
  '--text-strong': 'Text Strong',
  '--accent': 'Accent',
  '--accent-text': 'Accent Text',
  '--accent-soft': 'Accent Soft',
  '--sidebar-bg': 'Sidebar Background',
  '--sidebar-border': 'Sidebar Border',
  '--sidebar-text': 'Sidebar Text',
  '--sidebar-text-muted': 'Sidebar Text Muted',
  '--input-bg': 'Input Background',
  '--input-border': 'Input Border',
  '--modal-bg': 'Modal Background',
  '--chip': 'Chip',
  '--success': 'Success',
}

export const CSS_VAR_GROUPS = [
  { label: 'Backgrounds', vars: ['--bg', '--surface', '--surface-strong', '--surface-muted'] },
  { label: 'Borders', vars: ['--border', '--line'] },
  { label: 'Text', vars: ['--text', '--text-muted', '--text-strong'] },
  { label: 'Accent', vars: ['--accent', '--accent-text', '--accent-soft'] },
  { label: 'Sidebar', vars: ['--sidebar-bg', '--sidebar-border', '--sidebar-text', '--sidebar-text-muted'] },
  { label: 'Inputs & Modal', vars: ['--input-bg', '--input-border', '--modal-bg'] },
  { label: 'Other', vars: ['--chip', '--success'] },
]

export function loadCustomThemes() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveCustomThemes(customThemes) {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes))
}

export function getAllThemes() {
  return [...themes, ...loadCustomThemes()]
}

export function loadTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'light'
}

export function applyTheme(themeId) {
  const all = getAllThemes()
  const theme = all.find((t) => t.id === themeId) || themes[0]
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }
  localStorage.setItem(THEME_STORAGE_KEY, themeId)
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: themeId }))
}

// ── Wallpaper ──────────────────────────────────────────────────────────────

export function loadWallpaper() {
  return localStorage.getItem(WALLPAPER_KEY) || null
}

export function saveWallpaper(dataUrl) {
  if (dataUrl) {
    localStorage.setItem(WALLPAPER_KEY, dataUrl)
  } else {
    localStorage.removeItem(WALLPAPER_KEY)
  }
}

export function applyWallpaper(dataUrl) {
  const root = document.documentElement
  if (dataUrl) {
    root.style.setProperty('--wallpaper', `url("${dataUrl}")`)
  } else {
    root.style.removeProperty('--wallpaper')
  }
}

// ── CSS export (marketplace-compatible) ───────────────────────────────────
// The marketplace reads the @todo-theme-meta JSON comment to get metadata,
// then extracts CSS variables from :root to reconstruct the theme object.

export function exportThemeAsCss(theme, wallpaperDataUrl = null) {
  const meta = {
    name: theme.name,
    id: theme.id,
    group: theme.group,
    preview: theme.preview,
    hasWallpaper: !!wallpaperDataUrl,
  }

  const varLines = Object.entries(theme.vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')

  const wallpaperLine = wallpaperDataUrl
    ? `\n  --wallpaper: url("${wallpaperDataUrl}");`
    : ''

  return `/* @todo-theme-meta\n${JSON.stringify(meta, null, 2)}\n*/\n\n:root {\n${varLines}${wallpaperLine}\n}\n`
}
