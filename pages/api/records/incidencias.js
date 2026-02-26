// API para guardar incidencias
import { getIronSession } from 'iron-session'
import pool from '../../../lib/db'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionConfig)
  if (!session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesion' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const { fecha, descripcion, hora } = req.body

  if (!fecha || !descripcion) {
    return res.status(400).json({ error: 'Faltan datos' })
  }

  try {
    const resultado = await pool.query(
      'INSERT INTO incidencias (usuario_id, fecha, descripcion, hora) VALUES ($1, $2, $3, $4) RETURNING *',
      [session.usuario.id, fecha, descripcion, hora]
    )

    return res.status(201).json({ incidencia: resultado.rows[0] })

  } catch (error) {
    console.log('Error al guardar incidencia:', error)
    return res.status(500).json({ error: 'Error al guardar incidencia' })
  }
}
