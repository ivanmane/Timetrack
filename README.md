# TimeTrack Pro — Control de Horarios

App web para registrar entrada/salida, comidas, tiempos personales e incidencias de empleados.

## Tecnologías usadas
- **Next.js 14** — Framework de React con rutas de API integradas
- **React** — Para la interfaz de usuario
- **PostgreSQL** — Base de datos
- **iron-session** — Para manejo de sesiones
- **bcryptjs** — Para encriptar contraseñas

## Cómo instalar y correr el proyecto

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear la base de datos
Crea una base de datos en [Neon](https://neon.tech) (es gratis) y ejecuta el archivo `schema.sql` en el SQL Editor.

### 3. Configurar variables de entorno
Copia `.env.example` a `.env.local` y llena los valores:
```
DATABASE_URL=tu_url_de_postgresql
SESSION_SECRET=un_texto_largo_y_aleatorio
```

### 4. Insertar datos de prueba
```bash
node scripts/seed.js
```

### 5. Correr en desarrollo
```bash
npm run dev
```
Abre http://localhost:3000

## Cuentas de prueba
| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@empresa.com | admin123 |
| Líder | carlos@empresa.com | emp123 |
| Empleado | sofia@empresa.com | emp123 |

## Despliegue en Vercel
1. Sube el proyecto a GitHub
2. Ve a vercel.com y crea un nuevo proyecto
3. Conecta tu repositorio
4. Agrega las variables `DATABASE_URL` y `SESSION_SECRET` en Settings → Environment Variables
5. Click en Deploy
