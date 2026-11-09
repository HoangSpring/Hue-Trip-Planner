import { handle } from 'hono/vercel'
import { app } from './_server.generated/app.js'

export default handle(app)
