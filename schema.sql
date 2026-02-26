-- Schema de la base de datos - TimeTrack
-- Ejecutar en PostgreSQL antes de iniciar la app

-- Tabla de usuarios
CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  rol         VARCHAR(20) DEFAULT 'empleado',  -- admin, lider, empleado
  departamento VARCHAR(100),
  lider_id    INTEGER REFERENCES usuarios(id),
  activo      BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla de horarios (un registro por dia por usuario)
CREATE TABLE horarios (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER REFERENCES usuarios(id),
  dia_semana      VARCHAR(15) NOT NULL,  -- lunes, martes, etc.
  activo          BOOLEAN DEFAULT TRUE,
  hora_entrada    TIME,
  hora_salida     TIME,
  hora_comida     TIME,
  duracion_comida INTEGER DEFAULT 60
);

-- Tabla de registros de tiempo (checadas)
CREATE TABLE registros (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER REFERENCES usuarios(id),
  fecha           DATE NOT NULL,
  entrada         TIME,
  salida          TIME,
  inicio_comida   TIME,
  fin_comida      TIME,
  inicio_personal TIME,
  fin_personal    TIME,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Tabla de incidencias
CREATE TABLE incidencias (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id),
  fecha       DATE NOT NULL,
  descripcion TEXT NOT NULL,
  hora        TIME NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabla de dias festivos
CREATE TABLE dias_festivos (
  id          SERIAL PRIMARY KEY,
  fecha       DATE UNIQUE NOT NULL,
  descripcion VARCHAR(150)
);

-- Tabla de vacaciones
CREATE TABLE vacaciones (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id),
  fecha       DATE NOT NULL,
  nota        VARCHAR(200)
);
