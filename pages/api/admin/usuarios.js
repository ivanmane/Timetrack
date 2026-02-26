// API para administrar usuarios (solo admin)
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import pool from '../../../lib/db'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionConfig)

  // Solo el admin puede acceder a esta API
  if (!session.usuario || session.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos' })
  }

  // ── GET: obtener todos los usuarios ───────────────────
  if (req.method === 'GET') {
    try {
      const resultado = await pool.query(
        `SELECT u.id, u.nombre, u.email, u.rol, u.departamento, u.activo,
                u.lider_id, l.nombre as nombre_lider
         FROM usuarios u
         LEFT JOIN usuarios l ON l.id = u.lider_id
         ORDER BY u.nombre`
      )
      return res.status(200).json({ usuarios: resultado.rows })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ error: 'Error al obtener usuarios' })
    }
  }

  // ── POST: crear usuario ────────────────────────────────
  if (req.method === 'POST') {
    const { nombre, email, password, rol, departamento, lider_id } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' })
    }

    try {
      // Encriptamos la contraseña
      const passwordHash = await bcrypt.hash(password, 10)

      const resultado = await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol, departamento, lider_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, email, rol, departamento`,
        [nombre, email, passwordHash, rol || 'empleado', departamento, lider_id || null]
      )

      // Creamos el horario por default para el nuevo usuario
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
      for (const dia of dias) {
        const esFinDeSemana = dia === 'sabado' || dia === 'domingo'
        await pool.query(
          `INSERT INTO horarios (usuario_id, dia_semana, activo, hora_entrada, hora_salida, hora_comida, duracion_comida)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [resultado.rows[0].id, dia, !esFinDeSemana,
           esFinDeSemana ? null : '09:00',
           esFinDeSemana ? null : '18:00',
           esFinDeSemana ? null : '14:00',
           esFinDeSemana ? 0 : 60]
        )
      }

      return res.status(201).json({ usuario: resultado.rows[0] })

    } catch (error) {
      // Si el email ya existe
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Ese email ya esta registrado' })
      }
      console.log(error)
      return res.status(500).json({ error: 'Error al crear usuario' })
    }
  }

  // ── PUT: editar usuario ────────────────────────────────
  if (req.method === 'PUT') {
    const { id, nombre, email, rol, departamento, lider_id, activo } = req.body

    try {
      await pool.query(
        `UPDATE usuarios SET nombre=$1, email=$2, rol=$3, departamento=$4, lider_id=$5, activo=$6
         WHERE id=$7`,
        [nombre, email, rol, departamento, lider_id || null, activo, id]
      )
      return res.status(200).json({ ok: true })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ error: 'Error al actualizar usuario' })
    }
  }

  return res.status(405).json({ error: 'Metodo no permitido' })
}
