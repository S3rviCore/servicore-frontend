<script setup>
import { getUser } from '@/composables/useAuth';
import api from '@/services/api';
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';

const user = getUser();
const users = ref([]);
const technicians = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const formError = ref('');
const editingId = ref(null);
const search = ref('');
const statusFilter = ref('');
const form = reactive({ userId: '', phone: '', status: true });

const userSearch = ref('');
const dropdownOpen = ref(false);
const highlighted = ref(0);
const comboRef = ref(null);
const userInput = ref(null);

const isEditing = computed(() => editingId.value !== null);
const hasTechnicians = computed(() => technicians.value.length > 0);
const hasFilters = computed(() => search.value.trim() !== '' || statusFilter.value !== '');

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function userOf(item) {
  return users.value.find((u) => u.id === item.userId);
}

function technicianName(item) {
  const u = userOf(item);
  const name = item.name ?? u?.name ?? '';
  const lastName = item.lastName ?? u?.lastName ?? '';
  return `${name} ${lastName}`.trim() || `Usuario #${item.userId}`;
}

function technicianEmail(item) {
  return item.email ?? userOf(item)?.email ?? '';
}

const selectedUser = computed(() => users.value.find((u) => u.id === form.userId) || null);

const selectedLabel = computed(() => {
  return selectedUser.value
    ? `${selectedUser.value.name} ${selectedUser.value.lastName} · ${selectedUser.value.email}`
    : '';
});

const availableUsers = computed(() => {
  const taken = new Set(technicians.value.map((t) => t.userId));
  return users.value.filter((u) => !taken.has(u.id) || u.id === form.userId);
});

const filteredUserOptions = computed(() => {
  const term = normalize(userSearch.value.trim());
  if (!term) return availableUsers.value;

  return availableUsers.value.filter((u) =>
    normalize(`${u.name} ${u.lastName}`).includes(term) || normalize(u.email).includes(term)
  );
});

const filteredTechnicians = computed(() => {
  const term = normalize(search.value.trim());

  return technicians.value.filter((item) => {
    const matchesStatus =
      !statusFilter.value ||
      (statusFilter.value === 'active' && item.status) ||
      (statusFilter.value === 'inactive' && !item.status);

    const matchesSearch =
      !term ||
      normalize(technicianName(item)).includes(term) ||
      normalize(technicianEmail(item)).includes(term) ||
      normalize(item.phone).includes(term) ||
      String(item.id).includes(term);

    return matchesStatus && matchesSearch;
  });
});

function clearFilters() {
  search.value = '';
  statusFilter.value = '';
}

function openDropdown() {
  if (isEditing.value || isSaving.value) return;
  dropdownOpen.value = true;
  highlighted.value = 0;
}

function closeDropdown() {
  dropdownOpen.value = false;
  userSearch.value = '';
}

function onUserInput(event) {
  userSearch.value = event.target.value;
  dropdownOpen.value = true;
  highlighted.value = 0;
}

function selectUser(item) {
  form.userId = item.id;
  formError.value = '';
  closeDropdown();
}

function clearUser() {
  form.userId = '';
  nextTick(() => userInput.value?.focus());
}

function onUserKeydown(event) {
  const options = filteredUserOptions.value;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (!dropdownOpen.value) return openDropdown();
    highlighted.value = Math.min(highlighted.value + 1, options.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlighted.value = Math.max(highlighted.value - 1, 0);
  } else if (event.key === 'Enter' && dropdownOpen.value) {
    event.preventDefault();
    if (options[highlighted.value]) selectUser(options[highlighted.value]);
  } else if (event.key === 'Escape') {
    closeDropdown();
  }
}

function handleOutsideClick(event) {
  if (comboRef.value && !comboRef.value.contains(event.target)) {
    closeDropdown();
  }
}

function resetForm() {
  form.userId = '';
  form.phone = '';
  form.status = true;
  formError.value = '';
  editingId.value = null;
  closeDropdown();
}

function startEdit(item) {
  editingId.value = item.id;
  form.userId = item.userId;
  form.phone = item.phone ?? '';
  form.status = !!item.status;
  formError.value = '';
  closeDropdown();
}

async function loadUsers() {
  try {
    const response = await api.get('/users', {
      params: { companyId: user.companyId },
    });
    users.value = response.data;
  } catch (error) {
    users.value = [];
    errorMessage.value = error.response?.data?.message || 'Error al cargar los usuarios.';
    console.error('Error al cargar los usuarios:', error);
  }
}

async function loadTechnicians() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get(`/technicians/${user.companyId}`);
    technicians.value = response.data;
  } catch (error) {
    technicians.value = [];
    errorMessage.value = error.response?.data?.message || 'Error al cargar los técnicos.';
    console.error('Error al cargar los técnicos:', error);
  } finally {
    isLoading.value = false;
  }
}

function buildPayload() {
  return {
    userId: form.userId,
    phone: form.phone.trim(),
    status: form.status,
  };
}

async function saveTechnician() {
  formError.value = '';

  if (!form.userId) {
    formError.value = 'Selecciona un usuario.';
    return;
  }

  if (!form.phone.trim()) {
    formError.value = 'Ingresa el número de teléfono.';
    return;
  }

  isSaving.value = true;

  try {
    if (isEditing.value) {
      await api.put(`/technicians/${editingId.value}`, buildPayload());
    } else {
      await api.post('/technicians', buildPayload());
    }

    resetForm();
    await loadTechnicians();
  } catch (error) {
    const data = error.response?.data;
    formError.value = data?.errors
      ? Object.values(data.errors)[0]
      : data?.message || 'No se pudo guardar el técnico.';
    console.error('Error al guardar el técnico:', error);
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  loadUsers();
  loadTechnicians();
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <p class="mb-1 text-xs font-extrabold tracking-[0.2em] text-blue-600">
        {{ isEditing ? 'EDITAR TÉCNICO' : 'NUEVO TÉCNICO' }}
      </p>
      <h2 class="text-xl font-extrabold tracking-tight text-slate-900">
        {{ isEditing ? 'Editar técnico' : 'Confirmar técnico' }}
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ isEditing ? 'Actualiza el teléfono o el estado del técnico.' : 'Elige un usuario de tu empresa para registrarlo como técnico.' }}
      </p>

      <form class="mt-6 space-y-5" novalidate @submit.prevent="saveTechnician">
        <div>
          <label for="technicianUser" class="mb-2 block text-sm font-semibold text-slate-700">Usuario</label>

          <div ref="comboRef" class="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>

            <input
              id="technicianUser"
              ref="userInput"
              type="text"
              role="combobox"
              autocomplete="off"
              aria-autocomplete="list"
              aria-controls="technicianUserList"
              :aria-expanded="dropdownOpen"
              :aria-invalid="!!formError && !form.userId"
              :value="dropdownOpen ? userSearch : selectedLabel"
              :disabled="isEditing || isSaving"
              placeholder="Buscar por nombre o correo..."
              class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              @focus="openDropdown"
              @input="onUserInput"
              @keydown="onUserKeydown"
            />

            <button
              v-if="form.userId && !isEditing && !isSaving"
              type="button"
              class="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Quitar usuario seleccionado"
              @click="clearUser"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>

            <ul
              v-if="dropdownOpen"
              id="technicianUserList"
              role="listbox"
              class="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              <li
                v-for="(option, index) in filteredUserOptions"
                :key="option.id"
                role="option"
                :aria-selected="option.id === form.userId"
                class="cursor-pointer px-4 py-2.5 text-sm"
                :class="index === highlighted ? 'bg-blue-50' : 'hover:bg-slate-50'"
                @mousedown.prevent="selectUser(option)"
                @mouseenter="highlighted = index"
              >
                <p class="font-medium text-slate-900">{{ option.name }} {{ option.lastName }}</p>
                <p class="text-xs text-slate-500">{{ option.email }}</p>
              </li>

              <li v-if="filteredUserOptions.length === 0" class="px-4 py-3 text-sm text-slate-500">
                {{ availableUsers.length === 0 ? 'Todos los usuarios ya son técnicos.' : 'No se encontraron usuarios.' }}
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label for="technicianPhone" class="mb-2 block text-sm font-semibold text-slate-700">Teléfono</label>
          <input
            id="technicianPhone"
            v-model="form.phone"
            type="tel"
            inputmode="tel"
            maxlength="16"
            placeholder="8888 8888"
            :disabled="isSaving"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <fieldset>
          <legend class="mb-2 block text-sm font-semibold text-slate-700">Estado</legend>
          <div class="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <label
              class="cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold transition focus-within:ring-2 focus-within:ring-blue-500"
              :class="form.status ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              <input v-model="form.status" type="radio" name="technicianStatus" :value="true" class="sr-only" :disabled="isSaving" />
              Activo
            </label>
            <label
              class="cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold transition focus-within:ring-2 focus-within:ring-blue-500"
              :class="!form.status ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              <input v-model="form.status" type="radio" name="technicianStatus" :value="false" class="sr-only" :disabled="isSaving" />
              Inactivo
            </label>
          </div>
        </fieldset>

        <p v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ formError }}</p>

        <div class="flex flex-col gap-3">
          <button
            type="submit"
            :disabled="isSaving"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <svg v-if="!isEditing && !isSaving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar técnico' }}
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
        <h2 class="text-lg font-bold text-slate-900">Técnicos de la empresa</h2>
        <p class="text-sm text-slate-500">Administra los técnicos que atienden tus órdenes de trabajo.</p>
      </div>

      <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-6 py-4 md:flex-row md:items-center">
        <div class="relative flex-1">
          <label for="technicianSearch" class="sr-only">Buscar técnicos</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            id="technicianSearch"
            v-model="search"
            type="search"
            autocomplete="off"
            placeholder="Buscar por nombre, correo o teléfono..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div class="relative md:w-56">
          <label for="technicianStatusFilter" class="sr-only">Filtrar por estado</label>
          <select
            id="technicianStatusFilter"
            v-model="statusFilter"
            class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            :class="statusFilter ? 'text-slate-900' : 'text-slate-500'"
          >
            <option value="">Todos los estados</option>
            <option value="active" class="text-slate-900">Activos</option>
            <option value="inactive" class="text-slate-900">Inactivos</option>
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
        Cargando técnicos...
      </div>

      <div v-else-if="errorMessage" class="px-6 py-10" role="alert">
        <div class="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          <p>{{ errorMessage }}</p>
          <button type="button" class="shrink-0 font-bold underline hover:text-red-900" @click="loadTechnicians">
            Reintentar
          </button>
        </div>
      </div>

      <div v-else-if="!hasTechnicians" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">Esta empresa todavía no tiene técnicos</p>
        <p class="mt-1 text-sm text-slate-500">Confirma el primero con el formulario.</p>
      </div>

      <div v-else-if="filteredTechnicians.length === 0" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">No se encontraron técnicos</p>
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
                <th scope="col" class="px-6 py-3">Técnico</th>
                <th scope="col" class="px-6 py-3">Teléfono</th>
                <th scope="col" class="px-6 py-3">Estado</th>
                <th scope="col" class="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredTechnicians"
                :key="item.id"
                class="hover:bg-slate-50"
                :class="{ 'bg-blue-50/60': item.id === editingId }"
              >
                <td class="px-6 py-4 text-slate-600">{{ item.id }}</td>
                <td class="px-6 py-4">
                  <p class="font-medium text-slate-900">{{ technicianName(item) }}</p>
                  <p v-if="technicianEmail(item)" class="text-xs text-slate-500">{{ technicianEmail(item) }}</p>
                </td>
                <td class="px-6 py-4 text-slate-600">{{ item.phone || '—' }}</td>
                <td class="px-6 py-4">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="item.status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ item.status ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    :aria-label="`Editar al técnico ${technicianName(item)}`"
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
          Mostrando {{ filteredTechnicians.length }} de {{ technicians.length }} {{ technicians.length === 1 ? 'técnico' : 'técnicos' }}
        </p>
      </div>
    </section>
  </div>
</template>
