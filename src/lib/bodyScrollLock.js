/**
 * Bloquea el scroll del documento (fondo) mientras un overlay está abierto.
 * En iOS, overflow:hidden en body no alcanza; se usa position:fixed + scrollY guardado.
 * @returns {() => void} función para restaurar scroll y estilos
 */
export function lockBodyScroll() {
  const html = document.documentElement
  const body = document.body
  const scrollY = window.scrollY

  const snap = {
    htmlOverflow: html.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
    bodyOverflow: body.style.overflow,
    bodyOverscroll: body.style.overscrollBehavior,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
  }

  html.style.overflow = 'hidden'
  html.style.overscrollBehavior = 'none'
  body.style.overflow = 'hidden'
  body.style.overscrollBehavior = 'none'
  body.style.position = 'fixed'
  body.style.top = `-${scrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'

  return () => {
    html.style.overflow = snap.htmlOverflow
    html.style.overscrollBehavior = snap.htmlOverscroll
    body.style.overflow = snap.bodyOverflow
    body.style.overscrollBehavior = snap.bodyOverscroll
    body.style.position = snap.bodyPosition
    body.style.top = snap.bodyTop
    body.style.left = snap.bodyLeft
    body.style.right = snap.bodyRight
    body.style.width = snap.bodyWidth
    window.scrollTo(0, scrollY)
  }
}

/**
 * Bloqueo ligero (solo overflow): menos reflow que position:fixed; útil para drawers cortos.
 * En iOS antiguo el fondo aún podría moverse levemente.
 */
export function lockBodyScrollLight() {
  const html = document.documentElement
  const body = document.body
  const snap = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
    bodyOverscroll: body.style.overscrollBehavior,
  }

  html.style.overflow = 'hidden'
  body.style.overflow = 'hidden'
  html.style.overscrollBehavior = 'none'
  body.style.overscrollBehavior = 'none'

  return () => {
    html.style.overflow = snap.htmlOverflow
    body.style.overflow = snap.bodyOverflow
    html.style.overscrollBehavior = snap.htmlOverscroll
    body.style.overscrollBehavior = snap.bodyOverscroll
  }
}
