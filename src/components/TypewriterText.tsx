import { useEffect, useState } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  className?: string
  repeat?: boolean
  pauseMs?: number
}

export const TypewriterText = ({
  text,
  speed = 36,
  className,
  repeat = false,
  pauseMs = 1400,
}: TypewriterTextProps) => {
  const [visibleText, setVisibleText] = useState('')

  useEffect(() => {
    setVisibleText('')
    let currentIndex = 0
    let timer: number | undefined
    let timeout: number | undefined

    const startTyping = () => {
      timer = window.setInterval(() => {
        currentIndex += 1
        setVisibleText(text.slice(0, currentIndex))

        if (currentIndex >= text.length && timer) {
          window.clearInterval(timer)
          if (repeat) {
            timeout = window.setTimeout(() => {
              currentIndex = 0
              setVisibleText('')
              startTyping()
            }, pauseMs)
          }
        }
      }, speed)
    }

    startTyping()

    return () => {
      if (timer) window.clearInterval(timer)
      if (timeout) window.clearTimeout(timeout)
    }
  }, [pauseMs, repeat, speed, text])

  return (
    <span className={`relative inline-block ${className ?? ''}`}>
      <span className="invisible whitespace-pre">{text}</span>
      <span className="absolute inset-0 whitespace-pre">
        {visibleText}
        <span className="ml-0.5 inline-block h-[1em] w-[1px] animate-pulse bg-current align-middle" />
      </span>
    </span>
  )
}
