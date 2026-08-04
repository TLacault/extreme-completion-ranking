import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import {
  CARD_LAYOUT_QUERY,
  DENSE_TABLE_QUERY,
  SHORT_VIEWPORT_QUERY,
  matchesPhone,
  useViewport,
} from './useViewport'

interface FakeList {
  matches: boolean
  media: string
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  fire: (matches: boolean) => void
}

const lists = new Map<string, FakeList>()

/** Installs a matchMedia stub whose lists start matching the given queries. */
function installMatchMedia(matching: string[]): void {
  lists.clear()
  vi.stubGlobal('matchMedia', (query: string) => {
    const existing = lists.get(query)
    if (existing) return existing
    const handlers: ((event: MediaQueryListEvent) => void)[] = []
    const list: FakeList = {
      matches: matching.includes(query),
      media: query,
      addEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => {
        handlers.push(handler)
      }),
      removeEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => {
        const i = handlers.indexOf(handler)
        if (i !== -1) handlers.splice(i, 1)
      }),
      fire(matches: boolean) {
        list.matches = matches
        handlers.forEach((handler) => handler({ matches } as MediaQueryListEvent))
      },
    }
    lists.set(query, list)
    return list
  })
}

/** Mounts a throwaway component so onUnmounted hooks have an instance to bind to. */
function mountWithViewport() {
  let api!: ReturnType<typeof useViewport>
  const Comp = defineComponent({
    setup() {
      api = useViewport()
      return () => h('div')
    },
  })
  const el = document.createElement('div')
  const app = createApp(Comp)
  app.mount(el)
  return { api, unmount: () => app.unmount() }
}

afterEach(() => {
  vi.unstubAllGlobals()
  lists.clear()
})

describe('useViewport', () => {
  it('seeds each flag from the initial match state', () => {
    installMatchMedia([CARD_LAYOUT_QUERY])
    const { api, unmount } = mountWithViewport()
    expect(api.isCardLayout.value).toBe(true)
    expect(api.isShortViewport.value).toBe(false)
    unmount()
  })

  it('flags a dense table without switching to cards on a mid-width viewport', () => {
    // A 768px tablet: too wide for cards, too narrow for the full-density table.
    installMatchMedia([DENSE_TABLE_QUERY])
    const { api, unmount } = mountWithViewport()
    expect(api.isCardLayout.value).toBe(false)
    expect(api.isDenseTable.value).toBe(true)
    unmount()
  })

  it('updates reactively when the media query changes', async () => {
    installMatchMedia([])
    const { api, unmount } = mountWithViewport()
    expect(api.isCardLayout.value).toBe(false)

    lists.get(CARD_LAYOUT_QUERY)!.fire(true)
    await nextTick()
    expect(api.isCardLayout.value).toBe(true)

    unmount()
  })

  it('removes its listeners on unmount', () => {
    installMatchMedia([])
    const { unmount } = mountWithViewport()
    const list = lists.get(CARD_LAYOUT_QUERY)!
    expect(list.removeEventListener).not.toHaveBeenCalled()

    unmount()
    expect(list.removeEventListener).toHaveBeenCalledTimes(1)
  })

  it('reports false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { api, unmount } = mountWithViewport()
    expect(api.isCardLayout.value).toBe(false)
    expect(api.isShortViewport.value).toBe(false)
    unmount()
  })
})

describe('matchesPhone', () => {
  beforeEach(() => lists.clear())

  it('is true for a narrow portrait viewport', () => {
    installMatchMedia([CARD_LAYOUT_QUERY])
    expect(matchesPhone()).toBe(true)
  })

  it('is true for a short landscape viewport', () => {
    installMatchMedia([SHORT_VIEWPORT_QUERY])
    expect(matchesPhone()).toBe(true)
  })

  it('is false on a desktop-sized viewport', () => {
    installMatchMedia([])
    expect(matchesPhone()).toBe(false)
  })

  it('is false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(matchesPhone()).toBe(false)
  })
})
