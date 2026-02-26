// Conexion a la base de datos
import { Pool } from 'pg'

// Creamos el pool de conexiones con la variable de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export default pool
