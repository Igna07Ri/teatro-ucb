import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ---------- Autenticación ----------
export async function registrar({ nombre, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } } // lo recoge el trigger para crear el perfil
  });
  if (error) throw error;
  return data;
}

export async function iniciarSesion({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function usuarioActual() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

// ---------- Reservas (reemplazan el localStorage) ----------
export async function butacasOcupadas(funcionId) {
  const { data, error } = await supabase
    .from('reservas').select('butaca').eq('funcion_id', funcionId);
  if (error) throw error;
  return data.map(r => r.butaca);
}

export async function confirmarReserva(funcionId, butacas) {
  const user = await usuarioActual();
  if (!user) throw new Error('Debes iniciar sesión para reservar.');
  const filas = butacas.map(b => ({ user_id: user.id, funcion_id: funcionId, butaca: b }));
  const { error } = await supabase.from('reservas').insert(filas);
  if (error) {
    if (error.code === '23505') throw new Error('Alguna butaca ya fue reservada. Elige otra.');
    throw error;
  }
}
