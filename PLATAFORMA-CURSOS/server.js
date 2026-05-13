const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: 'clave_super_segura_cursos_v2',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 3600000 }
}));

// Crear directorios si no existen
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('uploads/videos')) fs.mkdirSync('uploads/videos');
if (!fs.existsSync('uploads/pdf')) fs.mkdirSync('uploads/pdf');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') cb(null, 'uploads/videos');
    else cb(null, 'uploads/pdf');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ========== AUTENTICACIÓN ==========
app.post('/api/login', (req, res) => {
  const { nombre, password } = req.body;
  console.log(`Intento de login con nombre: ${nombre}`);
  
  db.get(`SELECT * FROM usuarios WHERE nombre = ?`, [nombre], async (err, user) => {
    if (err || !user) {
      console.log('Usuario no encontrado:', nombre);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('Contraseña incorrecta para:', nombre);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    req.session.userId = user.id;
    req.session.rol = user.rol;
    req.session.nombre = user.nombre;
    console.log(`Login exitoso: ${user.nombre} (${user.rol})`);
    res.json({ success: true, rol: user.rol });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  db.get(`SELECT id, nombre, email, marca, rol FROM usuarios WHERE id = ?`, [req.session.userId], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json(user);
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ========== ADMIN: GESTIÓN DE USUARIOS ==========
// Obtener todos los usuarios
app.get('/api/admin/usuarios', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  db.all(`SELECT id, nombre, email, marca, rol FROM usuarios ORDER BY id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Crear nuevo usuario (solo admin - SOLO usuarios normales)
app.post('/api/admin/usuarios', async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  
  const { nombrePersona, nombreEmpresa, password } = req.body;
  
  if (!nombrePersona || !nombreEmpresa || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  
  // Verificar si el nombre de empresa ya existe
  db.get(`SELECT id FROM usuarios WHERE nombre = ?`, [nombreEmpresa], async (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) return res.status(400).json({ error: 'El nombre de empresa ya está registrado' });
    
    // Crear email automático
    const email = nombreEmpresa.toLowerCase().replace(/\s/g, '') + '@empresa.com';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(`INSERT INTO usuarios (nombre, email, password, marca, rol) VALUES (?, ?, ?, ?, ?)`,
      [nombreEmpresa, email, hashedPassword, nombrePersona, 'usuario'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Crear accesos para todos los cursos existentes
        db.all(`SELECT id FROM cursos`, [], (err, cursos) => {
          if (!err && cursos) {
            cursos.forEach(curso => {
              db.run(`INSERT OR IGNORE INTO accesos_cursos (usuario_id, curso_id, bloqueado) VALUES (?, ?, 0)`,
                [this.lastID, curso.id]);
            });
          }
        });
        
        res.json({ success: true, id: this.lastID, message: 'Usuario creado exitosamente' });
      });
  });
});

// Eliminar usuario (solo admin)
app.delete('/api/admin/usuarios/:id', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  
  const userId = parseInt(req.params.id);
  
  // No permitir eliminar al propio admin
  if (userId === req.session.userId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  
  db.run(`DELETE FROM usuarios WHERE id = ?`, [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  });
});

// Restablecer contraseña de usuario
app.post('/api/admin/usuarios/:id/reset-password', async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'Nueva contraseña requerida' });
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  db.run(`UPDATE usuarios SET password = ? WHERE id = ?`, [hashedPassword, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Contraseña restablecida' });
  });
});

// ========== CURSOS PARA USUARIO ==========
app.get('/api/cursos', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  const query = `
    SELECT c.*, COALESCE(a.bloqueado, 0) as bloqueado
    FROM cursos c
    LEFT JOIN accesos_cursos a ON a.curso_id = c.id AND a.usuario_id = ?
    ORDER BY c.orden
  `;
  db.all(query, [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ========== CLASES ==========
app.get('/api/clases/:curso_id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  
  const cursoId = req.params.curso_id;
  console.log('Solicitando clases para el curso ID:', cursoId);
  
  db.get(`SELECT bloqueado FROM accesos_cursos WHERE usuario_id = ? AND curso_id = ?`,
    [req.session.userId, cursoId], (err, acceso) => {
      if (err) return res.status(500).json({ error: err.message });
      if (acceso && acceso.bloqueado === 1) {
        return res.status(403).json({ error: 'Curso bloqueado', bloqueado: true });
      }
      
      db.all(`SELECT * FROM clases WHERE curso_id = ? ORDER BY id`, [cursoId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`Clases encontradas para curso ${cursoId}:`, rows.length);
        res.json(rows);
      });
    });
});

// ========== RECURSOS ==========
app.get('/api/recursos/:clase_id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  
  db.all(`SELECT * FROM recursos WHERE clase_id = ? ORDER BY id`, [req.params.clase_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// ========== ADMIN: CRUD CURSOS ==========
app.get('/api/admin/cursos', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  db.all(`SELECT * FROM cursos ORDER BY orden`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/cursos', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { nombre, descripcion, orden } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  db.run(`INSERT INTO cursos (nombre, descripcion, orden) VALUES (?, ?, ?)`,
    [nombre, descripcion || '', orden || 999], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run(`INSERT OR IGNORE INTO accesos_cursos (usuario_id, curso_id, bloqueado)
              SELECT id, ?, 0 FROM usuarios WHERE rol = 'usuario'`, [this.lastID]);
      res.json({ id: this.lastID, success: true });
    });
});

app.put('/api/admin/cursos/:id', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { nombre, descripcion, orden } = req.body;
  db.run(`UPDATE cursos SET nombre = ?, descripcion = ?, orden = ? WHERE id = ?`,
    [nombre, descripcion || '', orden || 0, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/admin/cursos/:id', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  db.get(`SELECT COUNT(*) as count FROM clases WHERE curso_id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un curso que tiene clases' });
    }
    db.run(`DELETE FROM cursos WHERE id = ?`, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.run(`DELETE FROM accesos_cursos WHERE curso_id = ?`, [req.params.id]);
      res.json({ success: true });
    });
  });
});

// ========== ADMIN: CLASES ==========
app.post('/api/admin/clases', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { curso_id, titulo } = req.body;
  db.run(`INSERT INTO clases (curso_id, titulo, video_url) VALUES (?, ?, '')`, [curso_id, titulo], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/api/admin/clases/:id', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { titulo } = req.body;
  db.run(`UPDATE clases SET titulo = ? WHERE id = ?`, [titulo, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/admin/clases/:id', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  db.run(`DELETE FROM clases WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/admin/clases/:id/video', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const uploadVideo = upload.single('video');
  uploadVideo(req, res, (err) => {
    if (err) return res.status(500).json({ error: 'Error al subir video' });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const videoPath = '/uploads/videos/' + req.file.filename;
    db.run(`UPDATE clases SET video_url = ? WHERE id = ?`, [videoPath, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ video_url: videoPath });
    });
  });
});

// ========== RECURSOS ADMIN (PDF) ==========
app.post('/api/admin/recursos', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  
  const uploadPDF = upload.single('pdf');
  uploadPDF(req, res, (err) => {
    if (err) {
      console.error('Error al subir PDF:', err);
      return res.status(500).json({ error: 'Error al subir PDF: ' + err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo PDF' });
    }
    
    const { clase_id, tipo, nombre } = req.body;
    
    if (!clase_id || !tipo || !nombre) {
      return res.status(400).json({ error: 'Faltan datos: clase_id, tipo o nombre' });
    }
    
    const pdfPath = '/uploads/pdf/' + req.file.filename;
    
    db.run(`INSERT INTO recursos (clase_id, tipo, nombre, url) VALUES (?, ?, ?, ?)`,
      [clase_id, tipo, nombre, pdfPath], function(err) {
        if (err) {
          console.error('Error al guardar en BD:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID, url: pdfPath });
      });
  });
});

app.delete('/api/admin/recursos/:id', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  
  db.get(`SELECT url FROM recursos WHERE id = ?`, [req.params.id], (err, recurso) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.run(`DELETE FROM recursos WHERE id = ?`, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (recurso && recurso.url) {
        const filePath = path.join(__dirname, recurso.url);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error al eliminar archivo:', err);
        });
      }
      
      res.json({ success: true });
    });
  });
});

// ========== CALIFICACIONES ==========
app.post('/api/calificar', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  const { clase_id, puntuacion, comentario } = req.body;
  db.run(`INSERT OR REPLACE INTO calificaciones (usuario_id, clase_id, puntuacion, comentario, fecha) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [req.session.userId, clase_id, puntuacion, comentario || ''], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.get('/api/calificaciones/:clase_id', (req, res) => {
  db.all(`
    SELECT u.nombre, c.puntuacion, c.comentario, c.fecha 
    FROM calificaciones c
    JOIN usuarios u ON u.id = c.usuario_id
    WHERE c.clase_id = ?
    ORDER BY c.fecha DESC
  `, [req.params.clase_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/mi-calificacion/:clase_id', (req, res) => {
  if (!req.session.userId) return res.json({ puntuacion: 0, comentario: '' });
  db.get(`SELECT puntuacion, comentario FROM calificaciones WHERE usuario_id = ? AND clase_id = ?`,
    [req.session.userId, req.params.clase_id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || { puntuacion: 0, comentario: '' });
    });
});

// ========== ADMIN: VER TODAS CALIFICACIONES ==========
app.get('/api/admin/todas-calificaciones', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  db.all(`
    SELECT u.nombre as usuario, u.marca, c.titulo as clase, 
           cal.puntuacion, cal.comentario, cal.fecha
    FROM calificaciones cal
    JOIN usuarios u ON u.id = cal.usuario_id
    JOIN clases c ON c.id = cal.clase_id
    ORDER BY cal.fecha DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ========== ADMIN: USUARIOS Y ACCESOS ==========
app.get('/api/admin/usuarios-accesos', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  
  db.all(`SELECT id, nombre, email, marca FROM usuarios WHERE rol = 'usuario'`, [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(`SELECT * FROM accesos_cursos`, [], (err, accesos) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const result = users.map(user => {
        const userAccesos = accesos.filter(a => a.usuario_id === user.id);
        return { ...user, accesos: userAccesos };
      });
      
      res.json(result);
    });
  });
});

app.post('/api/admin/bloquear-curso', (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  const { usuario_id, curso_id, bloqueado } = req.body;
  
  db.run(`INSERT OR REPLACE INTO accesos_cursos (usuario_id, curso_id, bloqueado) VALUES (?, ?, ?)`,
    [usuario_id, curso_id, bloqueado ? 1 : 0], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});