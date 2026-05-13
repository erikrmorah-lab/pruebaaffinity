const API = '/api';

document.getElementById('showRegister').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
});
document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('btnLogin').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rol: 'usuario' })
  });
  const data = await res.json();
  if (data.success) {
    window.location.href = '/dashboard.html';
  } else {
    document.getElementById('loginMessage').innerText = 'Error: ' + data.error;
  }
});

document.getElementById('btnRegister').addEventListener('click', async () => {
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const marca = document.getElementById('regMarca').value;
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password, marca })
  });
  const data = await res.json();
  if (data.success) {
    alert('Registro exitoso, ahora inicia sesión');
    document.getElementById('showLogin').click();
  } else {
    document.getElementById('registerMessage').innerText = data.error;
  }
});

// Logo admin
document.getElementById('logo').addEventListener('click', () => {
  Swal.fire({
    title: 'Acceso Administrador',
    html: '<input id="adminEmail" placeholder="Email" class="swal2-input"><input id="adminPass" type="password" placeholder="Contraseña" class="swal2-input">',
    preConfirm: async () => {
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPass').value;
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rol: 'admin' })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/admin.html';
      } else {
        Swal.showValidationMessage('Credenciales inválidas');
      }
    }
  });
});
// Nota: necesitas incluir SweetAlert2, puedes agregar CDN en index.html
// <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>