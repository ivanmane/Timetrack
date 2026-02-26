// API para generar reportes (admin y lideres)
import { getIronSession } from 'iron-session'
import pool from '../../../lib/db'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionConfig)

  if (!session.usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesion' })
  }

  // Solo admin y lideres pueden ver reportes
  if (session.usuario.rol === 'empleado') {
    return res.status(403).json({ error: 'No tienes permisos' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const { tipo, usuarioId, liderId, desde, hasta, formato } = req.query

  try {
    // Construimos la consulta segun el tipo de reporte
    let query = `
      SELECT
        u.nombre,
        u.departamento,
        l.nombre as lider,
        r.fecha,
        r.entrada,
        r.salida,
        r.inicio_comida,
        r.fin_comida,
        r.inicio_personal,
        r.fin_personal
      FROM registros r
      JOIN usuarios u ON u.id = r.usuario_id
      LEFT JOIN usuarios l ON l.id = u.lider_id
      WHERE u.activo = true
    `
    const params = []

    // Filtro por tipo de reporte
    if (tipo === 'empleado' && usuarioId) {
      params.push(usuarioId)
      query += ` AND r.usuario_id = $${params.length}`
    } else if (tipo === 'lider' && liderId) {
      params.push(liderId)
      query += ` AND u.lider_id = $${params.length}`
    } else if (session.usuario.rol === 'lider') {
      // Los lideres solo ven a su equipo
      params.push(session.usuario.id)
      query += ` AND u.lider_id = $${params.length}`
    }

    // Filtros de fecha
    if (desde) {
      params.push(desde)
      query += ` AND r.fecha >= $${params.length}`
    }
    if (hasta) {
      params.push(hasta)
      query += ` AND r.fecha <= $${params.length}`
    }

    query += ' ORDER BY r.fecha DESC, u.nombre'

    const resultado = await pool.query(query, params)
    const registros = resultado.rows

    // Si piden CSV, generamos el archivo
    if (formato === 'csv') {
      const encabezados = ['Empleado', 'Departamento', 'Lider', 'Fecha', 'Entrada', 'Salida', 'Inicio Comida', 'Fin Comida', 'Inicio Personal', 'Fin Personal']
      
      let csv = encabezados.join(',') + '\n'
      
      registros.forEach(r => {
        const fila = [
          r.nombre,
          r.departamento || '',
          r.lider || '',
          r.fecha ? r.fecha.toISOString().slice(0, 10) : '',
          r.entrada   ? r.entrada.slice(0, 5)   : '',
          r.salida    ? r.salida.slice(0, 5)    : '',
          r.inicio_comida   ? r.inicio_comida.slice(0, 5)   : '',
          r.fin_comida      ? r.fin_comida.slice(0, 5)      : '',
          r.inicio_personal ? r.inicio_personal.slice(0, 5) : '',
          r.fin_personal    ? r.fin_personal.slice(0, 5)    : ''
        ]
        csv += fila.map(v => `"${v}"`).join(',') + '\n'
      })

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=reporte.csv')
      return res.status(200).send('\uFEFF' + csv) // el \uFEFF es para que Excel lo abra bien
    }

    return res.status(200).json({ registros })

  } catch (error) {
    console.log('Error en reporte:', error)
    return res.status(500).json({ error: 'Error al generar reporte' })
  }
}
