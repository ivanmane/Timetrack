// API para los horarios
import { getIronSession } from 'iron-session'
import pool from '../../../lib/db'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionConfig)
  if (!session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesion' })
  }

  const { usuarioId } = req.query

  // ── GET: obtener horario ───────────────────────────────
  if (req.method === 'GET') {
    try {
      const resultado = await pool.query(
        'SELECT * FROM horarios WHERE usuario_id = $1',
        [usuarioId]
      )

      // Convertimos el array a un objeto por dia
      const horario = {}
      resultado.rows.forEach(row => {
        horario[row.dia_semana] = {
          activo:         row.activo,
          entrada:        row.hora_entrada ? row.hora_entrada.slice(0, 5) : '',
          salida:         row.hora_salida  ? row.hora_salida.slice(0, 5)  : '',
          comida:         row.hora_comida  ? row.hora_comida.slice(0, 5)  : '',
          duracionComida: row.duracion_comida
        }
      })

      return res.status(200).json({ horario })

    } catch (error) {
      console.log('Error al obtener horario:', error)
      return res.status(500).json({ error: 'Error al obtener horario' })
    }
  }

  // ── PUT: actualizar horario (solo admin) ───────────────
  if (req.method === 'PUT') {
    if (session.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos' })
    }

    const { horario } = req.body
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

    try {
      for (const dia of dias) {
        const d = horario[dia]
        if (!d) continue

        // Verificamos si ya existe ese dia
        const existe = await pool.query(
          'SELECT id FROM horarios WHERE usuario_id = $1 AND dia_semana = $2',
          [usuarioId, dia]
        )

        if (existe.rows.length > 0) {
          await pool.query(
            `UPDATE horarios SET
              activo = $1, hora_entrada = $2, hora_salida = $3,
              hora_comida = $4, duracion_comida = $5
             WHERE usuario_id = $6 AND dia_semana = $7`,
            [d.activo, d.activo ? d.entrada : null, d.activo ? d.salida : null,
             d.activo ? d.comida : null, d.duracionComida, usuarioId, dia]
          )
        } else {
          await pool.query(
            `INSERT INTO horarios (usuario_id, dia_semana, activo, hora_entrada, hora_salida, hora_comida, duracion_comida)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [usuarioId, dia, d.activo, d.activo ? d.entrada : null,
             d.activo ? d.salida : null, d.activo ? d.comida : null, d.duracionComida]
          )
        }
      }

      return res.status(200).json({ ok: true })

    } catch (error) {
      console.log('Error al actualizar horario:', error)
      return res.status(500).json({ error: 'Error al guardar horario' })
    }
  }

  return res.status(405).json({ error: 'Metodo no permitido' })
}
