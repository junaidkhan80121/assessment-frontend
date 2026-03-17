import { motion, Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const variants: Variants = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

interface PageTransitionProps {
  children: ReactNode
}

export const PageTransition = ({ children }: PageTransitionProps) => (
  <motion.div variants={variants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
)
