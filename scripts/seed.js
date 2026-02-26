// Script para insertar datos de prueba
// Ejecutar con: node scripts/seed.js

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function insertarDatos() {
  console.log('Insertando datos de prueba...')

  try {
    // Crear usuarios
    const passwordAdmin = await bcrypt.hash('admin123', 10)
    const passwordEmp   = await bcrypt.hash('emp123', 10)

    // Admin
    const admin = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, departamento)
       VALUES ('Admin Sistema', 'admin@empresa.com', $1, 'admin', 'Administracion')
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [passwordAdmin]
    )

    // Lideres
    const carlos = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, departamento)
       VALUES ('Carlos Mendoza', 'carlos@empresa.com', $1, 'lider', 'Desarrollo')
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [passwordEmp]
    )

    const ana = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, departamento)
       VALUES ('Ana Lopez', 'ana@empresa.com', $1, 'lider', 'Marketing')
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [passwordEmp]
    )

    // Empleados
    if (carlos.rows[0]) {
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol, departamento, lider_id)
         VALUES ('Sofia Ramirez', 'sofia@empresa.com', $1, 'empleado', 'Desarrollo', $2)
         ON CONFLICT (email) DO NOTHING`,
        [passwordEmp, carlos.rows[0].id]
      )
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol, departamento, lider_id)
         VALUES ('Juan Torres', 'juan@empresa.com', $1, 'empleado', 'Desarrollo', $2)
         ON CONFLICT (email) DO NOTHING`,
        [passwordEmp, carlos.rows[0].id]
      )
    }

    if (ana.rows[0]) {
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol, departamento, lider_id)
         VALUES ('Pedro Jimenez', 'pedro@empresa.com', $1, 'empleado', 'Marketing', $2)
         ON CONFLICT (email) DO NOTHING`,
        [passwordEmp, ana.rows[0].id]
      )
    }

    // Insertar horarios para cada usuario
    const usuarios = await pool.query(`SELECT id FROM usuarios WHERE rol != 'admin'`)
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

    for (const u of usuarios.rows) {
      for (const dia of dias) {
        const esFinDeSemana = dia === 'sabado' || dia === 'domingo'
        const esViernes = dia === 'viernes'

        await pool.query(
          `INSERT INTO horarios (usuario_id, dia_semana, activo, hora_entrada, hora_salida, hora_comida, duracion_comida)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
          [u.id, dia, !esFinDeSemana,
           esFinDeSemana ? null : '09:00',
           esFinDeSemana ? null : esViernes ? '15:00' : '18:00',
           esFinDeSemana ? null : esViernes ? '13:00' : '14:00',
           esFinDeSemana ? 0 : esViernes ? 30 : 60]
        )
      }
    }

    // Dias festivos
    const festivos = [
      ['2025-01-01', 'Año Nuevo'],
      ['2025-02-03', 'Dia de la Constitucion'],
      ['2025-03-17', 'Natalicio de Benito Juarez'],
      ['2025-05-01', 'Dia del Trabajo'],
      ['2025-09-15', 'Independencia de Mexico'],
      ['2025-11-17', 'Revolucion Mexicana'],
      ['2025-12-25', 'Navidad'],
      ['2026-01-01', 'Año Nuevo 2026'],
    ]

    for (const [fecha, desc] of festivos) {
      await pool.query(
        `INSERT INTO dias_festivos (fecha, descripcion) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [fecha, desc]
      )
    }

    console.log('✅ Datos insertados correctamente!')
    console.log('')
    console.log('Usuarios de prueba:')
    console.log('  admin@empresa.com  / admin123  (Admin)')
    console.log('  carlos@empresa.com / emp123    (Lider)')
    console.log('  sofia@empresa.com  / emp123    (Empleado)')

  } catch (error) {
    console.log('Error:', error.message)
  }

  await pool.end()
}

insertarDatos()
