let clases = [];
let cursos = [];
let claseEditando = null;

// ========== USUARIOS ==========
async function cargarUsuarios() {
  const res = await fetch('/api/admin/usuarios');
  const usuarios = await res.json();
  const container = document.getElementById('listaUsuarios');
  if (!container) return;
  container.innerHTML = '';
  
  if (usuarios.length === 0) {
    container.innerHTML = '<p>No hay usuarios registrados</p>';
    return;
  }
  
  usuarios.forEach(user => {
    const div = document.createElement('div');
    div.className = 'curso-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'flex-start';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <div>
          <strong><i class="fas fa-building"></i> ${user.nombre}</strong>
          <br><small>👤 ${user.marca}</small>
          <br><small><i class="fas fa-tag"></i> Rol: ${user.rol === 'admin' ? '👑 Administrador' : '👨‍🎓 Usuario'}</small>
        </div>
        <div>
          ${user.rol !== 'admin' ? `<button class="resetPassBtn" data-id="${user.id}" data-nombre="${user.nombre}"><i class="fas fa-key"></i> Reset Pass</button>` : ''}
          <button class="eliminarUsuarioBtn" data-id="${user.id}" data-nombre="${user.nombre}" ${user.rol === 'admin' ? 'disabled style="opacity:0.5;"' : ''}><i class="fas fa-trash"></i> Eliminar</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
  
  document.querySelectorAll('.resetPassBtn').forEach(btn => {
    btn.onclick = async () => {
      const nuevaPass = prompt(`Nueva contraseña para ${btn.dataset.nombre}:`);
      if (nuevaPass && nuevaPass.length >= 4) {
        const res = await fetch(`/api/admin/usuarios/${btn.dataset.id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: nuevaPass })
        });
        if (res.ok) {
          alert(`✅ Contraseña restablecida para ${btn.dataset.nombre}`);
        } else {
          alert('❌ Error al restablecer contraseña');
        }
      } else if (nuevaPass) {
        alert('La contraseña debe tener al menos 4 caracteres');
      }
    };
  });
  
  document.querySelectorAll('.eliminarUsuarioBtn').forEach(btn => {
    btn.onclick = async () => {
      if (confirm(`¿Eliminar al usuario "${btn.dataset.nombre}"? Esta acción no se puede deshacer.`)) {
        const res = await fetch(`/api/admin/usuarios/${btn.dataset.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          alert('✅ Usuario eliminado');
          cargarUsuarios();
          cargarUsuariosAccesos();
        } else {
          alert('❌ ' + (data.error || 'Error al eliminar usuario'));
        }
      }
    };
  });
}

// Abrir modal para crear usuario
document.getElementById('agregarUsuarioBtn')?.addEventListener('click', () => {
  document.getElementById('userNombrePersona').value = '';
  document.getElementById('userNombreEmpresa').value = '';
  document.getElementById('userPassword').value = '';
  document.getElementById('modalUsuario').style.display = 'flex';
});

// Guardar usuario (crear) - SOLO usuarios normales
document.getElementById('guardarUsuarioBtn')?.addEventListener('click', async () => {
  const nombrePersona = document.getElementById('userNombrePersona').value;
  const nombreEmpresa = document.getElementById('userNombreEmpresa').value;
  const password = document.getElementById('userPassword').value;
  
  if (!nombrePersona || !nombreEmpresa || !password) {
    alert('❌ Todos los campos son requeridos');
    return;
  }
  
  if (password.length < 4) {
    alert('❌ La contraseña debe tener al menos 4 caracteres');
    return;
  }
  
  const res = await fetch('/api/admin/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombrePersona, nombreEmpresa, password })
  });
  
  const data = await res.json();
  if (res.ok) {
    alert('✅ Usuario creado exitosamente');
    document.getElementById('modalUsuario').style.display = 'none';
    cargarUsuarios();
    cargarUsuariosAccesos();
  } else {
    alert('❌ ' + (data.error || 'Error al crear usuario'));
  }
});

// ========== CURSOS (ya existente) ==========
async function cargarCursosAdmin() {
  const res = await fetch('/api/admin/cursos');
  cursos = await res.json();
  const container = document.getElementById('listaCursosAdmin');
  if (!container) return;
  container.innerHTML = '';
  cursos.forEach(curso => {
    const div = document.createElement('div');
    div.className = 'curso-item';
    div.innerHTML = `
      <div>
        <strong>📘 ${curso.nombre}</strong>
        ${curso.descripcion ? `<br><small>${curso.descripcion}</small>` : ''}
      </div>
      <div>
        <button class="editarCurso" data-id="${curso.id}" data-nombre="${curso.nombre}" data-desc="${curso.descripcion || ''}" data-orden="${curso.orden}">✏️ Editar</button>
        <button class="eliminarCurso" data-id="${curso.id}">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
  
  document.querySelectorAll('.editarCurso').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const nuevoNombre = prompt('Nuevo nombre del curso:', btn.dataset.nombre);
      if (nuevoNombre) {
        await fetch(`/api/admin/cursos/${btn.dataset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoNombre, descripcion: btn.dataset.desc, orden: btn.dataset.orden })
        });
        cargarCursosAdmin();
        cargarSelectorCursos();
      }
    };
  });
  
  document.querySelectorAll('.eliminarCurso').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('¿Eliminar este curso? (Solo si no tiene clases)')) {
        const res = await fetch(`/api/admin/cursos/${btn.dataset.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.error) alert(data.error);
        else {
          cargarCursosAdmin();
          cargarSelectorCursos();
        }
      }
    };
  });
}

async function cargarSelectorCursos() {
  const res = await fetch('/api/admin/cursos');
  const cursosList = await res.json();
  const selector = document.getElementById('cursoSelectorClases');
  if (!selector) return;
  selector.innerHTML = '<option value="">Seleccionar curso</option>';
  cursosList.forEach(curso => {
    const option = document.createElement('option');
    option.value = curso.id;
    option.innerText = curso.nombre;
    selector.appendChild(option);
  });
}

async function cargarClasesPorCurso(cursoId) {
  if (!cursoId) return;
  const res = await fetch(`/api/clases/${cursoId}`);
  clases = await res.json();
  const container = document.getElementById('listaClasesAdmin');
  if (!container) return;
  container.innerHTML = '';
  if (clases.length === 0) {
    container.innerHTML = '<p>No hay clases en este curso. Haz clic en "+ Agregar Clase" para comenzar.</p>';
    return;
  }
  clases.forEach(cls => {
    const div = document.createElement('div');
    div.className = 'clase-item';
    div.innerHTML = `<strong>${cls.titulo}</strong> <span style="color:#8a82f2;">✏️ Editar</span>`;
    div.onclick = () => abrirModal(cls);
    container.appendChild(div);
  });
}

async function abrirModal(clase) {
  claseEditando = clase;
  document.getElementById('modalTitle').innerText = `Editando: ${clase.titulo}`;
  document.getElementById('editTitulo').value = clase.titulo;
  const videoPreview = document.getElementById('videoPreview');
  if (videoPreview) videoPreview.src = clase.video_url || '';
  
  document.getElementById('nombreRecurso').value = '';
  document.getElementById('uploadPDF').value = '';
  document.getElementById('tipoRecurso').value = 'material';
  
  await cargarRecursosActuales();
  
  document.getElementById('modalClase').style.display = 'flex';
}

async function cargarRecursosActuales() {
  if (!claseEditando) return;
  
  const res = await fetch(`/api/recursos/${claseEditando.id}`);
  const recursos = await res.json();
  const container = document.getElementById('recursosActuales');
  if (!container) return;
  container.innerHTML = '';
  
  if (recursos.length === 0) {
    container.innerHTML = '<p style="color: #999;">No hay recursos disponibles. Sube un PDF para esta clase.</p>';
    return;
  }
  
  recursos.forEach(rec => {
    const div = document.createElement('div');
    div.className = 'recurso-item';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.padding = '10px';
    div.style.margin = '8px 0';
    div.style.background = '#f8f9ff';
    div.style.borderRadius = '12px';
    div.style.border = '1px solid #eef0f5';
    
    let icono = '📎';
    if (rec.tipo === 'diapositiva') icono = '📊';
    if (rec.tipo === 'temario') icono = '📋';
    
    div.innerHTML = `
      <div>
        <strong>${icono}</strong> ${rec.nombre}
        <small style="color: #8a82f2;">(${rec.tipo})</small>
      </div>
      <div>
        <a href="${rec.url}" target="_blank" style="margin-right: 10px; color: #8a82f2;">👁️ Ver</a>
        <a href="${rec.url}" download style="margin-right: 10px; color: #28a745;">⬇️ Descargar</a>
        <button class="borrarRecurso" data-id="${rec.id}" style="background: #ff7400; padding: 5px 10px; font-size: 12px;">❌ Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
  
  document.querySelectorAll('.borrarRecurso').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm('¿Eliminar este recurso permanentemente?')) {
        const res = await fetch(`/api/admin/recursos/${btn.dataset.id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Recurso eliminado');
          await cargarRecursosActuales();
        } else {
          alert('Error al eliminar recurso');
        }
      }
    };
  });
}

document.getElementById('editTitulo')?.addEventListener('change', async () => {
  const nuevoTitulo = document.getElementById('editTitulo').value;
  if (nuevoTitulo && claseEditando) {
    await fetch(`/api/admin/clases/${claseEditando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: nuevoTitulo })
    });
    alert('Título actualizado');
    claseEditando.titulo = nuevoTitulo;
    const cursoId = document.getElementById('cursoSelectorClases').value;
    if (cursoId) cargarClasesPorCurso(cursoId);
  }
});

document.getElementById('subirVideoBtn')?.addEventListener('click', async () => {
  const file = document.getElementById('uploadVideo').files[0];
  if (!file) return alert('Selecciona un video');
  const formData = new FormData();
  formData.append('video', file);
  const res = await fetch(`/api/admin/clases/${claseEditando.id}/video`, { method: 'POST', body: formData });
  if (res.ok) {
    const data = await res.json();
    alert('Video actualizado');
    document.getElementById('videoPreview').src = data.video_url;
    document.getElementById('uploadVideo').value = '';
  } else {
    alert('Error al subir el video');
  }
});

document.getElementById('subirRecursoBtn')?.addEventListener('click', async () => {
  const tipo = document.getElementById('tipoRecurso').value;
  const nombre = document.getElementById('nombreRecurso').value;
  const file = document.getElementById('uploadPDF').files[0];
  
  if (!nombre) {
    alert('Por favor ingresa un nombre para el archivo');
    return;
  }
  if (!file) {
    alert('Por favor selecciona un archivo PDF');
    return;
  }
  if (file.type !== 'application/pdf') {
    alert('Solo se permiten archivos PDF');
    return;
  }
  
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('clase_id', claseEditando.id);
  formData.append('tipo', tipo);
  formData.append('nombre', nombre);
  
  try {
    const res = await fetch('/api/admin/recursos', { method: 'POST', body: formData });
    const data = await res.json();
    
    if (res.ok) {
      alert('✅ PDF subido exitosamente');
      document.getElementById('nombreRecurso').value = '';
      document.getElementById('uploadPDF').value = '';
      await cargarRecursosActuales();
    } else {
      alert('Error: ' + (data.error || 'No se pudo subir el PDF'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al subir el PDF');
  }
});

document.getElementById('deleteClaseBtn')?.addEventListener('click', async () => {
  if (confirm('¿Eliminar esta clase? Se eliminarán también sus recursos y calificaciones.')) {
    const res = await fetch(`/api/admin/clases/${claseEditando.id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Clase eliminada');
      document.getElementById('modalClase').style.display = 'none';
      const cursoId = document.getElementById('cursoSelectorClases').value;
      if (cursoId) cargarClasesPorCurso(cursoId);
    } else {
      alert('Error al eliminar la clase');
    }
  }
});

document.getElementById('agregarCursoBtn')?.addEventListener('click', async () => {
  const nombre = prompt('Nombre del nuevo curso:');
  if (nombre) {
    const descripcion = prompt('Descripción del curso:');
    const res = await fetch('/api/admin/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion: descripcion || '', orden: 999 })
    });
    if (res.ok) {
      alert('Curso creado');
      cargarCursosAdmin();
      cargarSelectorCursos();
      cargarUsuariosAccesos();
    } else {
      alert('Error al crear el curso');
    }
  }
});

document.getElementById('agregarClaseBtn')?.addEventListener('click', async () => {
  const cursoId = document.getElementById('cursoSelectorClases').value;
  if (!cursoId) return alert('Selecciona un curso primero');
  const titulo = prompt('Nombre de la nueva clase:');
  if (titulo) {
    const res = await fetch('/api/admin/clases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curso_id: parseInt(cursoId), titulo })
    });
    if (res.ok) {
      alert('Clase creada');
      cargarClasesPorCurso(cursoId);
    } else {
      alert('Error al crear la clase');
    }
  }
});

document.getElementById('cursoSelectorClases')?.addEventListener('change', (e) => {
  if (e.target.value) cargarClasesPorCurso(e.target.value);
});

// ========== GESTIÓN DE ACCESOS ==========
async function cargarUsuariosAccesos() {
  console.log('Cargando usuarios y accesos...');
  const res = await fetch('/api/admin/usuarios-accesos');
  const usuarios = await res.json();
  const container = document.getElementById('listaUsuariosAccesos');
  if (!container) {
    console.error('No se encontró el contenedor listaUsuariosAccesos');
    return;
  }
  container.innerHTML = '';
  
  if (usuarios.length === 0) {
    container.innerHTML = '<p>No hay usuarios registrados</p>';
    return;
  }
  
  const cursosRes = await fetch('/api/admin/cursos');
  const todosCursos = await cursosRes.json();
  
  for (const user of usuarios) {
    const card = document.createElement('div');
    card.className = 'usuario-acceso-card';
    card.style.marginBottom = '20px';
    card.style.padding = '15px';
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '12px';
    card.innerHTML = `<h4>👤 ${user.nombre}</h4><p>🏷️ Marca: ${user.marca}</p><hr>`;
    
    for (const curso of todosCursos) {
      const acceso = user.accesos ? user.accesos.find(a => a.curso_id === curso.id) : null;
      const bloqueado = acceso ? acceso.bloqueado : 0;
      
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '10px';
      label.style.margin = '10px 0';
      label.innerHTML = `
        <strong>📚 ${curso.nombre}</strong>
        <input type="checkbox" class="toggle-bloqueo" data-user="${user.id}" data-curso="${curso.id}" ${bloqueado === 1 ? 'checked' : ''}>
        <span>${bloqueado === 1 ? '🔒 Bloqueado' : '✅ Desbloqueado'}</span>
      `;
      card.appendChild(label);
    }
    container.appendChild(card);
  }
  
  document.querySelectorAll('.toggle-bloqueo').forEach(cb => {
    cb.onchange = async () => {
      const usuario_id = parseInt(cb.dataset.user);
      const curso_id = parseInt(cb.dataset.curso);
      const bloqueado = cb.checked;
      
      const res = await fetch('/api/admin/bloquear-curso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id, curso_id, bloqueado })
      });
      
      if (res.ok) {
        const span = cb.nextElementSibling;
        if (span) {
          span.innerText = bloqueado ? '🔒 Bloqueado' : '✅ Desbloqueado';
        }
        alert(`Curso ${bloqueado ? 'bloqueado' : 'desbloqueado'} correctamente`);
      } else {
        alert('Error al cambiar el estado');
        cb.checked = !bloqueado;
      }
    };
  });
}

// ========== VER CALIFICACIONES ==========
async function cargarCalificaciones() {
  const res = await fetch('/api/admin/todas-calificaciones');
  const califs = await res.json();
  const container = document.getElementById('listaCalificacionesAdmin');
  if (!container) return;
  container.innerHTML = '';
  
  if (califs.length === 0) {
    container.innerHTML = '<p>No hay calificaciones aún. Los usuarios comenzarán a calificar las clases.</p>';
    return;
  }
  
  califs.forEach(c => {
    const div = document.createElement('div');
    div.className = 'calificacion-item';
    div.style.marginBottom = '15px';
    div.style.padding = '15px';
    div.style.border = '1px solid #ddd';
    div.style.borderRadius = '12px';
    div.innerHTML = `
      <strong>${c.usuario}</strong> (${c.marca})<br>
      Clase: ${c.clase}<br>
      ⭐ ${c.puntuacion}/5<br>
      💬 ${c.comentario || 'Sin comentario'}<br>
      <small>${new Date(c.fecha).toLocaleString()}</small>
      <hr>
    `;
    container.appendChild(div);
  });
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const tabId = `tab-${btn.dataset.tab}`;
    document.getElementById(tabId).classList.add('active');
    
    if (btn.dataset.tab === 'usuarios') cargarUsuarios();
    if (btn.dataset.tab === 'accesos') cargarUsuariosAccesos();
    if (btn.dataset.tab === 'calificaciones') cargarCalificaciones();
    if (btn.dataset.tab === 'cursos') {
      cargarCursosAdmin();
      cargarSelectorCursos();
    }
  };
});

document.querySelectorAll('.close').forEach(closeBtn => {
  closeBtn.onclick = () => {
    document.getElementById('modalClase').style.display = 'none';
    document.getElementById('modalUsuario').style.display = 'none';
  };
});

document.getElementById('adminLogout')?.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

cargarUsuarios();
cargarCursosAdmin();
cargarSelectorCursos();