'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { Language } from '@/lib/i18n'

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div style={styles.container}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        style={styles.select}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const styles = {
  container: {
    display: 'inline-block',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '2px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    outline: 'none',
  },
}
