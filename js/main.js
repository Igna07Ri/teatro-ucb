dayjs.locale('es');

const fmt = f => dayjs(f).format('dddd D [de] MMMM, HH:mm');
const btnMenu = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
let datos = null;

btnMenu.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    btnMenu.setAttribute('aria-expanded', abierto);
});

menu.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
        menu.classList.remove('abierto');
        btnMenu.setAttribute('aria-expanded', 'false');
    }
});

function pintarObras() {
    document.getElementById('listaObras').innerHTML = datos.obras.map(o => `
        <article class="tarjeta" data-aos="fade-up">
            <img src="${o.img}" alt="Escena de ${o.titulo}" loading="lazy">
            <div class="tarjeta-cuerpo">
                <h3>${o.titulo}</h3>
                <p class="autor">${o.autor}</p>
                <p class="fecha">${fmt(o.fecha)}</p>
                <p>${o.sinopsis}</p>
                <button class="btn btn-borde" data-video="${o.id}">Ver avance</button>
            </div>
        </article>
    `).join('');
}

function pintarGaleria() {
    document.getElementById('listaGaleria').innerHTML = datos.pasadas.map(p => `
        <article class="tarjeta" data-aos="fade-up">
            <picture>
                <source media="(min-width:900px)" srcset="${p.img}">
                <img src="${p.imgSm}" alt="Función de ${p.titulo}" loading="lazy">
            </picture>
            <div class="tarjeta-cuerpo">
                <h3>${p.titulo}</h3>
                <p class="fecha">${p.anio}</p>
                <details>
                    <summary>Reseña del público</summary>
                    <p>${p.resena}</p>
                </details>
            </div>
        </article>
    `).join('');

    new Chart(document.getElementById('grafico'), {
        type: 'bar',
        data: {
            labels: datos.pasadas.map(p => p.titulo),
            datasets: [{
                label: 'Asistentes',
                data: datos.pasadas.map(p => p.asistencia),
                backgroundColor: '#800020',
                borderColor: '#D4AF37',
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: '#f1ece4' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#b9b0a3' }
                },
                y: {
                    ticks: { color: '#b9b0a3' },
                    grid: { color: '#2e2a2b' }
                }
            }
        }
    });
}

function pintarTalleres() {
    document.getElementById('listaTalleres').innerHTML = datos.talleres.map(t => `
        <article class="tarjeta" data-aos="fade-up">
            <div class="tarjeta-cuerpo">
                <h3>${t.titulo}</h3>
                <p class="fecha">${t.dia}</p>
                <p>${t.cupos} cupos disponibles</p>
                <button class="btn" data-taller="${t.id}">Inscribirme</button>
            </div>
        </article>
    `).join('');
}

function cuentaRegresiva() {
    const el = document.getElementById('cuenta');
    const prox = datos.obras
        .map(o => dayjs(o.fecha))
        .filter(d => d.isAfter(dayjs()))
        .sort((a, b) => a - b)[0];

    el.textContent = prox
        ? `Próxima función el ${prox.format('D [de] MMMM')}, faltan ${prox.diff(dayjs(), 'day')} días.`
        : 'La temporada ya terminó. Mira las obras pasadas.';
}

function mapaCampus() {
    const pos = [-16.5207, -68.1226];
    const m = L.map('mapaCampus').setView(pos, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(m);

    L.marker(pos).addTo(m).bindPopup('Auditorio UCB, La Paz').openPopup();
}

function animar() {
    AOS.init({ duration: 700, once: true });
    gsap.from('.telon', { scaleY: 0, duration: 1.4, ease: 'power3.out' });
    gsap.from('.hero-texto > *', { y: 30, opacity: 0, stagger: 0.12, duration: 0.8, delay: 0.6 });
}

document.addEventListener('click', e => {
    const v = e.target.closest('[data-video]');
    if (!v) return;

    const o = datos.obras.find(x => x.id == v.dataset.video);
    document.getElementById('tituloVideo').textContent = o.titulo;
    document.getElementById('video').src = o.video;
    document.getElementById('dlgVideo').showModal();
});

document.getElementById('dlgVideo').addEventListener('close', () => {
    const vid = document.getElementById('video');
    vid.pause();
    vid.removeAttribute('src');
});

fetch('data/obras.json')
    .then(r => r.json())
    .then(d => {
        datos = d;
        window.TEATRO = d;
        pintarObras();
        pintarGaleria();
        pintarTalleres();
        cuentaRegresiva();
        mapaCampus();
        animar();
        document.dispatchEvent(new Event('datos-listos'));
    })
    .catch(() => {
        document.getElementById('listaObras').textContent = 'No se pudo cargar la cartelera. Abre el sitio con Live Server.';
    });