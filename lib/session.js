// Configuracion de sesiones
// Usamos iron-session que es mas sencillo que JWT

export const sessionConfig = {
  password: process.env.SESSION_SECRET,
  cookieName: 'timetrack_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8  // 8 horas
  }
}
