// API de login
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import pool from '../../../lib/db'
import { sessionConfig } from '../../../lib/session'

export default async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const { email, password } = req.body

  // Validar que vengan los datos
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos' })
  }

  try {
    // Buscar el usuario en la base de datos
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    )

    const usuario = resultado.rows[0]

    // Si no existe el usuario
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    // Verificar la contraseña
    const passwordCorrecta = await bcrypt.compare(password, usuario.password)

    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    // Guardar el usuario en la sesion
    const session = await getIronSession(req, res, sessionConfig)
    session.usuario = {
      id:          usuario.id,
      nombre:      usuario.nombre,
      email:       usuario.email,
      rol:         usuario.rol,
      departamento: usuario.departamento,
      lider_id:    usuario.lider_id
    }
    await session.save()

    // Devolver los datos del usuario (sin el password)
    return res.status(200).json({
      usuario: session.usuario
    })

  } catch (error) {
    console.log('Error en login:', error)
    return res.status(500).json({ error: 'Error del servidor' })
  }
}
