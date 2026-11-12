import datosTeatro from '../data/obras.json';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './navigation.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

dayjs.locale('es');

const fmt = f => dayjs(f).format('dddd D [de] MMMM, HH:mm');
const assetUrl = path => `${import.meta.env.BASE_URL}${path.replace(/^\.?\//, '')}`;
let datos = null;
let obraSeleccionada = null;

function pintarObraDestacada(obra) {
    const panel = document.getElementById('obraDestacada');
    if (!obra) {
        panel.replaceChildren();
        return;
    }

    const horas = [...new Set(obra.funciones.map(funcion => dayjs(funcion.fecha).format('HH:mm')))];
    panel.classList.remove('actualizando');
    panel.innerHTML = `
        <div class="obra-destacada-contenido">
            <p class="obra-etiqueta">Obra destacada</p>
            <h3 class="obra-destacada-titulo${obra.titulo.length > 20 ? ' titulo-largo' : ''}">${obra.titulo}</h3>
            <div class="obra-sinopsis">
                <p>${obra.sinopsis}</p>
            </div>
            <div class="obra-metricas">
                <div>
                    <strong>${horas.join(' · ')}</strong>
                    <span>Hora de Inicio</span>
                </div>
            </div>
        </div>
        <div class="obra-destacada-acciones">
            <button class="btn btn-borde" type="button" data-video="${obra.id}"${obra.video ? '' : ' disabled aria-disabled="true"'}>Ver Avance</button>
            <a class="btn btn-primario" href="#reserva">Reservar</a>
        </div>
    `;
    requestAnimationFrame(() => panel.classList.add('actualizando'));
}

function pintarObras() {
    document.getElementById('listaObras').innerHTML = datos.obras.map(o => `
        <button class="tarjeta cartelera-afiche" type="button" data-obra="${o.id}"
                aria-pressed="${o.id === obraSeleccionada.id}"
                aria-label="Seleccionar obra ${o.titulo}">
            <img src="${assetUrl(o.img)}" alt="Imagen de ${o.titulo}" loading="lazy">
            <div class="tarjeta-cuerpo">
                <h3>${o.titulo}</h3>
                <p class="autor">${o.autor}</p>
                <p class="fecha">${o.funciones.map(f => fmt(f.fecha)).join(' · ')}</p>
            </div>
        </button>
    `).join('');
}

function seleccionarObra(obra, centrarTarjeta = false) {
    if (!obra || obra.id === obraSeleccionada?.id) return;

    obraSeleccionada = obra;
    pintarObraDestacada(obraSeleccionada);

    const tarjetas = [...document.querySelectorAll('#listaObras [data-obra]')];
    for (const tarjeta of tarjetas) {
        tarjeta.setAttribute('aria-pressed', String(tarjeta.dataset.obra === String(obra.id)));
    }

    const url = new URL(window.location.href);
    url.searchParams.set('obra', String(obra.id));
    window.history.replaceState(null, '', url);
    document.dispatchEvent(new CustomEvent('obra-seleccionada', {
        detail: obra
    }));

    if (centrarTarjeta) {
        const tarjeta = tarjetas.find(item => item.dataset.obra === String(obra.id));
        tarjeta?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}

function inicializarSeleccionObras() {
    const idSolicitado = new URLSearchParams(window.location.search).get('obra');
    obraSeleccionada = datos.obras.find(obra => String(obra.id) === idSolicitado) ?? datos.obras[0] ?? null;

    document.getElementById('listaObras').addEventListener('click', event => {
        const tarjeta = event.target.closest('button[data-obra]');
        if (!tarjeta) return;
        const obra = datos.obras.find(item => String(item.id) === tarjeta.dataset.obra);
        seleccionarObra(obra, true);
    });

    document.getElementById('listaObras').addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const tarjetas = [...document.querySelectorAll('#listaObras button[data-obra]')];
        const indice = tarjetas.indexOf(event.target);
        if (indice < 0 || tarjetas.length < 2) return;

        event.preventDefault();
        const incremento = event.key === 'ArrowRight' ? 1 : -1;
        const siguiente = tarjetas[(indice + incremento + tarjetas.length) % tarjetas.length];
        const obra = datos.obras.find(item => String(item.id) === siguiente.dataset.obra);
        siguiente.focus();
        seleccionarObra(obra, true);
    });
}

document.addEventListener('funcion-seleccionada', event => {
    const imagen = event.detail?.obra?.img;
    if (imagen) {
        window.actualizarFondoTeatro?.(document.body.dataset.screen, assetUrl(imagen));
    }
});

function pintarGaleria() {
    document.getElementById('listaGaleria').innerHTML = datos.pasadas.map(p => `
        <article class="tarjeta obra-pasada" data-aos="fade-up">
            <picture>
                <source media="(min-width:900px)" srcset="${assetUrl(p.img)}">
                <img src="${assetUrl(p.imgSm)}" alt="Función de ${p.titulo}" loading="lazy">
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
                backgroundColor: 'rgba(255, 255, 255, 0.55)',
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#fff' }
                },
                y: {
                    ticks: { color: 'rgba(255, 255, 255, 0.72)' },
                    grid: { color: 'rgba(255, 255, 255, 0.16)' }
                }
            }
        }
    });
}

function pintarTalleres() {
    document.getElementById('listaTalleres').innerHTML = datos.talleres.map(t => `
        <article class="tarjeta taller-card" data-aos="fade-up">
            <div class="taller-imagen">
                <img src="${assetUrl(t.img)}" alt="Escena teatral relacionada con ${t.titulo}" loading="lazy">
                <h3>${t.titulo}</h3>
            </div>
            <div class="tarjeta-cuerpo taller-cuerpo">
                <p class="taller-horario">${t.dia}</p>
                <p class="taller-cupos">${t.cupos} cupos disponibles</p>
                <hr>
                <p class="taller-descripcion">${t.descripcion}</p>
                <button class="btn" type="button" data-taller="${t.id}">Inscribirme</button>
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
    const container = document.getElementById('mapaCampus');
    const fallback = document.getElementById('mapaCampusFallback');
    if (!container || !fallback) return;

    let map;
    let fallbackShown = false;
    const showFallback = () => {
        if (fallbackShown) return false;
        fallbackShown = true;
        container.hidden = true;
        fallback.hidden = false;
        return true;
    };

    try {
        map = L.map(container).setView(pos, 16);
        const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        tiles.on('tileerror', () => {
            if (showFallback()) map.remove();
        });

        L.marker(pos).addTo(map).bindPopup('Auditorio UCB, La Paz').openPopup();
    } catch (error) {
        console.error('No se pudo cargar el mapa interactivo del campus.', error);
        if (showFallback() && map) map.remove();
    }
}

function actualizarFondoPorSeccion() {
    const sections = [...document.querySelectorAll('main > section[id]')];
    if (!sections.length) return;
    let activeScreen = '';

    const update = () => {
        const viewportCenter = window.innerHeight / 2;
        const visibleSection = sections.find(section => {
            const bounds = section.getBoundingClientRect();
            return bounds.top <= viewportCenter && bounds.bottom >= viewportCenter;
        });

        if (visibleSection) {
            const screen = visibleSection.id === 'inicio' ? 'hero' : visibleSection.id;
            if (screen !== activeScreen) {
                activeScreen = screen;
                document.body.dataset.screen = screen;
                window.actualizarFondoTeatro?.(screen);
            }
        }
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('pagehide', () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
    }, { once: true });
    update();
}

function animar() {
    AOS.init({ duration: 700, once: true });
    gsap.from('.hero-titular > *, .hero-acciones > *', {
        y: 30,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        delay: 0.4
    });
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
inicializarSeleccionObras();
pintarObraDestacada(obraSeleccionada);
pintarObras();
pintarGaleria();
pintarTalleres();
cuentaRegresiva();
mapaCampus();
animar();
actualizarFondoPorSeccion();
document.dispatchEvent(new Event('datos-listos'));