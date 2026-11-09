import { app } from './_server.generated/app.js'

const vercelHandler = {
  async fetch(request: Request): Promise<Response> {
    return await app.fetch(request)
  },
}

export default vercelHandler
