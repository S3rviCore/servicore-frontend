<script setup>
import { getUser } from '@/composables/useAuth';
import api from '@/services/api';
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';

const user = getUser();
const units = ref([]);
const materials = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const formError = ref('');
const search = ref('');
const unitFilter = ref('');
const stockFilter = ref('');
const form = reactive({ name: '', description: '', unitId: '', stock: '' });

const unitSearch = ref('');
const dropdownOpen = ref(false);
const highlighted = ref(0);
const comboRef = ref(null);
const unitInput = ref(null);

const hasMaterials = computed(() => materials.value.length > 0);
const hasFilters = computed(
  () => search.value.trim() !== '' || unitFilter.value !== '' || stockFilter.value !== ''
);

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function unitLabel(unit) {
  if (!unit) return '';
  const short = unit.abbreviation ?? unit.symbol;
  return short ? `${unit.name} (${short})` : unit.name;
}

function unitOf(item) {
  return units.value.find((u) => u.id === item.unitId);
}

function materialUnit(item) {
  return item.unitName ?? unitOf(item)?.name ?? '—';
}

const selectedUnit = computed(() => units.value.find((u) => u.id === form.unitId) || null);
const selectedLabel = computed(() => unitLabel(selectedUnit.value));

const filteredUnitOptions = computed(() => {
  const term = normalize(unitSearch.value.trim());
  if (!term) return units.value;
  return units.value.filter((u) => normalize(unitLabel(u)).includes(term));
});

const filteredMaterials = computed(() => {
  const term = normalize(search.value.trim());

  return materials.value.filter((item) => {
    const matchesUnit = !unitFilter.value || item.unitId === unitFilter.value;

    const matchesStock =
      !stockFilter.value ||
      (stockFilter.value === 'with' && Number(item.stock) > 0) ||
      (stockFilter.value === 'without' && Number(item.stock) <= 0);

    const matchesSearch =
      !term ||
      normalize(item.name).includes(term) ||
      normalize(item.description).includes(term) ||
      normalize(materialUnit(item)).includes(term) ||
      String(item.id).includes(term);

    return matchesUnit && matchesStock && matchesSearch;
  });
});

function clearFilters() {
  search.value = '';
  unitFilter.value = '';
  stockFilter.value = '';
}

function openDropdown() {
  if (isSaving.value) return;
  dropdownOpen.value = true;
  highlighted.value = 0;
}

function closeDropdown() {
  dropdownOpen.value = false;
  unitSearch.value = '';
}

function onUnitInput(event) {
  unitSearch.value = event.target.value;
  dropdownOpen.value = true;
  highlighted.value = 0;
}

function selectUnit(unit) {
  form.unitId = unit.id;
  formError.value = '';
  closeDropdown();
}

function clearUnit() {
  form.unitId = '';
  nextTick(() => unitInput.value?.focus());
}

function onUnitKeydown(event) {
  const options = filteredUnitOptions.value;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (!dropdownOpen.value) return openDropdown();
    highlighted.value = Math.min(highlighted.value + 1, options.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlighted.value = Math.max(highlighted.value - 1, 0);
  } else if (event.key === 'Enter' && dropdownOpen.value) {
    event.preventDefault();
    if (options[highlighted.value]) selectUnit(options[highlighted.value]);
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
  form.name = '';
  form.description = '';
  form.unitId = '';
  form.stock = '';
  formError.value = '';
  closeDropdown();
}

async function loadUnits() {
  try {
    const response = await api.get('/units');
    units.value = response.data;
  } catch (error) {
    units.value = [];
    errorMessage.value = error.response?.data?.message || 'Error al cargar las unidades.';
    console.error('Error al cargar las unidades:', error);
  }
}

async function loadMaterials() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get(`/materials/${user.companyId}`);
    materials.value = response.data;
  } catch (error) {
    materials.value = [];
    errorMessage.value = error.response?.data?.message || 'Error al cargar los materiales.';
    console.error('Error al cargar los materiales:', error);
  } finally {
    isLoading.value = false;
  }
}

function buildPayload() {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    unitId: form.unitId,
    companyId: user.companyId,
    stock: Number(form.stock),
  };
}

async function saveMaterial() {
  formError.value = '';

  if (!form.name.trim()) {
    formError.value = 'El nombre del material es requerido.';
    return;
  }

  if (!form.unitId) {
    formError.value = 'La unidad es requerida.';
    return;
  }

  if (form.stock === '' || form.stock === null || Number.isNaN(Number(form.stock)) || Number(form.stock) < 0) {
    formError.value = 'Ingresa un stock válido (0 o mayor).';
    return;
  }

  isSaving.value = true;

  try {
    await api.post('/materials', buildPayload());

    resetForm();
    await loadMaterials();
  } catch (error) {
    const data = error.response?.data;
    formError.value = data?.errors
      ? Object.values(data.errors)[0]
      : data?.message || 'No se pudo guardar el material.';
    console.error('Error al guardar el material:', error);
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  loadUnits();
  loadMaterials();
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <p class="mb-1 text-xs font-extrabold tracking-[0.2em] text-blue-600">NUEVO MATERIAL</p>
      <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Agregar material</h2>
      <p class="mt-1 text-sm text-slate-500">Registra un material de tu inventario.</p>

      <form class="mt-6 space-y-5" novalidate @submit.prevent="saveMaterial">
        <div>
          <label for="materialName" class="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
          <input
            id="materialName"
            v-model="form.name"
            type="text"
            maxlength="100"
            placeholder="Cable eléctrico calibre 12"
            :disabled="isSaving"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between gap-3">
            <label for="materialDescription" class="text-sm font-semibold text-slate-700">Descripción</label>
            <span class="text-xs font-medium text-slate-400">Opcional · {{ form.description.length }}/255</span>
          </div>
          <textarea
            id="materialDescription"
            v-model="form.description"
            rows="3"
            maxlength="255"
            placeholder="Rollo de 100 metros, color negro"
            :disabled="isSaving"
            class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          ></textarea>
        </div>

        <div>
          <label for="materialUnit" class="mb-2 block text-sm font-semibold text-slate-700">Unidad de medida</label>

          <div ref="comboRef" class="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>

            <input
              id="materialUnit"
              ref="unitInput"
              type="text"
              role="combobox"
              autocomplete="off"
              aria-autocomplete="list"
              aria-controls="materialUnitList"
              :aria-expanded="dropdownOpen"
              :value="dropdownOpen ? unitSearch : selectedLabel"
              :disabled="isSaving"
              placeholder="Buscar unidad..."
              class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              @focus="openDropdown"
              @input="onUnitInput"
              @keydown="onUnitKeydown"
            />

            <button
              v-if="form.unitId && !isSaving"
              type="button"
              class="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Quitar unidad seleccionada"
              @click="clearUnit"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>

            <ul
              v-if="dropdownOpen"
              id="materialUnitList"
              role="listbox"
              class="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              <li
                v-for="(option, index) in filteredUnitOptions"
                :key="option.id"
                role="option"
                :aria-selected="option.id === form.unitId"
                class="cursor-pointer px-4 py-2.5 text-sm text-slate-900"
                :class="index === highlighted ? 'bg-blue-50' : 'hover:bg-slate-50'"
                @mousedown.prevent="selectUnit(option)"
                @mouseenter="highlighted = index"
              >
                {{ unitLabel(option) }}
              </li>

              <li v-if="filteredUnitOptions.length === 0" class="px-4 py-3 text-sm text-slate-500">
                {{ units.length === 0 ? 'No hay unidades disponibles.' : 'No se encontraron unidades.' }}
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label for="materialStock" class="mb-2 block text-sm font-semibold text-slate-700">Stock</label>
          <input
            id="materialStock"
            v-model="form.stock"
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            placeholder="0"
            :disabled="isSaving"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <p v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ formError }}</p>

        <button
          type="submit"
          :disabled="isSaving"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <svg v-if="!isSaving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="h-4 w-4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          {{ isSaving ? 'Guardando...' : 'Guardar material' }}
        </button>
      </form>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-5">
        <h2 class="text-lg font-bold text-slate-900">Materiales de la empresa</h2>
        <p class="text-sm text-slate-500">Administra el inventario de materiales de tu empresa.</p>
      </div>

      <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-6 py-4 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <label for="materialSearch" class="sr-only">Buscar materiales</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            id="materialSearch"
            v-model="search"
            type="search"
            autocomplete="off"
            placeholder="Buscar por nombre, descripción o unidad..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div class="relative lg:w-48">
          <label for="materialUnitFilter" class="sr-only">Filtrar por unidad</label>
          <select
            id="materialUnitFilter"
            v-model="unitFilter"
            class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            :class="unitFilter ? 'text-slate-900' : 'text-slate-500'"
          >
            <option value="">Todas las unidades</option>
            <option v-for="unit in units" :key="unit.id" :value="unit.id" class="text-slate-900">{{ unit.name }}</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </div>

        <div class="relative lg:w-44">
          <label for="materialStockFilter" class="sr-only">Filtrar por stock</label>
          <select
            id="materialStockFilter"
            v-model="stockFilter"
            class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            :class="stockFilter ? 'text-slate-900' : 'text-slate-500'"
          >
            <option value="">Todo el stock</option>
            <option value="with" class="text-slate-900">Con stock</option>
            <option value="without" class="text-slate-900">Sin stock</option>
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
        Cargando materiales...
      </div>

      <div v-else-if="errorMessage" class="px-6 py-10" role="alert">
        <div class="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          <p>{{ errorMessage }}</p>
          <button type="button" class="shrink-0 font-bold underline hover:text-red-900" @click="loadMaterials">
            Reintentar
          </button>
        </div>
      </div>

      <div v-else-if="!hasMaterials" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">Esta empresa todavía no tiene materiales</p>
        <p class="mt-1 text-sm text-slate-500">Registra el primero con el formulario.</p>
      </div>

      <div v-else-if="filteredMaterials.length === 0" class="px-6 py-16 text-center">
        <p class="text-base font-semibold text-slate-700">No se encontraron materiales</p>
        <p class="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o cambia los filtros.</p>
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
                <th scope="col" class="px-6 py-3">Material</th>
                <th scope="col" class="px-6 py-3">Unidad</th>
                <th scope="col" class="px-6 py-3">Stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in filteredMaterials"
                :key="item.id"
                class="hover:bg-slate-50"
              >
                <td class="px-6 py-4 text-slate-600">{{ item.id }}</td>
                <td class="px-6 py-4">
                  <p class="font-medium text-slate-900">{{ item.name }}</p>
                  <p v-if="item.description" class="max-w-xs truncate text-xs text-slate-500">{{ item.description }}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{{ materialUnit(item) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="Number(item.stock) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                  >
                    {{ item.stock ?? 0 }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="border-t border-slate-100 px-6 py-3 text-xs text-slate-500" role="status">
          Mostrando {{ filteredMaterials.length }} de {{ materials.length }} {{ materials.length === 1 ? 'material' : 'materiales' }}
        </p>
      </div>
    </section>
  </div>
</template>
