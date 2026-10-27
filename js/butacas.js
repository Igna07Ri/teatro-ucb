const FILAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLS = 10;
const PRECIO = 40;
const mapa = document.getElementById('mapa');
const selFuncion = document.getElementById('funcion');
const btnConf = document.getElementById('confirmar');
const elegidas = new Set();

const clave = id => `reservas-funcion-${id}`;
const guardadas = id => JSON.parse(localStorage.getItem(clave(id)) || '[]');

function ocupadasBase(id) {
    let s = id * 7;
    const lista = [];

    FILAS.forEach(f => {
        for (let c = 1; c <= COLS; c++) {
            s = (s * 9301 + 49297) % 233280;
            if (s / 233280 < 0.22) lista.push(f + c);
        }
    });

    return lista;
}

function dibujar() {
    const id = selFuncion.value;
    const ocupadas = new Set([...ocupadasBase(Number(id)), ...guardadas(id)]);
    elegidas.clear();

    mapa.innerHTML = FILAS.map(f => `
        <div class="fila">
            <span>${f}</span>
            ${Array.from({ length: COLS }, (_, i) => {
                const cod = f + (i + 1);
                const oc = ocupadas.has(cod);
                return `
                    <button
                        class="asiento${oc ? ' ocupado' : ''}"
                        data-cod="${cod}"
                        aria-label="Butaca ${cod}${oc ? ', ocupada' : ''}"
                        aria-pressed="false"
                        ${oc ? 'disabled' : ''}>${oc ? '✕' : ''}</button>
                `;
            }).join('')}
        </div>
    `).join('');

    resumen();
}

function resumen() {
    const l = [...elegidas].sort();
    document.getElementById('lista').textContent = l.length ? l.join(', ') : 'ninguna';
    document.getElementById('total').textContent = `Bs ${l.length * PRECIO}`;
    btnConf.disabled = !l.length;
}

mapa.addEventListener('click', e => {
    const b = e.target.closest('.asiento');
    if (!b || b.disabled) return;

    const cod = b.dataset.cod;
    const on = !elegidas.has(cod);

    if (on) {
        elegidas.add(cod);
    } else {
        elegidas.delete(cod);
    }

    b.setAttribute('aria-pressed', on);
    resumen();
});

btnConf.addEventListener('click', () => {
    const id = selFuncion.value;
    const lista = [...elegidas].sort();

    localStorage.setItem(clave(id), JSON.stringify([...new Set([...guardadas(id), ...lista])]));
    dibujar();
    document.getElementById('mensaje').textContent = `Reserva confirmada: ${lista.join(', ')}. Total Bs ${lista.length * PRECIO}.`;
});

selFuncion.addEventListener('change', () => {
    document.getElementById('mensaje').textContent = '';
    dibujar();
});

document.addEventListener('datos-listos', () => {
    selFuncion.innerHTML = window.TEATRO.obras.map(o => `
        <option value="${o.id}">${o.titulo} - ${dayjs(o.fecha).format('D MMM, HH:mm')}</option>
    `).join('');
    dibujar();
});