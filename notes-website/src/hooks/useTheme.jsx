import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      // First check profile theme, then fallback to localStorage 'theme', then default to dark
      const profile = localStorage.getItem('userProfile')
      if (profile) {
        const parsed = JSON.parse(profile)
        if (parsed.theme) {
          return parsed.theme === 'dark'
        }
      }
      
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    } catch {
      return true
    }
  })

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    console.log('Setting theme attribute to:', theme)
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [isDark])

  const toggleTheme = () => {
    console.log('toggleTheme called, current isDark:', isDark)
    setIsDark(!isDark)
    console.log('toggleTheme will set isDark to:', !isDark)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}