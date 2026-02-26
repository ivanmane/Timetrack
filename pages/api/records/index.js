// API para los registros de tiempo (checadas)
import { getIronSession } from 'iron-session'
import pool from '../../../lib/db'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  // Verificar que el usuario este logueado
  const session = await getIronSession(req, res, sessionConfig)
  if (!session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesion' })
  }

  const usuario = session.usuario

  // ── GET: obtener registros ─────────────────────────────
  if (req.method === 'GET') {
    const { fecha, desde, hasta, usuarioId } = req.query

    // Los admins y lideres pueden ver registros de otros usuarios
    let targetId = usuario.id
    if ((usuario.rol === 'admin' || usuario.rol === 'lider') && usuarioId) {
      targetId = usuarioId
    }

    try {
      let query = 'SELECT * FROM registros WHERE usuario_id = $1'
      let params = [targetId]

      if (fecha) {
        query += ' AND fecha = $2'
        params.push(fecha)
      } else {
        if (desde) {
          params.push(desde)
          query += ` AND fecha >= $${params.length}`
        }
        if (hasta) {
          params.push(hasta)
          query += ` AND fecha <= $${params.length}`
        }
      }

      query += ' ORDER BY fecha DESC'

      const resultado = await pool.query(query, params)

      // Tambien traemos las incidencias de cada registro
      const registros = resultado.rows
      for (let i = 0; i < registros.length; i++) {
        const incidencias = await pool.query(
          'SELECT * FROM incidencias WHERE usuario_id = $1 AND fecha = $2 ORDER BY hora',
          [targetId, registros[i].fecha]
        )
        registros[i].incidencias = incidencias.rows
      }

      return res.status(200).json({ registros })

    } catch (error) {
      console.log('Error al obtener registros:', error)
      return res.status(500).json({ error: 'Error al obtener registros' })
    }
  }

  // ── POST: guardar una checada ──────────────────────────
  if (req.method === 'POST') {
    const { fecha, campo, valor } = req.body

    // Validar que el campo sea valido
    const camposValidos = ['entrada', 'salida', 'inicio_comida', 'fin_comida', 'inicio_personal', 'fin_personal']
    if (!camposValidos.includes(campo)) {
      return res.status(400).json({ error: 'Campo no valido' })
    }

    try {
      // Primero verificamos si ya existe un registro para ese dia
      const existe = await pool.query(
        'SELECT id FROM registros WHERE usuario_id = $1 AND fecha = $2',
        [usuario.id, fecha]
      )

      if (existe.rows.length > 0) {
        // Si ya existe, solo actualizamos el campo
        await pool.query(
          `UPDATE registros SET ${campo} = $1 WHERE usuario_id = $2 AND fecha = $3`,
          [valor, usuario.id, fecha]
        )
      } else {
        // Si no existe, creamos un nuevo registro
        await pool.query(
          `INSERT INTO registros (usuario_id, fecha, ${campo}) VALUES ($1, $2, $3)`,
          [usuario.id, fecha, valor]
        )
      }

      // Traemos el registro actualizado para devolverlo
      const registroActualizado = await pool.query(
        'SELECT * FROM registros WHERE usuario_id = $1 AND fecha = $2',
        [usuario.id, fecha]
      )

      return res.status(200).json({ registro: registroActualizado.rows[0] })

    } catch (error) {
      console.log('Error al guardar checada:', error)
      return res.status(500).json({ error: 'Error al guardar' })
    }
  }

  return res.status(405).json({ error: 'Metodo no permitido' })
}
