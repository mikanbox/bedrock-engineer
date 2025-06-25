import { useState, useEffect } from 'react'

/**
 * システムのダークモード設定を検出するフック
 * @returns isDarkMode: システムがダークモードか
 */
export const useTheme = () => {
  // システムのダークモード設定を検出する
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // システムのカラースキームが変更された時に反応
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
    }

    // 変更イベントのリスナーを追加
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // 古いブラウザ向け（Safari 13未満など）
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  return { isDarkMode }
}
