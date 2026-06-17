import { motion, useMotionValue, animate } from 'motion/react'
import { Trash2 } from 'lucide-react'

const SWIPE_THRESHOLD_PX = 100
const SWIPE_VELOCITY = 500

export default function SwipeToDelete({ children, onDelete }) {
  const x = useMotionValue(0)

  const snapBack = () => {
    animate(x, 0, { duration: 0.2, ease: 'easeOut' })
  }

  const handleDragEnd = (_, info) => {
    const triggered =
      info.offset.x < -SWIPE_THRESHOLD_PX ||
      info.velocity.x < -SWIPE_VELOCITY
    if (!triggered) {
      snapBack()
      return
    }
    const deleted = onDelete()
    if (!deleted) snapBack()
  }

  return (
    <div className="relative isolate overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end bg-ember/90 pr-6">
        <Trash2 size={20} className="text-cream" />
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -140, right: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onPointerCancel={snapBack}
        style={{ x, touchAction: 'pan-y' }}
        className="relative bg-forge"
      >
        {children}
      </motion.div>
    </div>
  )
}
