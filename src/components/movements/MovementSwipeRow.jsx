import { useRef, useState } from 'react'

const ACTION_W = 108

/**
 * Fila con swipe izquierdo para editar / eliminar (móvil).
 */
export function MovementSwipeRow({ children, onEdit, onDelete }) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const startOff = useRef(0)
  const dragging = useRef(false)

  const onTouchStart = (e) => {
    if (!e.touches[0]) return
    dragging.current = true
    startX.current = e.touches[0].clientX
    startOff.current = offset
  }

  const onTouchMove = (e) => {
    if (!dragging.current || !e.touches[0]) return
    const dx = e.touches[0].clientX - startX.current
    let next = startOff.current + dx
    if (next > 0) next = 0
    if (next < -ACTION_W) next = -ACTION_W
    setOffset(next)
  }

  const onTouchEnd = () => {
    dragging.current = false
    setOffset((o) => (o < -ACTION_W * 0.35 ? -ACTION_W : 0))
  }

  return (
    <div className="moni-swipe">
      <div className="moni-swipe__rail" aria-hidden>
        <button type="button" className="moni-swipe__action moni-swipe__action--edit" onClick={onEdit}>
          Editar
        </button>
        <button type="button" className="moni-swipe__action moni-swipe__action--del" onClick={onDelete}>
          Borrar
        </button>
      </div>
      <div
        className="moni-swipe__front"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
