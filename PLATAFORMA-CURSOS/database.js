const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const db = new sqlite3.Database(path.join(__dirname, 'cursos.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      marca TEXT NOT NULL,
      rol TEXT DEFAULT 'usuario'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      orden INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      curso_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      video_url TEXT,
      FOREIGN KEY(curso_id) REFERENCES cursos(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recursos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clase_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      url TEXT NOT NULL,
      FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS calificaciones (
      usuario_id INTEGER,
      clase_id INTEGER,
      puntuacion INTEGER,
      comentario TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (usuario_id, clase_id),
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY(clase_id) REFERENCES clases(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS accesos_cursos (
      usuario_id INTEGER,
      curso_id INTEGER,
      bloqueado INTEGER DEFAULT 0,
      PRIMARY KEY (usuario_id, curso_id),
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY(curso_id) REFERENCES cursos(id) ON DELETE CASCADE
    )
  `);

  // Insertar cursos
  db.run(`INSERT OR IGNORE INTO cursos (id, nombre, descripcion, orden) VALUES 
    (1, 'Curso 1 - Fundamentos', 'Aprende las bases desde cero', 1)`);
  db.run(`INSERT OR IGNORE INTO cursos (id, nombre, descripcion, orden) VALUES 
    (2, 'Curso 2 - Avanzado', 'Domina técnicas profesionales', 2)`);

  // Insertar clases
  db.run(`INSERT OR IGNORE INTO clases (id, curso_id, titulo, video_url) VALUES 
    (1, 1, 'Clase 1 - Introducción', ''),
    (2, 1, 'Clase 2 - Conceptos básicos', ''),
    (3, 1, 'Clase 3 - Práctica inicial', ''),
    (4, 2, 'Clase 1 - Temas avanzados', ''),
    (5, 2, 'Clase 2 - Proyecto final', ''),
    (6, 2, 'Clase 3 - Certificación', '')`);

  // Insertar usuarios
  const hash1 = bcrypt.hashSync('erik123', 10);
  const hash2 = bcrypt.hashSync('jess123', 10);
  const hashAdmin = bcrypt.hashSync('Affinity2026!', 10);

  db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, email, password, marca, rol) VALUES 
    (1, 'SUYO', 'suyo@cursos.com', ?, 'SUYO Studio', 'usuario')`, [hash1]);
  db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, email, password, marca, rol) VALUES 
    (2, 'AM BESTEN', 'ambesten@cursos.com', ?, 'AM BESTEN', 'usuario')`, [hash2]);
  db.run(`INSERT OR IGNORE INTO usuarios (id, nombre, email, password, marca, rol) VALUES 
    (3, 'admin', 'admin@cursos.com', ?, 'Administrador', 'admin')`, [hashAdmin]);

  // Accesos
  db.run(`INSERT OR IGNORE INTO accesos_cursos (usuario_id, curso_id, bloqueado) VALUES 
    (1, 1, 0), (1, 2, 0), (2, 1, 0), (2, 2, 0), (3, 1, 0), (3, 2, 0)`);
});

module.exports = db;