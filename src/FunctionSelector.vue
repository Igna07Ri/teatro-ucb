<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { selectFunction } from './reservation-store.js';

const works = ref([]);
const selectedId = ref('');
const selectedWorkId = ref('');

const dateLabel = date => dayjs(date).format('D MMM, HH:mm');
const functionGroups = computed(() => works.value.filter(work => String(work.id) === selectedWorkId.value).map(work => ({
    ...work,
    funciones: work.funciones.map(funcion => ({
        ...funcion,
        label: `${work.titulo} - ${dateLabel(funcion.fecha)}`
    }))
})));

function loadWorks() {
    works.value = window.TEATRO?.obras ?? [];
    const requestedId = new URLSearchParams(window.location.search).get('obra');
    const selectedWork = works.value.find(work => String(work.id) === requestedId) ?? works.value[0];
    selectedWorkId.value = selectedWork ? String(selectedWork.id) : '';
}

function updateSelectedWork(event) {
    const selectedWork = works.value.find(work => String(work.id) === String(event.detail?.id));
    if (selectedWork) selectedWorkId.value = String(selectedWork.id);
}

watch(selectedWorkId, id => {
    const selectedWork = works.value.find(work => String(work.id) === id);
    const firstFunction = selectedWork?.funciones[0];
    selectedId.value = firstFunction?.id ?? '';
    if (!firstFunction) selectFunction(null);
});

watch(selectedId, id => {
    if (!id) {
        selectFunction(null);
        return;
    }
    const funcion = works.value
        .filter(work => String(work.id) === selectedWorkId.value)
        .flatMap(work => work.funciones)
        .find(item => item.id === id);
    if (funcion) {
        const obra = works.value.find(work => String(work.id) === selectedWorkId.value);
        document.dispatchEvent(new CustomEvent('funcion-seleccionada', {
            detail: { funcion, obra }
        }));
        selectFunction(funcion);
    }
});

onMounted(() => {
    loadWorks();
    document.addEventListener('datos-listos', loadWorks);
    document.addEventListener('obra-seleccionada', updateSelectedWork);
});

onUnmounted(() => {
    document.removeEventListener('datos-listos', loadWorks);
    document.removeEventListener('obra-seleccionada', updateSelectedWork);
});
</script>

<template>
    <label for="funcion">Función</label>
    <select id="funcion" v-model="selectedId" :disabled="!functionGroups.length">
        <optgroup v-for="work in functionGroups" :key="work.id" :label="work.titulo">
            <option v-for="funcion in work.funciones" :key="funcion.id" :value="funcion.id">
                {{ dateLabel(funcion.fecha) }}
            </option>
        </optgroup>
    </select>
</template>
