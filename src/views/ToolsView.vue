<script setup>
import { getUser } from '@/composables/useAuth';
import api from '@/services/api';
import { computed, onMounted, reactive, ref } from 'vue';

const user = getUser();
const tools = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const formError = ref('');
const editingId = ref(null);
const search = ref('');
const statusFilter = ref('');
const form = reactive({ name: '', serialNumber: '', status: '' });

const statusOptions = [
  { value: 'AVAILABLE', label: 'Disponible', style: 'bg-emerald-50 text-emerald-700' },
  { value: 'ASSIGNED', label: 'Asignada', style: 'bg-indigo-50 text-indigo-700' },
  { value: 'IN_USE', label: 'En uso', style: 'bg-blue-50 text-blue-700' },
  { value: 'UNDER_MAINTENANCE', label: 'En mantenimiento', style: 'bg-amber-50 text-amber-700' },
  { value: 'DAMAGED', label: 'Dañada', style: 'bg-red-50 text-red-700' },
  { value: 'LOST', label: 'Perdida', style: 'bg-orange-50 text-orange-700' },
  { value: 'RETIRED', label: 'Retirada', style: 'bg-slate-100 text-slate-600' },
];

const statusMap = Object.fromEntries(statusOptions.map((option) => [option.value, option]));

function statusLabel(value) {
  return statusMap[value]?.label ?? value ?? '—';
}

function statusStyle(value) {
  return statusMap[value]?.style ?? 'bg-slate-100 text-slate-600';
}

const isEditing = computed(() => editingId.value !== null);
const hasTools = computed(() => tools.value.length > 0);
const hasFilters = computed(() => search.value.trim() !== '' || statusFilter.value !== '');

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const filteredTools = computed(() => {
  const term = normalize(search.value.trim());

  return tools.value.filter((item) => {
    const matchesStatus = !statusFilter.value || item.status === statusFilter.value;

    const matchesSearch =
      !term ||
      normalize(item.name).includes(term) ||
      normalize(item.serialNumber).includes(term) ||
      normalize(statusLabel(item.status)).includes(term) ||
      String(item.id).includes(term);

    return matchesStatus && matchesSearch;
  });
});

function clearFilters() {
  search.value = '';
  statusFilter.value = '';
}

function buildPayload() {
  return {
    name: form.name.trim(),
    serialNumber: form.serialNumber.trim(),
    companyId: user.companyId,
    status: form.status,
  };
}

function resetForm() {
  form.name = '';
  form.serialNumber = '';
  form.status = '';
  formError.value = '';
  editingId.value = null;
}

function startEdit(item) {
  editingId.value = item.id;
  form.name = item.name ?? '';
  form.serialNumber = item.serialNumber ?? '';
  form.status = item.status ?? '';
  formError.value = '';
}

async function loadTools() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get(`/tools/${user.companyId}`);
    tools.value = response.data;
  } catch (error) {
    tools.value = [];
    errorMessage.value = error.response?.data?.message || 'Error al cargar las herramientas.';
    console.error('Error al cargar las herramientas:', error);
  } finally {
    isLoading.value = false;
  }
}

async function saveTool() {
  formError.value = '';

  if (!form.name.trim() || !form.serialNumber.trim() || !form.status) {
    formError.value = 'Completa todos los campos del formulario.';
    return;
  }

  isSaving.value = true;

  try {
    if (isEditing.value) {
      await api.put(`/tools/${editingId.value}`, buildPayload());
    } else {
      await api.post('/tools', buildPayload());
    }

    resetForm();
    await loadTools();
  } catch (error) {
    const data = error.response?.data;
    formError.value = data?.errors
      ? Object.values(data.errors)[0]
      : data?.message || 'No se pudo guardar la herramienta.';
    console.error('Error al guardar la herramienta:', error);
  } finally {
    isSaving.value = false;
  }
}

onMounted(loadTools);
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <p class="mb-1 text-xs font-extrabold tracking-[0.2em] text-blue-600">
        {{ isEditing ? 'EDITAR HERRAMIENTA' : 'NUEVA HERRAMIENTA' }}
      </p>
      <h2 class="text-xl font-extrabold tracking-tight text-slate-900">
        {{ isEditing ? 'Editar herramienta' : 'Agregar herramienta' }}
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ isEditing ? 'Actualiza los datos de la herramienta seleccionada.' : 'Registra una herramienta de tu empresa.' }}
      </p>

      <form class="mt-6 space-y-5" novalidate @submit.prevent="saveTool">
        <div>
          <label for="toolName" class="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
          <input
            id="toolName"
            v-model="form.name"
            type="text"
            maxlength="100"
            placeholder="Taladro inalámbrico"
            :disabled="isSaving"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <label for="toolSerial" class="mb-2 block text-sm font-semibold text-slate-700">Número de serie</label>
          <input
            id="toolSerial"
            v-model="form.serialNumber"
            type="text"
            maxlength="100"
            autocomplete="off"
            placeholder="SN-000123"
            :disabled="isSaving"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <label for="toolStatus" class="mb-2 block text-sm font-semibold text-slate-700">Estado</label>
          <div class="relative">
            <select
              id="toolStatus"
              v-model="form.status"
              :disabled="isSaving"
              class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              :class="form.status ? 'text-slate-900' : 'text-slate-400'"
            >
              <option value="" disabled>Selecciona un estado</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value" class="text-slate-900">{{ option.label }}</option>
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        <p v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ formError }}</p>

        <div class="flex flex-col gap-3">
          <button
            type="submit"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <svg v-if="!isEditing && !isSaving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar herramienta' }}
          </button>

          <button
            v-if="isEditing"
            type="button"
            :disabled="isSaving"
            class="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            @click="resetForm"
          >
            Cancelar edición
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-5">
        <h2 class="text-lg font-bold text-slate-900">Herramientas de la empresa</h2>
        <p class="text-sm text-slate-500">Administra el inventario de herramientas de tu empresa.</p>
      </div>

      <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-6 py-4 md:flex-row md:items-center">
        <div class="relative flex-1">
          <label for="toolSearch" class="sr-only">Buscar herramientas</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            id="toolSearch"
            v-model="search"
            type="search"
            autocomplete="off"
            placeholder="Buscar por nombre, serie o estado..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div class="relative md:w-56">
          <label for="toolStatusFilter" class="sr-only">Filtrar por estado</label>
          <select
            id="toolStatusFilter"
            v-model="statusFilter"
            class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            :class="statusFilter ? 'text-slate-900' : 'text-slate-500'"
          >
            <option value="">Todos los estados</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value" class="text-slate-900">{{ option.label }}</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </div>

        <button
          v-if="hasFilters"
          type="button"
          class="rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          @click="clearFilters"
        >
          Limpiar filtros
        </button>
      </div>

      <div v-if="isLoading" class="px-6 py-16 text-center text-sm text-slate-500" role="status">
        Cargando herramientas...
      </div>

      <div v-else-if="errorMessage" class="px-6 py-10" role="alert">
        <div class="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          <p>{{ errorMessage }}</p>
          <button type="button" class="shrink-0 font-bold underline hover:text-red-900" @click="loadTools">
            Reintentar
          </button>
        </div>
      </div>

      <div v-else-if="!hasTools" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">Esta empresa todavía no tiene herramientas</p>
        <p class="mt-1 text-sm text-slate-500">Registra la primera con el formulario.</p>
      </div>

      <div v-else-if="filteredTools.length === 0" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">No se encontraron herramientas</p>
        <p class="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o cambia el filtro.</p>
        <button
          type="button"
          class="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
          @click="clearFilters"
        >
          Limpiar filtros
        </button>
      </div>

      <div v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" class="px-6 py-3">Id</th>
                <th scope="col" class="px-6 py-3">Nombre</th>
                <th scope="col" class="px-6 py-3">N.º de serie</th>
                <th scope="col" class="px-6 py-3">Estado</th>
                <th scope="col" class="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredTools"
                :key="item.id"
                class="hover:bg-slate-50"
                :class="{ 'bg-blue-50/60': item.id === editingId }"
              >
                <td class="px-6 py-4 text-slate-600">{{ item.id }}</td>
                <td class="px-6 py-4 font-medium text-slate-900">{{ item.name }}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-600">{{ item.serialNumber || '—' }}</td>
                <td class="px-6 py-4">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="statusStyle(item.status)"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    :aria-label="`Editar la herramienta ${item.name}`"
                    @click="startEdit(item)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="border-t border-slate-100 px-6 py-3 text-xs text-slate-500" role="status">
          Mostrando {{ filteredTools.length }} de {{ tools.length }} {{ tools.length === 1 ? 'herramienta' : 'herramientas' }}
        </p>
      </div>
    </section>
  </div>
</template>
