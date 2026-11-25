<script setup>
import { getUser } from '@/composables/useAuth';
import api from '@/services/api';
import { computed, onMounted, reactive, ref } from 'vue';

const user = getUser();
const roles = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const formError = ref('');
const editingId = ref(null);
const search = ref('');
const descriptionFilter = ref('');
const form = reactive({ name: '', description: '' });

const isEditing = computed(() => editingId.value !== null);
const hasRoles = computed(() => roles.value.length > 0);
const hasFilters = computed(() => search.value.trim() !== '' || descriptionFilter.value !== '');

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const filteredRoles = computed(() => {
  const term = normalize(search.value.trim());

  return roles.value.filter((item) => {
    const hasDescription = !!(item.description && item.description.trim());

    const matchesFilter =
      !descriptionFilter.value ||
      (descriptionFilter.value === 'with' && hasDescription) ||
      (descriptionFilter.value === 'without' && !hasDescription);

    const matchesSearch =
      !term ||
      normalize(item.name).includes(term) ||
      normalize(item.description).includes(term) ||
      String(item.id).includes(term);

    return matchesFilter && matchesSearch;
  });
});

function clearFilters() {
  search.value = '';
  descriptionFilter.value = '';
}

function resetForm() {
  form.name = '';
  form.description = '';
  formError.value = '';
  editingId.value = null;
}

function startEdit(item) {
  editingId.value = item.id;
  form.name = item.name;
  form.description = item.description ?? '';
  formError.value = '';
}

async function loadRoles() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get(`/roles/company/${user.companyId}`);
    roles.value = response.data;
  } catch (error) {
    roles.value = [];
    errorMessage.value = error.response?.data?.message || 'No se pudieron cargar los roles.';
    console.error('Error al cargar los roles:', error);
  } finally {
    isLoading.value = false;
  }
}

async function saveRole() {
  formError.value = '';

  if (!form.name.trim()) {
    formError.value = 'Ingresa el nombre del rol.';
    return;
  }

  isSaving.value = true;

  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    companyId: user.companyId
  };

  try {
    if (isEditing.value) {
      await api.put(`/roles/${editingId.value}`, payload, {
        params: { companyId: user.companyId },
      });
    } else {
      await api.post('/roles', payload, {
        params: { companyId: user.companyId },
      });
    }

    resetForm();
    await loadRoles();
  } catch (error) {
    const data = error.response?.data;
    formError.value = data?.errors
      ? Object.values(data.errors)[0]
      : data?.message || 'No se pudo guardar el rol.';
    console.error('Error al guardar el rol:', error);
  } finally {
    isSaving.value = false;
  }
}

onMounted(loadRoles);
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <p class="mb-1 text-xs font-extrabold tracking-[0.2em] text-blue-600">
        {{ isEditing ? 'EDITAR ROL' : 'NUEVO ROL' }}
      </p>
      <h2 class="text-xl font-extrabold tracking-tight text-slate-900">
        {{ isEditing ? 'Editar rol' : 'Agregar rol' }}
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ isEditing ? 'Actualiza los datos del rol seleccionado.' : 'Crea un rol para tu empresa.' }}
      </p>

      <form class="mt-6 space-y-5" novalidate @submit.prevent="saveRole">
        <div>
          <label for="roleName" class="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
          <input
            id="roleName"
            v-model="form.name"
            type="text"
            maxlength="100"
            placeholder="Técnico"
            :disabled="isSaving"
            :aria-invalid="!!formError"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between gap-3">
            <label for="roleDescription" class="text-sm font-semibold text-slate-700">Descripción</label>
            <span class="text-xs font-medium text-slate-400">{{ form.description.length }}/255</span>
          </div>
          <textarea
            id="roleDescription"
            v-model="form.description"
            rows="3"
            maxlength="255"
            placeholder="Atiende las órdenes de trabajo asignadas"
            :disabled="isSaving"
            class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          ></textarea>
        </div>

        <p v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ formError }}</p>

        <div class="flex flex-col gap-3">
          <button
            type="submit"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <svg v-if="!isEditing && !isSaving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar rol' }}
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
        <h2 class="text-lg font-bold text-slate-900">Roles de la empresa</h2>
        <p class="text-sm text-slate-500">Administra los roles de tu empresa.</p>
      </div>

      <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-6 py-4 md:flex-row md:items-center">
        <div class="relative flex-1">
          <label for="roleSearch" class="sr-only">Buscar roles</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            id="roleSearch"
            v-model="search"
            type="search"
            autocomplete="off"
            placeholder="Buscar por nombre o descripción..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div class="relative md:w-56">
          <label for="descriptionFilter" class="sr-only">Filtrar por descripción</label>
          <select
            id="descriptionFilter"
            v-model="descriptionFilter"
            class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            :class="descriptionFilter ? 'text-slate-900' : 'text-slate-500'"
          >
            <option value="">Todos los roles</option>
            <option value="with" class="text-slate-900">Con descripción</option>
            <option value="without" class="text-slate-900">Sin descripción</option>
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
        Cargando roles...
      </div>

      <div v-else-if="errorMessage" class="px-6 py-10" role="alert">
        <div class="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          <p>{{ errorMessage }}</p>
          <button type="button" class="shrink-0 font-bold underline hover:text-red-900" @click="loadRoles">
            Reintentar
          </button>
        </div>
      </div>

      <div v-else-if="!hasRoles" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">Esta empresa todavía no tiene roles</p>
        <p class="mt-1 text-sm text-slate-500">Crea el primero con el formulario.</p>
      </div>

      <div v-else-if="filteredRoles.length === 0" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">No se encontraron roles</p>
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
                <th scope="col" class="px-6 py-3">Descripción</th>
                <th scope="col" class="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredRoles"
                :key="item.id"
                class="hover:bg-slate-50"
                :class="{ 'bg-blue-50/60': item.id === editingId }"
              >
                <td class="px-6 py-4 text-slate-600">{{ item.id }}</td>
                <td class="px-6 py-4">
                  <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{{ item.name }}</span>
                </td>
                <td class="px-6 py-4 text-slate-600">{{ item.description || '—' }}</td>
                <td class="px-6 py-4 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    :aria-label="`Editar el rol ${item.name}`"
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
          Mostrando {{ filteredRoles.length }} de {{ roles.length }} {{ roles.length === 1 ? 'rol' : 'roles' }}
        </p>
      </div>
    </section>
  </div>
</template>
