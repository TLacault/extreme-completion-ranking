import { onUnmounted, ref, type Ref } from 'vue'

/** Below this width the level list renders as stacked cards instead of a table. */
export const CARD_LAYOUT_QUERY = '(max-width: 699.98px)'

/**
 * A landscape phone is wide enough for the table but far too short for normal
 * vertical rhythm, so density and modal sizing key off this separately.
 */
export const SHORT_VIEWPORT_QUERY = '(orientation: landscape) and (max-height: 500px)'

/**
 * Between the card breakpoint and this width the table fits only in its compact
 * form — landscape phones, small tablets and split-screen windows all land here.
 */
export const DENSE_TABLE_QUERY = '(max-width: 1100px)'

function useMediaQuery(query: string): Ref<boolean> {
  // jsdom and older Safari lack matchMedia / addEventListener on MediaQueryList.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return ref(false)
  }

  const list = window.matchMedia(query)
  const matches = ref(list.matches)
  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }

  if (typeof list.addEventListener === 'function') {
    list.addEventListener('change', onChange)
    onUnmounted(() => list.removeEventListener('change', onChange))
  } else {
    list.addListener(onChange)
    onUnmounted(() => list.removeListener(onChange))
  }

  return matches
}

export function useViewport() {
  const isCardLayout = useMediaQuery(CARD_LAYOUT_QUERY)
  const isShortViewport = useMediaQuery(SHORT_VIEWPORT_QUERY)
  const isDenseTable = useMediaQuery(DENSE_TABLE_QUERY)
  return { isCardLayout, isShortViewport, isDenseTable }
}

/**
 * Standalone one-shot check for code that runs before a component mounts
 * (collapse defaults), where registering an onUnmounted hook is not valid.
 */
export function matchesPhone(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(CARD_LAYOUT_QUERY).matches || window.matchMedia(SHORT_VIEWPORT_QUERY).matches
}
