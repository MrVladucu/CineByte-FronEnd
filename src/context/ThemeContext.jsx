import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    
    // Cambiar las variables CSS
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }

    // Cambiar el tema de PrimeReact
    const currentTheme = theme === 'dark' ? 'lara-light-indigo' : 'lara-dark-indigo'
    const newTheme = theme === 'dark' ? 'lara-dark-indigo' : 'lara-light-indigo'
    
    const themeLink = document.getElementById('theme-link')
    if (themeLink) {
        themeLink.href = `https://unpkg.com/primereact/resources/themes/${newTheme}/theme.css`
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)