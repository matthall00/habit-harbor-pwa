import { useCallback, useEffect, useState } from 'react'

const getInitialDarkMode = (): boolean => {
  try {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') return true
    if (savedTheme === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), [])

  return { darkMode, toggleDarkMode }
}

