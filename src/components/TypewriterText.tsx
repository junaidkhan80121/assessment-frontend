import { useEffect, useState } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  className?: string
}

export const TypewriterText = ({ text, speed = 36, className }: TypewriterTextProps) => {
  const [visibleText, setVisibleText] = useState('')

  useEffect(() => {
    setVisibleText('')
    let currentIndex = 0

    const timer = window.setInterval(() => {
      currentIndex += 1
      setVisibleText(text.slice(0, currentIndex))

      if (currentIndex >= text.length) {
        window.clearInterval(timer)
      }
    }, speed)

    return () => window.clearInterval(timer)
  }, [speed, text])

  return (
    <span className={className}>
      {visibleText}
      <span className="ml-0.5 inline-block h-[1em] w-[1px] animate-pulse bg-current align-middle" />
    </span>
  )
}
