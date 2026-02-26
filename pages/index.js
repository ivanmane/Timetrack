// Pagina principal de TimeTrack
import { useState, useEffect } from 'react'
import Head from 'next/head'

// Dias de la semana en español
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const DIAS_LABEL  = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' }

// Funcion para obtener la fecha de hoy en formato YYYY-MM-DD
function obtenerFechaHoy() {
  const hoy = new Date()
  const year  = hoy.getFullYear()
  const mes   = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia   = String(hoy.getDate()).padStart(2, '0')
  return `${year}-${mes}-${dia}`
}

// Funcion para obtener la hora actual en formato HH:MM
function obtenerHoraActual() {
  const ahora = new Date()
  const horas   = String(ahora.getHours()).padStart(2, '0')
  const minutos = String(ahora.getMinutes()).padStart(2, '0')
  return `${horas}:${minutos}`
}

// Componente del reloj en tiempo real
function Reloj() {
  const [hora, setHora] = useState('')

  useEffect(() => {
    // Actualizamos el reloj cada segundo
    const intervalo = setInterval(() => {
      const ahora = new Date()
      const h = String(ahora.getHours()).padStart(2, '0')
      const m = String(ahora.getMinutes()).padStart(2, '0')
      const s = String(ahora.getSeconds()).padStart(2, '0')
      setHora(`${h}:${m}:${s}`)
    }, 1000)

    return () => clearInterval(intervalo)
  }, [])

  return <span style={{ fontFamily: 'monospace', fontSize: 28, color: '#4f8ef7', fontWeight: 600, letterSpacing: 2 }}>{hora}</span>
}

// ── PANTALLA DE LOGIN ──────────────────────────────────────────
function PantallaLogin({ onLogin }) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña')
      return
    }

    setCargando(true)
    setError('')

    try {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.error)
        setCargando(false)
        return
      }

      // Si el login fue exitoso, mandamos el usuario al componente padre
      onLogin(datos.usuario)

    } catch (e) {
      setError('Error de conexion')
      setCargando(false)
    }
  }

  const estiloInput = {
    width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #232b42',
    background: '#1a2035', color: '#e8edf8', fontSize: 14, fontFamily: 'inherit', outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400 }}>
        
        {/* Logo y titulo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏱</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8edf8', margin: 0 }}>TimeTrack Pro</h1>
          <p style={{ color: '#6b7a9e', fontSize: 13, marginTop: 6 }}>Ingresa con tu cuenta de empresa</p>
        </div>

        {/* Formulario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7a9e', marginBottom: 6, fontWeight: 600 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="tucorreo@empresa.com"
              style={estiloInput}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7a9e', marginBottom: 6, fontWeight: 600 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={estiloInput}
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <p style={{ color: '#f75f5f', fontSize: 13, textAlign: 'center', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={cargando}
            style={{
              background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 15, fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.6 : 1, fontFamily: 'inherit', marginTop: 4
            }}
          >
            {cargando ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DASHBOARD EMPLEADO ─────────────────────────────────────────
function DashboardEmpleado({ usuario, onLogout }) {
  const [pestana, setPestana]           = useState('hoy')
  const [registroHoy, setRegistroHoy]   = useState(null)
  const [horario, setHorario]           = useState({})
  const [historial, setHistorial]       = useState([])
  const [semana, setSemana]             = useState([])
  const [registrosSemana, setRegistrosSemana] = useState([])
  const [cargando, setCargando]         = useState(true)
  const [mensaje, setMensaje]           = useState(null)

  // Modal de incidencias
  const [mostrarIncidencia, setMostrarIncidencia] = useState(false)
  const [textoIncidencia, setTextoIncidencia]     = useState('')

  // Fechas festivas y vacaciones
  const [festivos, setFestivos]   = useState([])
  const [vacaciones, setVacaciones] = useState([])

  const fechaHoy = obtenerFechaHoy()
  const diaHoy   = DIAS_SEMANA[new Date().getDay()]

  // Mostrar notificacion temporal
  function notificar(texto, tipo = 'exito') {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 3000)
  }

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      // Cargamos el horario del usuario
      const resHorario = await fetch(`/api/records/horarios?usuarioId=${usuario.id}`)
      const datosHorario = await resHorario.json()
      setHorario(datosHorario.horario || {})

      // Cargamos el registro de hoy
      const resRegistro = await fetch(`/api/records?fecha=${fechaHoy}`)
      const datosRegistro = await resRegistro.json()
      setRegistroHoy(datosRegistro.registros?.[0] || null)

      // Cargamos festivos
      const resFestivos = await fetch(`/api/admin/festivos`)
      const datosFestivos = await resFestivos.json()
      setFestivos(datosFestivos.festivos?.map(f => f.fecha.slice(0, 10)) || [])
      setVacaciones(datosFestivos.vacaciones?.filter(v => v.usuario_id === usuario.id).map(v => v.fecha.slice(0, 10)) || [])

    } catch (e) {
      console.log('Error al cargar datos:', e)
    } finally {
      setCargando(false)
    }
  }

  // Cargar historial
  async function cargarHistorial() {
    const res = await fetch(`/api/records`)
    const datos = await res.json()
    setHistorial(datos.registros || [])
  }

  // Cargar semana actual
  async function cargarSemana() {
    const hoy = new Date()
    const diaSemana = hoy.getDay()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))

    const diasSemana = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes)
      d.setDate(lunes.getDate() + i)
      const fechaStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      diasSemana.push({ fecha: fechaStr, diaKey: DIAS_SEMANA[d.getDay()] })
    }
    setSemana(diasSemana)

    const desde = diasSemana[0].fecha
    const hasta  = diasSemana[6].fecha
    const res = await fetch(`/api/records?desde=${desde}&hasta=${hasta}`)
    const datos = await res.json()
    setRegistrosSemana(datos.registros || [])
  }

  useEffect(() => {
    if (pestana === 'historial') cargarHistorial()
    if (pestana === 'semana') cargarSemana()
  }, [pestana])

  // Marcar una checada
  async function marcar(campo) {
    const hora = obtenerHoraActual()
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fechaHoy, campo, valor: hora })
      })
      const datos = await res.json()
      setRegistroHoy(datos.registro)

      const etiquetas = { entrada: 'Entrada', salida: 'Salida', inicio_comida: 'Inicio de comida', fin_comida: 'Fin de comida', inicio_personal: 'Inicio tiempo personal', fin_personal: 'Fin tiempo personal' }
      notificar(`✓ ${etiquetas[campo]} registrada: ${hora}`)
    } catch (e) {
      notificar('Error al guardar', 'error')
    }
  }

  // Guardar incidencia
  async function guardarIncidencia() {
    if (!textoIncidencia.trim()) return
    try {
      await fetch('/api/records/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fechaHoy, descripcion: textoIncidencia, hora: obtenerHoraActual() })
      })
      setTextoIncidencia('')
      setMostrarIncidencia(false)
      notificar('⚠ Incidencia registrada')
      cargarDatos()
    } catch (e) {
      notificar('Error al guardar', 'error')
    }
  }

  // Cerrar sesion
  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }

  const horarioHoy     = horario[diaHoy]
  const esFestivo      = festivos.includes(fechaHoy)
  const esVacacion     = vacaciones.includes(fechaHoy)

  if (cargando) {
    return <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7a9e', fontFamily: 'monospace' }}>Cargando...</div>
  }

  const estiloBotonPestana = (id) => ({
    background: pestana === id ? '#4f8ef7' : 'transparent',
    color: pestana === id ? '#fff' : '#6b7a9e',
    border: pestana === id ? 'none' : '1px solid #232b42',
    borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', fontFamily: 'system-ui, sans-serif', color: '#e8edf8' }}>
      
      {/* Notificacion */}
      {mensaje && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: mensaje.tipo === 'error' ? '#f75f5f' : '#38d9a9',
          color: mensaje.tipo === 'error' ? '#fff' : '#0a1a14',
          padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Header */}
      <header style={{ background: '#141928', borderBottom: '1px solid #232b42', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⏱</span>
          <span style={{ fontWeight: 800, fontSize: 17 }}>TimeTrack Pro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Reloj />
          <span style={{ fontSize: 14, color: '#6b7a9e' }}>{usuario.nombre}</span>
          <button onClick={cerrarSesion} style={{ background: 'transparent', border: '1px solid #232b42', color: '#6b7a9e', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            Salir
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px' }}>
        
        {/* Saludo */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: '#6b7a9e', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
            Hola, {usuario.nombre.split(' ')[0]} 👋
          </h2>
        </div>

        {/* Indicadores de estado */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {esFestivo && <span style={{ background: '#f7a14f22', color: '#f7a14f', border: '1px solid #f7a14f44', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>🎉 Día festivo</span>}
          {esVacacion && <span style={{ background: '#38d9a922', color: '#38d9a9', border: '1px solid #38d9a944', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>🏖 Vacaciones</span>}
          {horarioHoy?.activo && !esFestivo && !esVacacion && (
            <span style={{ background: '#4f8ef722', color: '#4f8ef7', border: '1px solid #4f8ef744', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
              📅 {horarioHoy.entrada} — {horarioHoy.salida}
            </span>
          )}
        </div>

        {/* Pestanas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button style={estiloBotonPestana('hoy')} onClick={() => setPestana('hoy')}>Hoy</button>
          <button style={estiloBotonPestana('semana')} onClick={() => setPestana('semana')}>Semana</button>
          <button style={estiloBotonPestana('historial')} onClick={() => setPestana('historial')}>Historial</button>
        </div>

        {/* ── PESTANA HOY ── */}
        {pestana === 'hoy' && (
          <div>
            {/* Tarjetas de checadas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
              {[
                { etiqueta: 'Entrada',          campo: 'entrada',          color: '#38d9a9', icono: '🟢' },
                { etiqueta: 'Salida',           campo: 'salida',           color: '#f75f5f', icono: '🔴' },
                { etiqueta: 'Inicio comida',    campo: 'inicio_comida',    color: '#f7a14f', icono: '🍽' },
                { etiqueta: 'Fin comida',       campo: 'fin_comida',       color: '#f7a14f', icono: '✅' },
                { etiqueta: 'Inicio personal',  campo: 'inicio_personal',  color: '#4f8ef7', icono: '🚶' },
                { etiqueta: 'Fin personal',     campo: 'fin_personal',     color: '#4f8ef7', icono: '↩' },
              ].map(({ etiqueta, campo, color, icono }) => {
                const valorRegistrado = registroHoy?.[campo]
                return (
                  <div key={campo} style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 16 }}>
                    <p style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px' }}>{etiqueta}</p>
                    <p style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: valorRegistrado ? color : '#232b42', margin: '0 0 12px' }}>
                      {valorRegistrado ? valorRegistrado.slice(0, 5) : '--:--'}
                    </p>
                    {!valorRegistrado ? (
                      <button
                        onClick={() => marcar(campo)}
                        style={{ background: 'transparent', border: '1px solid #232b42', color: '#6b7a9e', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                      >
                        {icono} Marcar ahora
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{icono} Registrado</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Incidencias */}
            <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>⚠ Incidencias del día</h3>
                <button
                  onClick={() => setMostrarIncidencia(true)}
                  style={{ background: '#f7a14f', color: '#1a0d00', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                >
                  + Agregar
                </button>
              </div>
              {!registroHoy?.incidencias?.length ? (
                <p style={{ color: '#6b7a9e', fontSize: 13, margin: 0 }}>Sin incidencias hoy.</p>
              ) : (
                registroHoy.incidencias.map((inc, i) => (
                  <div key={i} style={{ background: '#1a2035', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', gap: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#f7a14f', flexShrink: 0 }}>{inc.hora?.slice(0, 5)}</span>
                    <span style={{ fontSize: 13 }}>{inc.descripcion}</span>
                  </div>
                ))
              )}
            </div>

            {/* Horario de hoy */}
            {horarioHoy?.activo && (
              <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>📋 Tu horario de hoy</h3>
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>Entrada</p>
                    <p style={{ fontFamily: 'monospace', fontSize: 22, color: '#38d9a9', margin: 0 }}>{horarioHoy.entrada}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>Salida</p>
                    <p style={{ fontFamily: 'monospace', fontSize: 22, color: '#f75f5f', margin: 0 }}>{horarioHoy.salida}</p>
                  </div>
                  {horarioHoy.comida && (
                    <div>
                      <p style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>Comida</p>
                      <p style={{ fontFamily: 'monospace', fontSize: 22, color: '#f7a14f', margin: 0 }}>{horarioHoy.comida} ({horarioHoy.duracionComida} min)</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PESTANA SEMANA ── */}
        {pestana === 'semana' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {semana.map(({ fecha, diaKey }) => {
              const ds  = horario[diaKey]
              const rec = registrosSemana.find(r => r.fecha?.slice(0, 10) === fecha)
              const esHoy   = fecha === fechaHoy
              const esFest  = festivos.includes(fecha)
              const esVac   = vacaciones.includes(fecha)

              return (
                <div key={fecha} style={{ background: esHoy ? '#4f8ef710' : '#141928', border: `1px solid ${esHoy ? '#4f8ef744' : '#232b42'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 110 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{DIAS_LABEL[diaKey]}</p>
                    <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7a9e', margin: '2px 0 0' }}>{fecha}</p>
                    {esHoy && <span style={{ fontSize: 10, color: '#4f8ef7', fontWeight: 700 }}>● Hoy</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    {esFest ? <span style={{ color: '#f7a14f', fontSize: 13, fontWeight: 600 }}>🎉 Día festivo</span>
                    : esVac ? <span style={{ color: '#38d9a9', fontSize: 13, fontWeight: 600 }}>🏖 Vacaciones</span>
                    : !ds?.activo ? <span style={{ color: '#6b7a9e', fontSize: 13 }}>No laborable</span>
                    : (
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#4f8ef7' }}>{ds.entrada} — {ds.salida}</span>
                        {ds.comida && <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#f7a14f' }}>🍽 {ds.comida}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {rec?.entrada && <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#38d9a9' }}>↓ {rec.entrada.slice(0, 5)}</span>}
                    {rec?.salida  && <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#f75f5f' }}>↑ {rec.salida.slice(0, 5)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── PESTANA HISTORIAL ── */}
        {pestana === 'historial' && (
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Historial de registros</h3>
            {!historial.length ? (
              <p style={{ color: '#6b7a9e', fontSize: 13 }}>Sin registros aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {historial.map((reg, i) => (
                  <div key={i} style={{ background: '#1a2035', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#4f8ef7' }}>{reg.fecha?.slice(0, 10)}</span>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {reg.entrada  && <span style={{ fontSize: 12 }}>🟢 {reg.entrada.slice(0, 5)}</span>}
                      {reg.salida   && <span style={{ fontSize: 12 }}>🔴 {reg.salida.slice(0, 5)}</span>}
                      {reg.inicio_comida && <span style={{ fontSize: 12 }}>🍽 {reg.inicio_comida.slice(0, 5)}</span>}
                      {reg.incidencias?.length > 0 && <span style={{ background: '#f7a14f22', color: '#f7a14f', border: '1px solid #f7a14f44', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>⚠ {reg.incidencias.length}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de incidencia */}
      {mostrarIncidencia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setMostrarIncidencia(false)}>
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px' }}>⚠ Registrar incidencia</h3>
            <textarea
              value={textoIncidencia}
              onChange={e => setTextoIncidencia(e.target.value)}
              placeholder="Describe la incidencia..."
              rows={4}
              style={{ width: '100%', background: '#1a2035', border: '1px solid #232b42', borderRadius: 8, padding: 12, color: '#e8edf8', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setMostrarIncidencia(false)} style={{ background: 'transparent', border: '1px solid #232b42', color: '#6b7a9e', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={guardarIncidencia} style={{ background: '#f7a14f', color: '#1a0d00', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DASHBOARD ADMIN ────────────────────────────────────────────
function DashboardAdmin({ usuario, onLogout }) {
  const [pestana, setPestana]   = useState('resumen')
  const [usuarios, setUsuarios] = useState([])
  const [actividad, setActividad] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje]   = useState(null)

  // Reporte
  const [tipoReporte, setTipoReporte]   = useState('todos')
  const [targetId, setTargetId]         = useState('')
  const [fechaDesde, setFechaDesde]     = useState('')
  const [fechaHasta, setFechaHasta]     = useState('')
  const [reporteData, setReporteData]   = useState([])

  // Modal editar horario
  const [usuarioHorario, setUsuarioHorario]   = useState(null)
  const [horarioEditar, setHorarioEditar]     = useState(null)

  // Modal crear/editar usuario
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false)
  const [usuarioEditar, setUsuarioEditar]           = useState(null)
  const [formUsuario, setFormUsuario] = useState({ nombre: '', email: '', password: '', rol: 'empleado', departamento: '', lider_id: '' })

  const fechaHoy = obtenerFechaHoy()

  function notificar(texto, tipo = 'exito') {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 3000)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      const [resUsuarios, resActividad] = await Promise.all([
        fetch('/api/admin/usuarios'),
        fetch(`/api/records?desde=${fechaHoy}&hasta=${fechaHoy}`)
      ])
      const datosUsuarios  = await resUsuarios.json()
      const datosActividad = await resActividad.json()
      setUsuarios(datosUsuarios.usuarios || [])
      setActividad(datosActividad.registros || [])
    } catch (e) {
      console.log('Error:', e)
    } finally {
      setCargando(false)
    }
  }

  async function abrirHorario(emp) {
    const res = await fetch(`/api/records/horarios?usuarioId=${emp.id}`)
    const datos = await res.json()
    setUsuarioHorario(emp)
    setHorarioEditar(datos.horario)
  }

  async function guardarHorario() {
    try {
      await fetch(`/api/records/horarios?usuarioId=${usuarioHorario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horario: horarioEditar })
      })
      notificar(`✓ Horario guardado: ${usuarioHorario.nombre}`)
      setUsuarioHorario(null)
    } catch (e) {
      notificar('Error al guardar', 'error')
    }
  }

  async function guardarUsuario() {
    try {
      const metodo = usuarioEditar ? 'PUT' : 'POST'
      const body   = usuarioEditar ? { ...formUsuario, id: usuarioEditar.id } : formUsuario

      const res = await fetch('/api/admin/usuarios', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const datos = await res.json()
      if (!res.ok) {
        notificar(datos.error, 'error')
        return
      }
      notificar(usuarioEditar ? '✓ Usuario actualizado' : '✓ Usuario creado')
      setMostrarFormUsuario(false)
      cargarDatos()
    } catch (e) {
      notificar('Error', 'error')
    }
  }

  async function verReporte() {
    let url = `/api/admin/reportes?tipo=${tipoReporte}`
    if (tipoReporte === 'empleado') url += `&usuarioId=${targetId}`
    if (tipoReporte === 'lider')    url += `&liderId=${targetId}`
    if (fechaDesde) url += `&desde=${fechaDesde}`
    if (fechaHasta) url += `&hasta=${fechaHasta}`

    const res   = await fetch(url)
    const datos = await res.json()
    setReporteData(datos.registros || [])
  }

  function descargarCSV() {
    let url = `/api/admin/reportes?tipo=${tipoReporte}&formato=csv`
    if (tipoReporte === 'empleado') url += `&usuarioId=${targetId}`
    if (tipoReporte === 'lider')    url += `&liderId=${targetId}`
    if (fechaDesde) url += `&desde=${fechaDesde}`
    if (fechaHasta) url += `&hasta=${fechaHasta}`
    window.open(url, '_blank')
  }

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }

  const empleados = usuarios.filter(u => u.rol !== 'admin')
  const lideres   = usuarios.filter(u => u.rol === 'lider')

  const estiloBotonPestana = (id) => ({
    background: pestana === id ? '#4f8ef7' : 'transparent',
    color: pestana === id ? '#fff' : '#6b7a9e',
    border: pestana === id ? 'none' : '1px solid #232b42',
    borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
  })

  const inpStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #232b42', background: '#1a2035', color: '#e8edf8', fontSize: 14, fontFamily: 'inherit', outline: 'none' }

  if (cargando) return <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7a9e' }}>Cargando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', fontFamily: 'system-ui, sans-serif', color: '#e8edf8' }}>
      
      {mensaje && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: mensaje.tipo === 'error' ? '#f75f5f' : '#38d9a9', color: mensaje.tipo === 'error' ? '#fff' : '#0a1a14', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {mensaje.texto}
        </div>
      )}

      <header style={{ background: '#141928', borderBottom: '1px solid #232b42', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⏱</span>
          <span style={{ fontWeight: 800, fontSize: 17 }}>TimeTrack Pro</span>
          <span style={{ background: '#f7a14f22', color: '#f7a14f', border: '1px solid #f7a14f44', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Reloj />
          <button onClick={cerrarSesion} style={{ background: 'transparent', border: '1px solid #232b42', color: '#6b7a9e', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Salir</button>
        </div>
      </header>

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Empleados', valor: empleados.length, icono: '👥', color: '#4f8ef7' },
            { label: 'Check-ins hoy', valor: actividad.filter(r => r.entrada).length, icono: '🟢', color: '#38d9a9' },
            { label: 'Líderes', valor: lideres.length, icono: '👑', color: '#f7a14f' },
          ].map(({ label, valor, icono, color }) => (
            <div key={label} style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icono}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 600, color }}>{valor}</div>
              <div style={{ fontSize: 12, color: '#6b7a9e', marginTop: 4, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pestanas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button style={estiloBotonPestana('resumen')}  onClick={() => setPestana('resumen')}>Resumen</button>
          <button style={estiloBotonPestana('usuarios')} onClick={() => setPestana('usuarios')}>Usuarios</button>
          <button style={estiloBotonPestana('horarios')} onClick={() => setPestana('horarios')}>Horarios</button>
          <button style={estiloBotonPestana('reportes')} onClick={() => setPestana('reportes')}>Reportes</button>
        </div>

        {/* RESUMEN */}
        {pestana === 'resumen' && (
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Actividad de hoy — {fechaHoy}</h3>
            {!empleados.length ? <p style={{ color: '#6b7a9e', fontSize: 13 }}>Sin empleados.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {empleados.map(emp => {
                  const reg = actividad.find(r => r.usuario_id === emp.id)
                  return (
                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#1a2035', borderRadius: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4f8ef722', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4f8ef7', flexShrink: 0 }}>
                        {emp.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{emp.nombre}</p>
                        <p style={{ fontSize: 11, color: '#6b7a9e', margin: 0 }}>{emp.departamento}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {reg?.entrada ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#38d9a9' }}>↓ {reg.entrada.slice(0,5)}</span> : <span style={{ fontSize: 12, color: '#232b42' }}>Sin entrada</span>}
                        {reg?.salida  && <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#f75f5f' }}>↑ {reg.salida.slice(0,5)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* USUARIOS */}
        {pestana === 'usuarios' && (
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Usuarios del sistema</h3>
              <button onClick={() => { setUsuarioEditar(null); setFormUsuario({ nombre:'',email:'',password:'',rol:'empleado',departamento:'',lider_id:'' }); setMostrarFormUsuario(true) }}
                style={{ background: '#38d9a9', color: '#0a1a14', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                + Nuevo usuario
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {usuarios.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#1a2035', borderRadius: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{u.nombre}</p>
                    <p style={{ fontSize: 11, color: '#6b7a9e', margin: 0 }}>{u.email} · {u.departamento}</p>
                  </div>
                  <span style={{ background: '#4f8ef722', color: '#4f8ef7', border: '1px solid #4f8ef744', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{u.rol}</span>
                  <button onClick={() => { setUsuarioEditar(u); setFormUsuario({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, departamento: u.departamento||'', lider_id: u.lider_id||'' }); setMostrarFormUsuario(true) }}
                    style={{ background: 'transparent', border: '1px solid #232b42', color: '#6b7a9e', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                    ✏ Editar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HORARIOS */}
        {pestana === 'horarios' && (
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Gestión de horarios</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {empleados.map(emp => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#1a2035', borderRadius: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{emp.nombre}</p>
                    <p style={{ fontSize: 11, color: '#6b7a9e', margin: 0 }}>{emp.departamento}</p>
                  </div>
                  <button onClick={() => abrirHorario(emp)}
                    style={{ background: 'transparent', border: '1px solid #4f8ef7', color: '#4f8ef7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                    ✏ Editar horario
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTES */}
        {pestana === 'reportes' && (
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 15 }}>Reportes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>Tipo de reporte</label>
                <select value={tipoReporte} onChange={e => { setTipoReporte(e.target.value); setTargetId('') }} style={inpStyle}>
                  <option value="todos">Todos los empleados</option>
                  <option value="lider">Por líder</option>
                  <option value="empleado">Un empleado</option>
                </select>
              </div>
              {tipoReporte === 'lider' && (
                <div>
                  <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>Líder</label>
                  <select value={targetId} onChange={e => setTargetId(e.target.value)} style={inpStyle}>
                    <option value="">— Seleccionar —</option>
                    {lideres.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
              )}
              {tipoReporte === 'empleado' && (
                <div>
                  <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>Empleado</label>
                  <select value={targetId} onChange={e => setTargetId(e.target.value)} style={inpStyle}>
                    <option value="">— Seleccionar —</option>
                    {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={inpStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={inpStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button onClick={verReporte} style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>Ver reporte</button>
              <button onClick={descargarCSV} style={{ background: '#38d9a9', color: '#0a1a14', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>↓ Descargar CSV</button>
            </div>
            {reporteData.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <p style={{ fontSize: 12, color: '#6b7a9e', marginBottom: 10 }}>{reporteData.length} registros</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Empleado','Departamento','Fecha','Entrada','Salida'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #232b42', color: '#6b7a9e', fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {reporteData.slice(0, 50).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #ffffff08' }}>
                        <td style={{ padding: '8px 10px' }}>{r.nombre}</td>
                        <td style={{ padding: '8px 10px', color: '#6b7a9e' }}>{r.departamento}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#6b7a9e' }}>{r.fecha?.slice(0,10)}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#38d9a9' }}>{r.entrada?.slice(0,5) || '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#f75f5f' }}>{r.salida?.slice(0,5) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal editar horario */}
      {usuarioHorario && horarioEditar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setUsuarioHorario(null)}>
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 14, padding: 28, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px' }}>Horario de {usuarioHorario.nombre}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].map(dia => {
                const d = horarioEditar[dia] || { activo: false, entrada: '', salida: '', comida: '', duracionComida: 60 }
                return (
                  <div key={dia} style={{ background: '#1a2035', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: d.activo ? 10 : 0 }}>
                      <input type="checkbox" checked={d.activo}
                        onChange={e => setHorarioEditar(prev => ({ ...prev, [dia]: { ...d, activo: e.target.checked } }))}
                        style={{ width: 16, height: 16, accentColor: '#4f8ef7', cursor: 'pointer' }} />
                      <span style={{ fontWeight: 700, fontSize: 13, minWidth: 90 }}>{DIAS_LABEL[dia]}</span>
                      {!d.activo && <span style={{ fontSize: 12, color: '#6b7a9e' }}>No laborable</span>}
                    </div>
                    {d.activo && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {[{label:'Entrada',k:'entrada'},{label:'Salida',k:'salida'},{label:'Comida',k:'comida'}].map(({ label, k }) => (
                          <div key={k}>
                            <p style={{ fontSize: 10, color: '#6b7a9e', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
                            <input type="time" value={d[k] || ''}
                              onChange={e => setHorarioEditar(prev => ({ ...prev, [dia]: { ...d, [k]: e.target.value } }))}
                              style={{ width: '100%', background: '#0a0d14', border: '1px solid #232b42', borderRadius: 6, padding: '6px 8px', color: '#e8edf8', fontSize: 12, fontFamily: 'monospace', outline: 'none' }} />
                          </div>
                        ))}
                        <div>
                          <p style={{ fontSize: 10, color: '#6b7a9e', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>Min comida</p>
                          <input type="number" value={d.duracionComida || 0} min={0} max={120}
                            onChange={e => setHorarioEditar(prev => ({ ...prev, [dia]: { ...d, duracionComida: Number(e.target.value) } }))}
                            style={{ width: '100%', background: '#0a0d14', border: '1px solid #232b42', borderRadius: 6, padding: '6px 8px', color: '#e8edf8', fontSize: 12, fontFamily: 'monospace', outline: 'none' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setUsuarioHorario(null)} style={{ background: 'transparent', border: '1px solid #232b42', color: '#6b7a9e', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={guardarHorario} style={{ background: '#38d9a9', color: '#0a1a14', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar usuario */}
      {mostrarFormUsuario && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setMostrarFormUsuario(false)}>
          <div style={{ background: '#141928', border: '1px solid #232b42', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480 }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px' }}>{usuarioEditar ? `Editar — ${usuarioEditar.nombre}` : 'Crear nuevo usuario'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Nombre completo', key: 'nombre', type: 'text', placeholder: 'Nombre Apellido' },
                { label: 'Correo electrónico', key: 'email', type: 'email', placeholder: 'correo@empresa.com' },
                { label: usuarioEditar ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Departamento', key: 'departamento', type: 'text', placeholder: 'Desarrollo, Marketing...' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
                  <input type={type} value={formUsuario[key]} onChange={e => setFormUsuario(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inpStyle} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>Rol</label>
                <select value={formUsuario.rol} onChange={e => setFormUsuario(p => ({ ...p, rol: e.target.value }))} style={inpStyle}>
                  <option value="empleado">Empleado</option>
                  <option value="lider">Líder</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {formUsuario.rol === 'empleado' && (
                <div>
                  <label style={{ fontSize: 11, color: '#6b7a9e', fontWeight: 600, display: 'block', marginBottom: 6 }}>Líder asignado</label>
                  <select value={formUsuario.lider_id} onChange={e => setFormUsuario(p => ({ ...p, lider_id: e.target.value }))} style={inpStyle}>
                    <option value="">— Sin líder —</option>
                    {lideres.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4, justifyContent: 'flex-end' }}>
                <button onClick={() => setMostrarFormUsuario(false)} style={{ background: 'transparent', border: '1px solid #232b42', color: '#6b7a9e', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={guardarUsuario} style={{ background: '#38d9a9', color: '#0a1a14', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>{usuarioEditar ? 'Guardar cambios' : 'Crear usuario'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── COMPONENTE RAIZ ────────────────────────────────────────────
export default function App() {
  const [usuario, setUsuario]     = useState(null)
  const [verificando, setVerificando] = useState(true)

  // Al cargar la pagina verificamos si ya hay sesion
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(datos => {
        if (datos.usuario) setUsuario(datos.usuario)
      })
      .catch(() => {})
      .finally(() => setVerificando(false))
  }, [])

  if (verificando) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7a9e', fontFamily: 'monospace' }}>
        Cargando...
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>TimeTrack Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {!usuario ? (
        <PantallaLogin onLogin={setUsuario} />
      ) : usuario.rol === 'admin' ? (
        <DashboardAdmin usuario={usuario} onLogout={() => setUsuario(null)} />
      ) : (
        <DashboardEmpleado usuario={usuario} onLogout={() => setUsuario(null)} />
      )}
    </>
  )
}
