// API para cerrar sesion
import { getIronSession } from 'iron-session'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionConfig)
  session.destroy()
  return res.status(200).json({ ok: true })
}
