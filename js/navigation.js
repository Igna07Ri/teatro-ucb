import { cerrarSesion, supabase } from './supabase.js';

let activeBackgroundLayer = 'before';
let backgroundFrame = 0;
let currentBackground = null;
let backgroundInitialized = false;
let selectedFunctionImage = null;

function actualizarFondoTeatro(screen, functionImage, base) {
    if (functionImage) selectedFunctionImage = functionImage;
    const fondoEscenario = `url("${base}assets/keke1.png")`;
    const fondoCartelera = `url("${base}assets/keke2.png")`;
    const backgrounds = {
        hero: {
            image: `linear-gradient(0deg, rgba(0,0,0,.84), rgba(0,0,0,.3) 52%, rgba(0,0,0,.08)), ${fondoEscenario}`,
            opacity: 1
        },
        auth: { image: fondoEscenario, opacity: 1 },
        cartelera: {
            image: `linear-gradient(180deg,#000,rgba(33,15,15,.48) 45%,transparent), linear-gradient(0deg,#000,rgba(33,15,15,.48) 45%,transparent), ${selectedFunctionImage ? `url("${selectedFunctionImage}")` : fondoCartelera}`,
            opacity: 1
        },
        reserva: {
            image: `linear-gradient(180deg,#000,rgba(33,15,15,.48) 45%,transparent), linear-gradient(0deg,#000,rgba(33,15,15,.48) 45%,transparent), ${selectedFunctionImage ? `url("${selectedFunctionImage}")` : fondoCartelera}`,
            opacity: 1
        },
        talleres: { image: fondoEscenario, opacity: 0.1, filter: 'blur(3px)' },
        galeria: { image: fondoEscenario, opacity: 0.3, filter: 'blur(3px)' },
        ubicacion: { image: fondoEscenario, opacity: 0.3, filter: 'blur(3px)' }
    };
    const nextBackground = backgrounds[screen] ?? { image: 'none', opacity: 1 };
    if (
        backgroundInitialized
        && currentBackground?.image === nextBackground.image
        && currentBackground?.opacity === nextBackground.opacity
        && currentBackground?.filter === nextBackground.filter
    ) return;

    cancelAnimationFrame(backgroundFrame);
    const nextLayer = activeBackgroundLayer === 'before' ? 'after' : 'before';
    const inactivePseudo = nextLayer === 'before' ? '::before' : '::after';
    document.body.style.setProperty(`--fondo-${nextLayer}`, nextBackground.image);
    document.body.style.setProperty(`--filtro-${nextLayer}`, nextBackground.filter ?? 'none');

    if (!backgroundInitialized) {
        document.body.style.setProperty(`--opacidad-${nextLayer}`, String(nextBackground.opacity));
        const otherLayer = nextLayer === 'before' ? 'after' : 'before';
        document.body.style.setProperty(`--fondo-${otherLayer}`, nextBackground.image);
        document.body.style.setProperty(`--filtro-${otherLayer}`, nextBackground.filter ?? 'none');
        document.body.style.setProperty(`--opacidad-${otherLayer}`, '0');
        activeBackgroundLayer = nextLayer;
        backgroundInitialized = true;
    } else {
        document.body.style.setProperty(`--opacidad-${nextLayer}`, '0');
        getComputedStyle(document.body, inactivePseudo).opacity;
        backgroundFrame = requestAnimationFrame(() => {
            document.body.style.setProperty(`--opacidad-${activeBackgroundLayer}`, '0');
            document.body.style.setProperty(`--opacidad-${nextLayer}`, String(nextBackground.opacity));
            activeBackgroundLayer = nextLayer;
            currentBackground = nextBackground;
            backgroundFrame = 0;
        });
    }

    currentBackground = nextBackground;
}

class TeatroNavigation extends HTMLElement {
    connectedCallback() {
        const base = import.meta.env.BASE_URL;
        const isAuthPage = /\/(?:login|registro)\.html$/.test(window.location.pathname);
        const home = isAuthPage ? `${base}index.html` : '';
        const sectionLink = id => `${home}#${id}`;
        window.actualizarFondoTeatro = (screen, functionImage) => actualizarFondoTeatro(screen, functionImage, base);
        const initialScreen = isAuthPage ? 'auth' : 'hero';
        document.body.dataset.screen = initialScreen;
        actualizarFondoTeatro(initialScreen, null, base);

        this.innerHTML = `
            <header class="cabecera">
                <a class="marca" href="${sectionLink('inicio')}">
                    <img class="marca-logo" src="${base}assets/logo_catolica.png"
                         alt="Universidad Católica Boliviana San Pablo" width="221" height="97">
                </a>
                <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menú</button>
                <nav id="menu" aria-label="Principal">
                    <ul>
                        <li><a href="${sectionLink('cartelera')}">Cartelera</a></li>
                        <li><a href="${sectionLink('reserva')}">Reservar</a></li>
                        <li><a href="${sectionLink('galeria')}">Galería</a></li>
                        <li><a href="${sectionLink('talleres')}">Talleres</a></li>
                        <li><a href="${sectionLink('ubicacion')}">Ubicación</a></li>
                    </ul>
                </nav>
                <div class="redes-nav">
                    <img src="${base}assets/socials_options.png" alt="Instagram, Facebook y TikTok"
                         width="128" height="56">
                </div>
                <div class="sesion-nav" id="sesionNav" aria-live="polite">
                    <a href="${base}login.html">Sign in</a>
                </div>
            </header>
        `;

        this.subscription?.unsubscribe();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            this.actualizarSesion(session?.user ?? null, base);
        });
        this.subscription = subscription;
        supabase.auth.getSession()
            .then(({ data: { session } }) => this.actualizarSesion(session?.user ?? null, base))
            .catch(error => {
                console.error('No se pudo consultar la sesión de navegación.', error);
                const container = this.querySelector('#sesionNav');
                container.textContent = 'No se pudo cargar la sesión.';
            });

        const button = this.querySelector('.menu-btn');
        const menu = this.querySelector('#menu');
        button.addEventListener('click', () => {
            const abierto = menu.classList.toggle('abierto');
            button.setAttribute('aria-expanded', String(abierto));
        });
        menu.addEventListener('click', event => {
            const link = event.target.closest('a');
            if (link) {
                const sectionId = new URL(link.href).hash.slice(1);
                if (sectionId) {
                    const screen = sectionId === 'inicio' ? 'hero' : sectionId;
                    document.body.dataset.screen = screen;
                    actualizarFondoTeatro(screen, null, base);
                }
                menu.classList.remove('abierto');
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    disconnectedCallback() {
        this.subscription?.unsubscribe();
    }

    actualizarSesion(user, base) {
        const container = this.querySelector('#sesionNav');
        if (!container) return;
        container.replaceChildren();

        if (!user) {
            const link = document.createElement('a');
            link.href = `${base}login.html`;
            link.textContent = 'Sign in';
            container.append(link);
            return;
        }

        const name = document.createElement('span');
        name.textContent = user.user_metadata?.nombre || user.email || 'Usuario';

        const logout = document.createElement('button');
        logout.type = 'button';
        logout.textContent = 'Cerrar sesión';
        logout.addEventListener('click', async () => {
            logout.disabled = true;
            try {
                await cerrarSesion();
            } catch (error) {
                console.error('No se pudo cerrar la sesión.', error);
                logout.disabled = false;
                const status = document.createElement('span');
                status.setAttribute('role', 'alert');
                status.textContent = error instanceof Error ? error.message : 'No se pudo cerrar la sesión.';
                container.append(status);
            }
        });

        container.append(name, logout);
    }
}

customElements.define('teatro-navigation', TeatroNavigation);
