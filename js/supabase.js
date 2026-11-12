import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.host);
  } catch {
    return false;
  }
}

export const supabase = supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en GitHub Actions Secrets y vuelve a desplegar.');
  }
  return supabase;
}

// ---------- Autenticación ----------
export async function registrar({ nombre, email, password }) {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { nombre } } // lo recoge el trigger para crear el perfil
  });
  if (error) throw error;
  return data;
}

export async function iniciarSesion({ email, password }) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function usuarioActual() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

// ---------- Reservas (reemplazan el localStorage) ----------
export async function butacasOcupadas(funcionId) {
  const { data, error } = await getSupabase()
    .from('reservas').select('butaca').eq('funcion_id', funcionId);
  if (error) throw error;
  return data.map(r => r.butaca);
}

export async function confirmarReserva(funcionId, butacas) {
  const user = await usuarioActual();
  if (!user) throw new Error('Debes iniciar sesión para reservar.');
  const filas = butacas.map(b => ({ user_id: user.id, funcion_id: funcionId, butaca: b }));
  const { error } = await getSupabase().from('reservas').insert(filas);
  if (error) {
    if (error.code === '23505') throw new Error('Alguna butaca ya fue reservada. Elige otra.');
    throw error;
  }
}
