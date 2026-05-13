let cursos = [];
let clases = [];
let cursoSeleccionado = null;
let claseSeleccionada = null;

async function cargarDatos() {
  console.log('=== CARGANDO DATOS ===');
  
  const meRes = await fetch('/api/me');
  const user = await meRes.json();
  // user.nombre = nombre de la empresa (para login)
  // user.marca = nombre de la persona
  document.getElementById('userName').innerText = user.marca; // Nombre de la persona
  document.getElementById('userMarca').innerText = user.nombre; // Nombre de la empresa

  const cursosRes = await fetch('/api/cursos');
  cursos = await cursosRes.json();
  console.log('Cursos recibidos del servidor:', cursos);
  
  renderCursos();
}

function renderCursos() {
  const container = document.getElementById('cursosSelector');
  container.innerHTML = '<h3>📖 Mis Cursos</h3><div class="botones-cursos" id="botonesCursos"></div>';
  
  const botonesContainer = document.getElementById('botonesCursos');
  
  cursos.forEach((curso, index) => {
    const btn = document.createElement('button');
    btn.textContent = curso.nombre;
    btn.setAttribute('data-id', curso.id);
    btn.setAttribute('data-nombre', curso.nombre);
    
    if (curso.bloqueado === 1) {
      btn.style.background = '#999';
      btn.style.cursor = 'not-allowed';
      btn.disabled = true;
      btn.title = 'Curso bloqueado';
    } else {
      btn.onclick = (function(cursoId, cursoNombre) {
        return function() {
          console.log(`🔵 CLICK EN CURSO: ${cursoNombre} (ID: ${cursoId})`);
          seleccionarCurso(cursoId);
        };
      })(curso.id, curso.nombre);
    }
    
    botonesContainer.appendChild(btn);
  });
  
  const primerCurso = cursos.find(c => c.bloqueado === 0);
  if (primerCurso) {
    console.log(`Seleccionando primer curso automáticamente: ${primerCurso.nombre} (ID: ${primerCurso.id})`);
    seleccionarCurso(primerCurso.id);
  }
}

async function seleccionarCurso(cursoId) {
  console.log(`=== SELECCIONANDO CURSO ID: ${cursoId} ===`);
  
  const curso = cursos.find(c => c.id === parseInt(cursoId));
  if (!curso) {
    console.error(`❌ Curso con ID ${cursoId} no encontrado`);
    return;
  }
  
  if (curso.bloqueado === 1) {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('cursoBloqueadoMsg').style.display = 'block';
    return;
  }
  
  cursoSeleccionado = curso.id;
  document.getElementById('cursoBloqueadoMsg').style.display = 'none';
  document.getElementById('mainContent').style.display = 'flex';
  
  document.querySelectorAll('#botonesCursos button').forEach(btn => {
    if (btn.disabled) return;
    const btnId = parseInt(btn.getAttribute('data-id'));
    if (btnId === curso.id) {
      btn.style.background = '#8a82f2';
      btn.style.color = 'white';
    } else {
      btn.style.background = 'white';
      btn.style.color = '#01172c';
    }
  });
  
  try {
    const clasesRes = await fetch(`/api/clases/${curso.id}`);
    
    if (clasesRes.status === 403) {
      document.getElementById('mainContent').style.display = 'none';
      document.getElementById('cursoBloqueadoMsg').style.display = 'block';
      return;
    }
    
    clases = await clasesRes.json();
    console.log(`📚 Clases recibidas para curso ${curso.nombre}:`, clases);
    
    const listaDiv = document.getElementById('listaClases');
    listaDiv.innerHTML = '';
    
    if (clases.length === 0) {
      listaDiv.innerHTML = '<p>No hay clases en este curso</p>';
      return;
    }
    
    clases.forEach(cls => {
      const div = document.createElement('div');
      div.textContent = cls.titulo;
      div.onclick = () => seleccionarClase(cls.id);
      listaDiv.appendChild(div);
    });
    
    if (clases.length > 0) {
      await seleccionarClase(clases[0].id);
    }
    
  } catch (error) {
    console.error('❌ Error cargando clases:', error);
  }
}

async function seleccionarClase(claseId) {
  const clase = clases.find(c => c.id === parseInt(claseId));
  if (!clase) return;
  
  claseSeleccionada = clase.id;
  
  document.getElementById('claseTitulo').innerText = clase.titulo;
  
  const video = document.getElementById('claseVideo');
  video.src = clase.video_url || '';
  video.load();

  // Deshabilitar descarga y menú contextual en el video
  video.setAttribute('controlsList', 'nodownload');
  video.setAttribute('oncontextmenu', 'return false;');

  const recursosRes = await fetch(`/api/recursos/${claseId}`);
  const recursos = await recursosRes.json();
  
  document.getElementById('listaMateriales').innerHTML = '';
  document.getElementById('listaDiapositivas').innerHTML = '';
  document.getElementById('listaTemario').innerHTML = '';
  
  recursos.forEach(rec => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${rec.url}" target="_blank">📄 ${rec.nombre}</a> <a href="${rec.url}" download>⬇️ Descargar</a>`;
    if (rec.tipo === 'material') {
      document.getElementById('listaMateriales').appendChild(li);
    } else if (rec.tipo === 'diapositiva') {
      document.getElementById('listaDiapositivas').appendChild(li);
    } else if (rec.tipo === 'temario') {
      document.getElementById('listaTemario').appendChild(li);
    }
  });

  const califRes = await fetch(`/api/mi-calificacion/${claseId}`);
  const miCalif = await califRes.json();
  renderEstrellas(miCalif.puntuacion || 0);
  document.getElementById('comentarioInput').value = miCalif.comentario || '';
  
  await cargarComentarios(claseId);
}

function renderEstrellas(puntuacionActual) {
  const estrellasDiv = document.getElementById('estrellasCalificacion');
  estrellasDiv.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('i');
    star.className = i <= puntuacionActual ? 'fas fa-star' : 'far fa-star';
    star.style.fontSize = '34px';
    star.style.cursor = 'pointer';
    star.style.marginRight = '8px';
    star.style.color = i <= puntuacionActual ? '#ff7400' : '#ccc';
    star.onclick = () => {
      document.querySelectorAll('#estrellasCalificacion i').forEach((s, idx) => {
        if (idx < i) {
          s.className = 'fas fa-star';
          s.style.color = '#ff7400';
        } else {
          s.className = 'far fa-star';
          s.style.color = '#ccc';
        }
      });
    };
    estrellasDiv.appendChild(star);
  }
}

async function cargarComentarios(claseId) {
  const res = await fetch(`/api/calificaciones/${claseId}`);
  const comentarios = await res.json();
  const container = document.getElementById('listaComentarios');
  container.innerHTML = '';
  if (comentarios.length === 0) {
    container.innerHTML = '<p class="comentario">No hay comentarios aún. ¡Sé el primero en calificar esta clase!</p>';
    return;
  }
  comentarios.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comentario';
    div.innerHTML = `<strong>${c.nombre}</strong> ⭐ ${c.puntuacion}/5<br>
                     <em>${c.comentario || 'Sin comentario'}</em><br>
                     <small>${new Date(c.fecha).toLocaleString()}</small>`;
    container.appendChild(div);
  });
}

document.getElementById('enviarCalificacionBtn').onclick = async () => {
  if (!claseSeleccionada) {
    alert('Por favor selecciona una clase primero');
    return;
  }
  
  let puntuacion = 0;
  const stars = document.querySelectorAll('#estrellasCalificacion i');
  stars.forEach((star, idx) => {
    if (star.className === 'fas fa-star') puntuacion = idx + 1;
  });
  
  if (puntuacion === 0) {
    alert('Por favor selecciona una calificación con estrellas');
    return;
  }
  
  const comentario = document.getElementById('comentarioInput').value;
  
  try {
    const res = await fetch('/api/calificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clase_id: claseSeleccionada, puntuacion, comentario })
    });
    
    if (res.ok) {
      alert('✅ Calificación guardada exitosamente');
      await cargarComentarios(claseSeleccionada);
    } else {
      const error = await res.json();
      alert('Error: ' + (error.error || 'No se pudo guardar la calificación'));
    }
  } catch (error) {
    console.error('Error al calificar:', error);
    alert('Error al guardar la calificación');
  }
};

document.getElementById('logoutBtn').onclick = async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
};

cargarDatos();