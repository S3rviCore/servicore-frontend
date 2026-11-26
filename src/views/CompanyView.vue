<script setup>
import { getUser } from '@/composables/useAuth';
import api from '@/services/api';
import { computed, onMounted, ref } from 'vue';

const user = getUser();
const company = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const logoFailed = ref(false);

const initials = computed(() => {
  const words = (company.value?.name || '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
});

const showLogo = computed(() => !!company.value?.logoUrl && !logoFailed.value);

async function loadCompany() {
  isLoading.value = true;
  errorMessage.value = '';
  logoFailed.value = false;

  try {
    const response = await api.get(`/companies/${user.companyId}`);
    company.value = response.data;
  } catch (error) {
    company.value = null;
    errorMessage.value = error.response?.data?.message || 'No se pudo cargar la compañía.';
    console.error('Error al cargar la compañía:', error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadCompany);
</script>

<template>
  <div v-if="isLoading" class="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm" role="status">
    Cargando información de la empresa...
  </div>

  <div v-else-if="errorMessage" class="rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm" role="alert">
    <div class="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
      <p>{{ errorMessage }}</p>
      <button type="button" class="shrink-0 font-bold underline hover:text-red-900" @click="loadCompany">
        Reintentar
      </button>
    </div>
  </div>

  <div v-else-if="company" class="space-y-6">
    <section class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="h-28 bg-gradient-to-br from-[#061633] via-[#0a2a5c] to-[#0c4385]" aria-hidden="true"></div>

      <div class="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:gap-6">
        <div class="-mt-12 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-blue-600 text-3xl font-extrabold text-white shadow-lg">
          <img
            v-if="showLogo"
            :src="company.logoUrl"
            :alt="`Logo de ${company.name}`"
            class="h-full w-full bg-white object-contain"
            @error="logoFailed = true"
          />
          <span v-else aria-hidden="true">{{ initials }}</span>
        </div>

        <div class="min-w-0 flex-1 sm:pb-1">
          <p class="text-xs font-extrabold tracking-[0.2em] text-blue-600">MI EMPRESA</p>
          <h2 class="truncate text-2xl font-extrabold tracking-tight text-slate-900">{{ company.name }}</h2>
          <p class="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
            {{ company.countryName || 'Sin país' }}
          </p>
        </div>
      </div>
    </section>

    <div class="grid items-start gap-6 lg:grid-cols-3">
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 class="text-lg font-bold text-slate-900">Acerca de la empresa</h3>
        <p v-if="company.description" class="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{{ company.description }}</p>
        <p v-else class="mt-3 text-sm text-slate-400">Esta empresa todavía no tiene una descripción.</p>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-lg font-bold text-slate-900">Datos de contacto</h3>

        <dl class="mt-4 space-y-5">
          <div class="flex items-start gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-bold uppercase tracking-wider text-slate-400">Correo</dt>
              <dd class="mt-0.5 break-words text-sm font-medium text-slate-900">
                <a :href="`mailto:${company.email}`" class="hover:text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{{ company.email }}</a>
              </dd>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-bold uppercase tracking-wider text-slate-400">País</dt>
              <dd class="mt-0.5 text-sm font-medium text-slate-900">{{ company.countryName || '—' }}</dd>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4"/></svg>
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-bold uppercase tracking-wider text-slate-400">Identificador</dt>
              <dd class="mt-0.5 text-sm font-medium text-slate-900">#{{ company.id }}</dd>
            </div>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>
