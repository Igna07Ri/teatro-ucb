const dlg = document.getElementById('dlgTaller');
const form = document.getElementById('formTaller');
const err = document.getElementById('errorTaller');

document.addEventListener('click', e => {
    const b = e.target.closest('[data-taller]');
    if (!b) return;

    const t = window.TEATRO.talleres.find(x => x.id == b.dataset.taller);
    document.getElementById('tituloTaller').textContent = t.titulo;
    err.textContent = '';
    err.style.color = '';
    form.reset();
    dlg.showModal();
});

form.addEventListener('submit', e => {
    e.preventDefault();

    if (!form.checkValidity()) {
        const campo = [...form.elements].find(c => c.willValidate && !c.checkValidity());
        err.textContent = campo.name === 'correo'
            ? 'Usa tu correo institucional @ucb.edu.bo.'
            : 'Completa todos los campos.';
        campo.focus();
        return;
    }

    const lista = JSON.parse(localStorage.getItem('inscripciones') || '[]');

    lista.push({
        taller: document.getElementById('tituloTaller').textContent,
        ...Object.fromEntries(new FormData(form)),
        fecha: new Date().toISOString()
    });

    localStorage.setItem('inscripciones', JSON.stringify(lista));
    err.style.color = '#D4AF37';
    err.textContent = 'Inscripción enviada. Te escribiremos al correo.';
    setTimeout(() => dlg.close(), 1400);
});