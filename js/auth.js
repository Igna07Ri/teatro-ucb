import { registrar, iniciarSesion, usuarioActual } from './supabase.js';

const form = document.querySelector('#auth-form');
const msg = document.querySelector('#auth-msg');
const modo = form.dataset.modo; // "login" | "registro"

// Si ya hay sesión, ir directo a reservar
usuarioActual()
  .then(u => { if (u) location.href = './index.html#reservar'; })
  .catch(err => { msg.textContent = traducir(err.message); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  const datos = Object.fromEntries(new FormData(form));
  const boton = form.querySelector('button[type="submit"]');
  boton.disabled = true;

  try {
    if (modo === 'registro') {
      if (datos.password !== datos.password2) throw new Error('Las contraseñas no coinciden.');
      const { session } = await registrar(datos);
      if (!session) {
        msg.style.color = '#fff';
        msg.textContent = 'Revisa tu correo para confirmar tu cuenta.';
        return;
      }
    } else {
      await iniciarSesion(datos);
    }
    location.href = './index.html#reservar';
  } catch (err) {
    msg.textContent = traducir(err.message);
  } finally {
    boton.disabled = false;
  }
});

function traducir(m) {
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(m)) return 'Ese correo ya está registrado.';
  if (/at least 6/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
  return m;
}
