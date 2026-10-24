// React Router's memory router uses Request during redirect navigation. Node's
// undici implementation rejects the jsdom AbortSignal realm, so provide the
// small Request surface required by our loader-free route tests before imports.
class RouterTestRequest {
  readonly url: string
  readonly signal: AbortSignal | null
  readonly method: string
  readonly headers: Headers

  constructor(input: string | URL, init: RequestInit = {}) {
    this.url = String(input)
    this.signal = init.signal ?? null
    this.method = init.method ?? 'GET'
    this.headers = new Headers(init.headers)
  }
}

globalThis.Request = RouterTestRequest as unknown as typeof Request

if (!globalThis.localStorage) {
  const entries = new Map<string, string>()
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
    key: index => [...entries.keys()][index] ?? null,
    get length() { return entries.size },
  }
}
