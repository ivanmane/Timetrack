// API para verificar si hay sesion activa
import { getIronSession } from 'iron-session'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionConfig)

  if (!session.usuario) {
    return res.status(401).json({ error: 'No hay sesion activa' })
  }

  return res.status(200).json({ usuario: session.usuario })
}
