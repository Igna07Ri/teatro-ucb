import datosTeatro from '../data/obras.json';

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
                <p class="fecha">${o.funciones.map(f => fmt(f.fecha)).join(' · ')}</p>
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
        .flatMap(o => o.funciones.map(f => dayjs(f.fecha)))
        .filter(d => d.isAfter(dayjs()))
        .sort((a, b) => a - b)[0];

    el.textContent = prox
        ? `Próxima función el ${prox.format('D [de] MMMM')}, faltan ${prox.diff(dayjs(), 'day')} días.`
        : 'La temporada ya terminó. Mira las obras pasadas.';
}

function mapaCampus() {
    const pos = [-16.522801, -68.1118247];
    const m = L.map('mapaCampus').setView(pos, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(m);

    L.marker(pos).addTo(m).bindPopup('Universidad Católica Boliviana San Pablo, sede Obrajes').openPopup();
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
    if (!o) return;

    document.getElementById('tituloVideo').textContent = o.titulo;
    const contenido = document.getElementById('videoContenido');
    const errorVideo = document.getElementById('errorVideo');
    const dlgVideo = document.getElementById('dlgVideo');
    contenido.replaceChildren();
    errorVideo.hidden = true;
    errorVideo.textContent = '';

    try {
        const url = new URL(o.video);
        if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error('El enlace del video debe usar HTTP o HTTPS.');
        }

        const youtubeId = getYouTubeVideoId(url);
        if (youtubeId === null) {
            throw new Error('El enlace de YouTube no contiene un ID de video válido.');
        }

        if (youtubeId) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`;
            iframe.title = `Video: ${o.titulo}`;
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            contenido.append(iframe);
        } else {
            const video = document.createElement('video');
            video.controls = true;
            video.preload = 'none';
            video.src = url.href;
            video.addEventListener('error', () => {
                errorVideo.textContent = 'No se pudo reproducir el video. Usa un enlace de YouTube o la URL directa de un archivo de video.';
                errorVideo.hidden = false;
            }, { once: true });
            contenido.append(video);
        }
    } catch (error) {
        errorVideo.textContent = error instanceof Error
            ? error.message
            : 'El enlace del video no es válido.';
        errorVideo.hidden = false;
    }

    dlgVideo.showModal();
});

document.getElementById('dlgVideo').addEventListener('close', () => {
    document.getElementById('videoContenido').replaceChildren();
});

function getYouTubeVideoId(url) {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
        const id = url.pathname.slice(1).split('/')[0];
        return /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (!['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
        return undefined;
    }

    const path = url.pathname.split('/').filter(Boolean);
    const id = url.pathname === '/watch'
        ? url.searchParams.get('v')
        : ['embed', 'shorts', 'live'].includes(path[0]) ? path[1] : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
}

datos = datosTeatro;
window.TEATRO = datos;
pintarObras();
pintarGaleria();
pintarTalleres();
cuentaRegresiva();
mapaCampus();
animar();
document.dispatchEvent(new Event('datos-listos'));