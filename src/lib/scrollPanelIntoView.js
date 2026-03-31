function scrollBehavior() {
  if (typeof window === 'undefined') return 'auto'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
}

/** Scroll a un panel por `id` (p. ej. barra de acciones móvil). */
export function scrollPanelIntoView(panelId) {
  const el = document.getElementById(panelId)
  if (!el) return
  el.scrollIntoView({
    behavior: scrollBehavior(),
    block: 'center',
  })
}
