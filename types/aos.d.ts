declare module 'aos' {
  interface AOSOptions {
    offset?: number
    delay?: number | string
    duration?: number | string
    easing?: string
    once?: boolean
    mirror?: boolean
    anchorPlacement?: string
    disable?: boolean | string | (() => boolean)
  }

  interface AOS {
    init(options?: AOSOptions): void
    refresh(force?: boolean): void
    refreshHard(): void
  }

  const aos: AOS
  export default aos
}
