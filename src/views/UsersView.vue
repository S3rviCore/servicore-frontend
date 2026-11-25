<script setup>
import api from '@/services/api';
import { computed, onMounted, ref, reactive } from 'vue';
import { getUser } from '@/composables/useAuth';

const user = getUser();
const users = ref([]);
const roles = ref([]);
const modalIsOpen = ref(false);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const formError = ref('');
const createdUser = ref(null);
const copied = ref(false);
const editingId = ref(null);
const search = ref('');
const roleFilter = ref('');
const form = reactive({ name: '', lastName: '', email: '', roleId: '' });

const isEditing = computed(() => editingId.value !== null);
const hasUsers = computed(() => users.value.length > 0);
const hasFilters = computed(() => search.value.trim() !== '' || roleFilter.value !== '');

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const filteredUsers = computed(() => {
  const term = normalize(search.value.trim());

  return users.value.filter((item) => {
    const matchesRole = !roleFilter.value || item.roleId === roleFilter.value;
    const matchesSearch =
      !term ||
      normalize(`${item.name} ${item.lastName}`).includes(term) ||
      normalize(item.email).includes(term) ||
      String(item.id).includes(term);

    return matchesRole && matchesSearch;
  });
});

function clearFilters() {
  search.value = '';
  roleFilter.value = '';
}

function resetForm() {
  form.name = '';
  form.lastName = '';
  form.email = '';
  form.roleId = '';
  formError.value = '';
}

function openCreate() {
  editingId.value = null;
  resetForm();
  modalIsOpen.value = true;
}

function openEdit(item) {
  editingId.value = item.id;
  form.name = item.name;
  form.lastName = item.lastName;
  form.email = item.email;
  form.roleId = item.roleId;
  formError.value = '';
  modalIsOpen.value = true;
}

function closeModal() {
  modalIsOpen.value = false;
  createdUser.value = null;
  copied.value = false;
  editingId.value = null;
  resetForm();
}

async function loadRoles() {
  try {
    const response = await api.get('/roles', {
      params: { companyId: user.companyId },
    });
    roles.value = response.data;
  } catch (error) {
    roles.value = [];
    console.error('Error al cargar roles:', error);
  }
}

async function loadUsers() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get('/users', {
      params: { companyId: user.companyId },
    });
    users.value = response.data;
  } catch (error) {
    users.value = [];
    errorMessage.value = error.response?.data?.message || 'No se pudieron cargar los usuarios.';
    console.error('Error al cargar usuarios:', error);
  } finally {
    isLoading.value = false;
  }
}

function buildPayload() {
  return {
    name: form.name.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    roleId: form.roleId,
  };
}

function showFormError(error, fallback) {
  const data = error.response?.data;
  formError.value = data?.errors
    ? Object.values(data.errors)[0]
    : data?.message || fallback;
}

async function createUser() {
  const response = await api.post('/users', buildPayload(), {
    params: { companyId: user.companyId },
  });

  createdUser.value = response.data;
  resetForm();
  await loadUsers();
}

async function updateUser() {
  await api.put(`/users/${editingId.value}`, buildPayload(), {
    params: { companyId: user.companyId },
  });

  closeModal();
  await loadUsers();
}

async function saveUser() {
  formError.value = '';

  if (!form.name.trim() || !form.lastName.trim() || !form.email.trim() || !form.roleId) {
    formError.value = 'Completa todos los campos.';
    return;
  }

  isSaving.value = true;

  try {
    if (isEditing.value) {
      await updateUser();
    } else {
      await createUser();
    }
  } catch (error) {
    showFormError(error, isEditing.value ? 'No se pudo actualizar el usuario.' : 'No se pudo crear el usuario.');
    console.error('Error al guardar usuario:', error);
  } finally {
    isSaving.value = false;
  }
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(createdUser.value.temporaryPassword);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (error) {
    console.error('No se pudo copiar:', error);
  }
}

onMounted(() => {
  loadRoles();
  loadUsers();
});
</script>

<template>
    <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h2 class="text-lg font-bold text-slate-900">Usuarios de la empresa</h2>
                <p class="text-sm text-slate-500">Administra quién tiene acceso a tu espacio de trabajo.</p>
            </div>

            <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                @click="openCreate"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                Nuevo usuario
            </button>
        </div>

        <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-6 py-4 md:flex-row md:items-center">
            <div class="relative flex-1">
                <label for="search" class="sr-only">Buscar usuarios</label>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input
                    id="search"
                    v-model="search"
                    type="search"
                    autocomplete="off"
                    placeholder="Buscar por nombre, correo o id..."
                    class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
            </div>

            <div class="relative md:w-56">
                <label for="roleFilter" class="sr-only">Filtrar por rol</label>
                <select
                    id="roleFilter"
                    v-model="roleFilter"
                    class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    :class="roleFilter ? 'text-slate-900' : 'text-slate-500'"
                >
                    <option value="">Todos los roles</option>
                    <option v-for="role in roles" :key="role.id" :value="role.id" class="text-slate-900">{{ role.name }}</option>
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
            Cargando usuarios...
        </div>

        <div v-else-if="errorMessage" class="px-6 py-10" role="alert">
            <div class="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                <p>{{ errorMessage }}</p>
                <button type="button" class="shrink-0 font-bold underline hover:text-red-900" @click="loadUsers">
                    Reintentar
                </button>
            </div>
        </div>

        <div v-else-if="!hasUsers" class="px-6 py-16 text-center">
            <p class="text-base font-semibold text-slate-700">Esta empresa todavía no tiene usuarios</p>
            <p class="mt-1 text-sm text-slate-500">Cuando agregues usuarios, aparecerán en esta tabla.</p>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="px-6 py-16 text-center">
            <p class="text-base font-semibold text-slate-700">No se encontraron usuarios</p>
            <p class="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o cambia el rol seleccionado.</p>
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
                            <th scope="col" class="px-6 py-3">Correo</th>
                            <th scope="col" class="px-6 py-3">Rol</th>
                            <th scope="col" class="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="item in filteredUsers" :key="item.id" class="hover:bg-slate-50">
                            <td class="px-6 py-4 text-slate-600">{{ item.id }}</td>
                            <td class="px-6 py-4 font-medium text-slate-900">{{ item.name }} {{ item.lastName }}</td>
                            <td class="px-6 py-4 text-slate-600">{{ item.email }}</td>
                            <td class="px-6 py-4">
                                <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                    {{ item.roleName }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button
                                    type="button"
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    :aria-label="`Editar a ${item.name} ${item.lastName}`"
                                    @click="openEdit(item)"
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
                Mostrando {{ filteredUsers.length }} de {{ users.length }} usuarios
            </p>
        </div>
    </section>

    <Teleport to="body">
        <div
            v-if="modalIsOpen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            @click.self="closeModal"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                class="w-full max-w-lg rounded-3xl border border-white/80 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(22,65,130,0.4)] sm:p-8"
            >
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p class="mb-1 text-xs font-extrabold tracking-[0.2em] text-blue-600">
                            {{ createdUser ? 'USUARIO CREADO' : isEditing ? 'EDITAR USUARIO' : 'NUEVO USUARIO' }}
                        </p>
                        <h2 id="modal-title" class="text-2xl font-extrabold tracking-tight text-slate-900">
                            {{ createdUser ? 'Entrega la contraseña' : isEditing ? 'Editar usuario' : 'Agregar usuario' }}
                        </h2>
                        <p v-if="!createdUser" class="mt-1 text-sm text-slate-500">
                            {{ isEditing ? 'Actualiza los datos del usuario.' : 'Completa los datos para dar acceso a tu empresa.' }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Cerrar"
                        @click="closeModal"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
                    </button>
                </div>

                <form v-if="!createdUser" class="space-y-5" novalidate @submit.prevent="saveUser">
                    <div class="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label for="newName" class="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                            <input
                                id="newName"
                                v-model="form.name"
                                type="text"
                                placeholder="Alexander"
                                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            />
                        </div>

                        <div>
                            <label for="newLastName" class="mb-2 block text-sm font-semibold text-slate-700">Apellido</label>
                            <input
                                id="newLastName"
                                v-model="form.lastName"
                                type="text"
                                placeholder="Canales"
                                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            />
                        </div>
                    </div>

                    <div>
                        <label for="newEmail" class="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label>
                        <input
                            id="newEmail"
                            v-model="form.email"
                            type="email"
                            inputmode="email"
                            autocapitalize="none"
                            spellcheck="false"
                            placeholder="alexander@gmail.com"
                            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                    </div>

                    <div>
                        <label for="newRole" class="mb-2 block text-sm font-semibold text-slate-700">Rol</label>
                        <div class="relative">
                            <select
                                id="newRole"
                                v-model="form.roleId"
                                class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                :class="form.roleId ? 'text-slate-900' : 'text-slate-400'"
                            >
                                <option value="" disabled>Selecciona un rol</option>
                                <option v-for="role in roles" :key="role.id" :value="role.id" class="text-slate-900">{{ role.name }}</option>
                            </select>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>

                    <p v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ formError }}</p>

                    <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                            @click="closeModal"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            :disabled="isSaving"
                            class="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        >
                            {{ isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar usuario' }}
                        </button>
                    </div>
                </form>

                <div v-else class="space-y-5">
                    <div class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>
                        <p>
                            Usuario <span class="font-bold">{{ createdUser.name }} {{ createdUser.lastName }}</span> creado correctamente.
                        </p>
                    </div>

                    <div>
                        <p class="mb-2 text-sm font-semibold text-slate-700">Contraseña temporal</p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 select-all break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-base text-slate-900">{{ createdUser.temporaryPassword }}</code>
                            <button
                                type="button"
                                class="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                                @click="copyPassword"
                            >
                                {{ copied ? '¡Copiada!' : 'Copiar' }}
                            </button>
                        </div>
                        <p class="mt-2 text-xs text-amber-600" role="status">Cópiala ahora: por seguridad no se volverá a mostrar.</p>
                    </div>

                    <div class="flex justify-end pt-2">
                        <button
                            type="button"
                            class="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
                            @click="closeModal"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
