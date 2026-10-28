// React Router's memory router uses Request during redirect navigation. Node's
// undici implementation rejects the jsdom AbortSignal realm, so provide the
// small Request surface required by our loader-free route tests before imports.
class RouterTestRequest {
  readonly url: string
  readonly signal: AbortSignal | null
  readonly method: string
  readonly headers: Headers
  private readonly bodyText: string

  constructor(input: string | URL, init: RequestInit = {}) {
    this.url = String(input)
    this.signal = init.signal ?? null
    this.method = init.method ?? 'GET'
    this.headers = new Headers(init.headers)
    this.bodyText = typeof init.body === 'string' ? init.body : ''
  }

  async text(): Promise<string> {
    return this.bodyText
  }

  async json(): Promise<unknown> {
    return JSON.parse(this.bodyText) as unknown
  }

  clone(): RouterTestRequest {
    return new RouterTestRequest(this.url, { method: this.method, headers: this.headers, body: this.bodyText, signal: this.signal ?? undefined })
  }
}

globalThis.Request = RouterTestRequest as unknown as typeof Request

const entries = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, String(value)),
    removeItem: (key: string) => entries.delete(key),
    clear: () => entries.clear(),
    key: (index: number) => [...entries.keys()][index] ?? null,
    get length() { return entries.size },
  } satisfies Storage,
})
