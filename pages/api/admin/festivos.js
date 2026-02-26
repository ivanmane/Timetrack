// API para dias festivos y vacaciones
import { getIronSession } from 'iron-session'
import pool from '../../../lib/db'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionConfig)
  if (!session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesion' })
  }

  // GET - obtener festivos y vacaciones
  if (req.method === 'GET') {
    try {
      const festivos = await pool.query(
        'SELECT * FROM dias_festivos ORDER BY fecha'
      )
      const vacaciones = await pool.query(
        'SELECT * FROM vacaciones ORDER BY fecha'
      )
      return res.status(200).json({
        festivos:   festivos.rows,
        vacaciones: vacaciones.rows
      })
    } catch (error) {
      console.log('Error:', error)
      return res.status(500).json({ error: 'Error al obtener festivos' })
    }
  }

  // POST - agregar festivo o vacacion (solo admin)
  if (req.method === 'POST') {
    if (session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo el admin puede hacer esto' })
    }

    const { tipo, fecha, descripcion, usuarioId } = req.body

    try {
      if (tipo === 'vacacion') {
        await pool.query(
          'INSERT INTO vacaciones (usuario_id, fecha, nota) VALUES ($1, $2, $3)',
          [usuarioId, fecha, descripcion]
        )
      } else {
        await pool.query(
          'INSERT INTO dias_festivos (fecha, descripcion) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [fecha, descripcion]
        )
      }
      return res.status(201).json({ ok: true })
    } catch (error) {
      console.log('Error:', error)
      return res.status(500).json({ error: 'Error al guardar' })
    }
  }

  return res.status(405).json({ error: 'Metodo no permitido' })
}
