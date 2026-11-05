<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { selectFunction } from './reservation-store.js';

const works = ref([]);
const selectedId = ref('');

const dateLabel = date => dayjs(date).format('D MMM, HH:mm');
const functionGroups = computed(() => works.value.map(work => ({
    ...work,
    funciones: work.funciones.map(funcion => ({
        ...funcion,
        label: `${work.titulo} - ${dateLabel(funcion.fecha)}`
    }))
})));

function loadWorks() {
    works.value = window.TEATRO?.obras ?? [];
    if (works.value.length && !selectedId.value) {
        selectedId.value = works.value[0].funciones[0].id;
    }
}

watch(selectedId, id => {
    if (!id) return;
    const funcion = works.value
        .flatMap(work => work.funciones)
        .find(item => item.id === id);
    if (funcion) selectFunction(funcion);
});

onMounted(() => {
    loadWorks();
    document.addEventListener('datos-listos', loadWorks);
});

onUnmounted(() => document.removeEventListener('datos-listos', loadWorks));
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
