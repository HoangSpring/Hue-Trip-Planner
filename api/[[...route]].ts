process.env.SUPABASE_URL ||= process.env.VITE_SUPABASE_URL
process.env.SUPABASE_ANON_KEY ||= process.env.VITE_SUPABASE_ANON_KEY

import { app } from './_server.generated/app.js'

const vercelHandler = {
  async fetch(request: Request): Promise<Response> {
    return await app.fetch(request)
  },
}

export default vercelHandler
