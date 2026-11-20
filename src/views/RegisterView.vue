<script setup>
import api from '@/services/api';
import heroImage from '@/images/login-hero.png';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import router from '@/router';
//import { useRouter } from 'vue-router';

//const router = useRouter();
const name = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const companyName = ref('');
const companyDescription = ref('');
const companyEmail = ref('');
const countryId = ref('');
const departamentId = ref('');
const municipality = ref('');
const countries = ref([]);
const departaments = ref([]);
const municipalities = ref([]);
const loadingCountries = ref(false);
const loadingDepartaments = ref(false);
const loadingMunicipalities = ref(false);
const errorMessage = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const heroFailed = ref(false);
const step = ref(1);
const fieldErrors = reactive({});
const formRef = ref(null);
const nameInput = ref(null);
const companyNameInput = ref(null);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordScore = computed(() => {
    const value = password.value;
    if (!value) return 0;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
});

const passwordLabel = computed(() => {
    return ['', 'Débil', 'Regular', 'Buena', 'Muy segura'][passwordScore.value];
});

const passwordColor = computed(() => {
    return ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-sky-500', 'bg-emerald-500'][passwordScore.value];
});

const passwordsMatch = computed(() => {
    return passwordConfirmation.value.length > 0 && password.value === passwordConfirmation.value;
});

const passwordsDiffer = computed(() => {
    return passwordConfirmation.value.length > 0 && password.value !== passwordConfirmation.value;
});

const stepAnnouncement = computed(() => {
    return step.value === 1
        ? 'Paso 1 de 2: crea tu cuenta de administrador.'
        : 'Paso 2 de 2: registra los datos de tu empresa.';
});

async function loadCountries() {
    loadingCountries.value = true;
    try {
        const response = await api.get('/countries');
        countries.value = response.data;
    } catch (error) {
        countries.value = [];
        errorMessage.value = 'No se pudieron cargar las ubicaciones. Inténtalo nuevamente.';
        console.error('Error al cargar países:', error);
    } finally {
        loadingCountries.value = false;
    }
}

async function loadDepartaments(id) {
    loadingDepartaments.value = true;
    try {
        const response = await api.get(`/countries/${id}/departaments`);
        departaments.value = response.data;
    } catch (error) {
        departaments.value = [];
        errorMessage.value = 'No se pudieron cargar los departamentos. Inténtalo nuevamente.';
        console.error('Error al cargar departamentos:', error);
    } finally {
        loadingDepartaments.value = false;
    }
}

async function loadMunicipalities(id) {
    loadingMunicipalities.value = true;
    try {
        const response = await api.get(`/departaments/${id}/municipalities`);
        municipalities.value = response.data;
    } catch (error) {
        municipalities.value = [];
        errorMessage.value = 'No se pudieron cargar los municipios. Inténtalo nuevamente.';
        console.error('Error al cargar municipios:', error);
    } finally {
        loadingMunicipalities.value = false;
    }
}

watch(countryId, (value) => {
    departamentId.value = '';
    municipality.value = '';
    departaments.value = [];
    municipalities.value = [];
    fieldErrors.countryId = '';
    if (value) {
        loadDepartaments(value);
    }
});

watch(departamentId, (value) => {
    municipality.value = '';
    municipalities.value = [];
    fieldErrors.departamentId = '';
    if (value) {
        loadMunicipalities(value);
    }
});

watch(municipality, () => {
    fieldErrors.municipality = '';
});

watch(password, () => {
    if (fieldErrors.passwordConfirmation) {
        fieldErrors.passwordConfirmation = '';
    }
});

onMounted(loadCountries);

function clearError(field) {
    fieldErrors[field] = '';
    errorMessage.value = '';
}

function inputClass(field) {
    return fieldErrors[field] ? 'border-red-300' : 'border-slate-200';
}

async function focusFirstInvalid() {
    await nextTick();
    formRef.value?.querySelector('[aria-invalid="true"]')?.focus();
}

function validateStep1() {
    fieldErrors.name = name.value.trim() ? '' : 'Ingresa tu nombre.';
    fieldErrors.lastName = lastName.value.trim() ? '' : 'Ingresa tu apellido.';

    if (!email.value.trim()) {
        fieldErrors.email = 'Ingresa tu correo.';
    } else if (!emailPattern.test(email.value.trim())) {
        fieldErrors.email = 'Escribe un correo válido.';
    } else {
        fieldErrors.email = '';
    }

    if (!password.value) {
        fieldErrors.password = 'Crea una contraseña.';
    } else if (password.value.length < 8) {
        fieldErrors.password = 'Debe tener al menos 8 caracteres.';
    } else {
        fieldErrors.password = '';
    }

    if (!passwordConfirmation.value) {
        fieldErrors.passwordConfirmation = 'Confirma tu contraseña.';
    } else if (password.value !== passwordConfirmation.value) {
        fieldErrors.passwordConfirmation = 'Las contraseñas no coinciden.';
    } else {
        fieldErrors.passwordConfirmation = '';
    }

    return !fieldErrors.name
        && !fieldErrors.lastName
        && !fieldErrors.email
        && !fieldErrors.password
        && !fieldErrors.passwordConfirmation;
}

function validateStep2() {
    fieldErrors.companyName = companyName.value.trim() ? '' : 'Ingresa el nombre de la empresa.';

    if (!companyEmail.value.trim()) {
        fieldErrors.companyEmail = 'Ingresa el correo de la empresa.';
    } else if (!emailPattern.test(companyEmail.value.trim())) {
        fieldErrors.companyEmail = 'Escribe un correo válido.';
    } else {
        fieldErrors.companyEmail = '';
    }

    fieldErrors.countryId = countryId.value ? '' : 'Selecciona un país.';
    fieldErrors.departamentId = departamentId.value ? '' : 'Selecciona un departamento.';
    fieldErrors.municipality = municipality.value ? '' : 'Selecciona un municipio.';

    return !fieldErrors.companyName
        && !fieldErrors.companyEmail
        && !fieldErrors.countryId
        && !fieldErrors.departamentId
        && !fieldErrors.municipality;
}

async function goToStep(target) {
    errorMessage.value = '';
    step.value = target;
    await nextTick();
    if (target === 1) {
        nameInput.value?.focus();
    } else {
        companyNameInput.value?.focus();
    }
}

function useAdminEmail() {
    companyEmail.value = email.value.trim();
    fieldErrors.companyEmail = '';
}

async function handleSubmit() {
    if (step.value === 1) {
        if (validateStep1()) {
            await goToStep(2);
        } else {
            await focusFirstInvalid();
        }
        return;
    }

    if (!validateStep1()) {
        await goToStep(1);
        await focusFirstInvalid();
        return;
    }

    if (!validateStep2()) {
        await focusFirstInvalid();
        return;
    }

    await handleRegister();
}

async function handleRegister() {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      await api.post('/auth/register', {
        name: name.value.trim(),
        lastName: lastName.value.trim(),
        email: email.value.trim(),
        password: password.value,
        companyName: companyName.value.trim(),
        companyDescription: companyDescription.value.trim(),
        companyEmail: companyEmail.value.trim(),
        countryId: countryId.value,
        departamentId: departamentId.value,
        municipalityId: municipality.value,
      });

      await router.push('/login');
    } catch (error) {
      if (error.response?.status === 409) {
            fieldErrors.email = 'Este correo ya está registrado.';
            await goToStep(1);
            await focusFirstInvalid();
        } else if (error.response?.status === 400) {
            errorMessage.value = 'Revisa los datos ingresados e inténtalo nuevamente.';
        } else {
            errorMessage.value = 'No se pudo completar el registro. Inténtalo nuevamente.';
        }
        console.error('Error de registro:', error);
    } finally {
      isLoading.value = false;
    }
}
</script>

<template>
    <main class="min-h-screen bg-slate-50 font-sans text-slate-900 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
        <section class="relative isolate hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#061633] via-[#0a2a5c] to-[#0c4385] p-10 text-white lg:flex xl:p-12">
            <img
                v-if="!heroFailed"
                :src="heroImage"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-30 mix-blend-luminosity"
                @error="heroFailed = true"
            />
            <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-[#061633] via-[#0a2a5c]/70 to-[#0c4385]/60"></div>
            <div aria-hidden="true" class="pointer-events-none absolute -left-24 -top-28 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
            <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 left-10 -z-10 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"></div>
            <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:44px_44px]"></div>

            <svg aria-hidden="true" class="pointer-events-none absolute inset-y-0 -right-px z-10 h-full w-28 fill-slate-50 xl:w-36" viewBox="0 0 100 1000" preserveAspectRatio="none">
                <path d="M100 0L52 0C18 190 98 340 86 520C74 700 6 840 28 1000L100 1000Z"/>
            </svg>

            <RouterLink to="/" class="relative z-10 inline-flex w-fit items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40" aria-label="ServiCore, inicio">
                <svg class="h-11 w-11 shrink-0" viewBox="0 0 64 64" role="img" aria-label="Logo ServiCore">
                    <path d="M32 3 56 17 56 28 32 14 19 21 43 35 43 45 32 52 8 38 8 27 32 41 45 34 21 20 21 10Z" fill="currentColor"/>
                    <path d="M8 27 8 38 32 52 32 61 2 44 2 22 32 5 32 14Z" fill="#39B8FF"/>
                    <path d="M32 3 62 20 62 42 32 59 32 48 52 37 52 25 32 14Z" fill="#0877F9"/>
                </svg>
                <span class="text-3xl font-extrabold tracking-tight">Servi<span class="text-sky-400">Core</span></span>
            </RouterLink>

            <div class="relative z-10 my-8 max-w-xl pr-8 xl:pr-12">
                <span class="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-white/5 px-4 py-2 text-sm font-medium text-sky-100 backdrop-blur">
                    <span class="relative flex h-2 w-2">
                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60 motion-reduce:animate-none"></span>
                        <span class="relative inline-flex h-2 w-2 rounded-full bg-sky-400"></span>
                    </span>
                    Registro de empresas
                </span>

                <h1 class="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
                    Organiza tu empresa,
                    <span class="mt-1 block bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">desde hoy.</span>
                </h1>

                <p class="mt-5 max-w-lg text-base leading-7 text-blue-100/80">
                    Crea tu cuenta de administrador, registra tu empresa y empieza a llevar el control de tus servicios técnicos en un solo lugar.
                </p>

                <ol class="mt-8 space-y-5">
                    <li class="flex items-start gap-4">
                        <span
                            class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-base font-bold backdrop-blur transition"
                            :class="step === 1 ? 'border-sky-300/60 bg-sky-400/20 text-white' : 'border-white/10 bg-white/[0.08] text-sky-300'"
                        >
                            <svg v-if="step > 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>
                            <span v-else>1</span>
                        </span>
                        <div>
                            <h2 class="font-semibold text-white">Crea tu cuenta de administrador</h2>
                            <p class="mt-0.5 max-w-sm text-sm leading-6 text-blue-100/70">Serás quien gestione la empresa, los técnicos y las órdenes de trabajo.</p>
                        </div>
                    </li>

                    <li class="flex items-start gap-4">
                        <span
                            class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-base font-bold backdrop-blur transition"
                            :class="step === 2 ? 'border-sky-300/60 bg-sky-400/20 text-white' : 'border-white/10 bg-white/[0.08] text-sky-300'"
                        >
                            2
                        </span>
                        <div>
                            <h2 class="font-semibold text-white">Registra los datos de tu empresa</h2>
                            <p class="mt-0.5 max-w-sm text-sm leading-6 text-blue-100/70">Nombre, descripción, correo y ubicación para identificar tu negocio.</p>
                        </div>
                    </li>

                    <li class="flex items-start gap-4">
                        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-sky-300 backdrop-blur">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                        </span>
                        <div>
                            <h2 class="font-semibold text-white">Empieza a trabajar</h2>
                            <p class="mt-0.5 max-w-sm text-sm leading-6 text-blue-100/70">Accede a tu espacio y organiza tus servicios técnicos al instante.</p>
                        </div>
                    </li>
                </ol>
            </div>

            <footer class="relative z-10 pr-8 text-sm text-blue-100/60 xl:pr-12">
                ServiCore · Gestión inteligente de servicios
            </footer>
        </section>

        <section class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-6 sm:px-8">
            <div aria-hidden="true" class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl"></div>
            <div aria-hidden="true" class="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl"></div>

            <div class="relative w-full max-w-3xl rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(22,65,130,0.28)] backdrop-blur-xl sm:px-10 sm:py-8">
                <p class="sr-only" role="status" aria-live="polite">{{ stepAnnouncement }}</p>

                <RouterLink to="/" class="mb-6 flex flex-col items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 lg:hidden" aria-label="ServiCore, inicio">
                    <svg class="h-12 w-12" viewBox="0 0 64 64" aria-hidden="true">
                        <path d="M32 3 56 17 56 28 32 14 19 21 43 35 43 45 32 52 8 38 8 27 32 41 45 34 21 20 21 10Z" fill="#102c59"/>
                        <path d="M8 27 8 38 32 52 32 61 2 44 2 22 32 5 32 14Z" fill="#39B8FF"/>
                        <path d="M32 3 62 20 62 42 32 59 32 48 52 37 52 25 32 14Z" fill="#0877F9"/>
                    </svg>
                    <span class="text-2xl font-extrabold tracking-tight text-[#102c59]">Servi<span class="text-blue-600">Core</span></span>
                </RouterLink>

                <nav aria-label="Progreso del registro" class="mb-5">
                    <ol class="flex items-center">
                        <li class="flex items-center gap-3">
                            <span
                                class="grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition"
                                :class="step > 1 ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white ring-4 ring-blue-500/20'"
                                :aria-current="step === 1 ? 'step' : undefined"
                            >
                                <svg v-if="step > 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>
                                <span v-else>1</span>
                            </span>
                            <span class="text-sm font-semibold" :class="step === 1 ? 'text-slate-900' : 'text-slate-500'">Tu cuenta</span>
                        </li>

                        <li aria-hidden="true" class="mx-4 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <span class="block h-full rounded-full bg-blue-600 transition-all duration-500 motion-reduce:transition-none" :class="step === 2 ? 'w-full' : 'w-0'"></span>
                        </li>

                        <li class="flex items-center gap-3">
                            <span
                                class="grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition"
                                :class="step === 2 ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-100 text-slate-400'"
                                :aria-current="step === 2 ? 'step' : undefined"
                            >
                                2
                            </span>
                            <span class="text-sm font-semibold" :class="step === 2 ? 'text-slate-900' : 'text-slate-400'">Tu empresa</span>
                        </li>
                    </ol>
                </nav>

                <header class="mb-5 text-center">
                    <p class="mb-1.5 text-xs font-extrabold tracking-[0.2em] text-blue-600">PASO {{ step }} DE 2</p>
                    <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        {{ step === 1 ? 'Crea tu cuenta' : 'Registra tu empresa' }}
                    </h2>
                    <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        {{ step === 1
                            ? 'Estos datos serán los del administrador principal de tu empresa.'
                            : 'Cuéntanos sobre tu negocio para dejar tu espacio de trabajo listo.' }}
                    </p>
                </header>

                <form ref="formRef" @submit.prevent="handleSubmit" class="space-y-4" novalidate :aria-busy="isLoading">
                    <template v-if="step === 1">
                        <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label for="name" class="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                                <input
                                    id="name"
                                    ref="nameInput"
                                    v-model="name"
                                    type="text"
                                    name="name"
                                    autocomplete="given-name"
                                    autofocus
                                    placeholder="Leonte"
                                    required
                                    :disabled="isLoading"
                                    :aria-invalid="!!fieldErrors.name"
                                    :aria-describedby="fieldErrors.name ? 'name-error' : undefined"
                                    class="w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    :class="inputClass('name')"
                                    @input="clearError('name')"
                                />
                                <p v-if="fieldErrors.name" id="name-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.name }}</p>
                            </div>

                            <div>
                                <label for="lastName" class="mb-2 block text-sm font-semibold text-slate-700">Apellido</label>
                                <input
                                    id="lastName"
                                    v-model="lastName"
                                    type="text"
                                    name="lastName"
                                    autocomplete="family-name"
                                    placeholder="Canales"
                                    required
                                    :disabled="isLoading"
                                    :aria-invalid="!!fieldErrors.lastName"
                                    :aria-describedby="fieldErrors.lastName ? 'lastName-error' : undefined"
                                    class="w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    :class="inputClass('lastName')"
                                    @input="clearError('lastName')"
                                />
                                <p v-if="fieldErrors.lastName" id="lastName-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.lastName }}</p>
                            </div>
                        </div>

                        <div>
                            <label for="email" class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] text-slate-500" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                v-model="email"
                                type="email"
                                name="email"
                                autocomplete="username"
                                inputmode="email"
                                autocapitalize="none"
                                spellcheck="false"
                                placeholder="nombre@empresa.com"
                                required
                                :disabled="isLoading"
                                :aria-invalid="!!fieldErrors.email"
                                :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
                                class="w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                :class="inputClass('email')"
                                @input="clearError('email')"
                            />
                            <p v-if="fieldErrors.email" id="email-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.email }}</p>
                        </div>

                        <div class="grid items-start gap-4 sm:grid-cols-2">
                            <div>
                                <label for="password" class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] text-slate-500" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                                    Contraseña
                                </label>
                                <div class="relative">
                                    <input
                                        id="password"
                                        v-model="password"
                                        :type="showPassword ? 'text' : 'password'"
                                        name="password"
                                        autocomplete="new-password"
                                        placeholder="Mínimo 8 caracteres"
                                        required
                                        :disabled="isLoading"
                                        :aria-invalid="!!fieldErrors.password"
                                        :aria-describedby="fieldErrors.password ? 'password-error password-help' : 'password-help'"
                                        class="w-full rounded-xl border bg-white py-3 pl-4 pr-14 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                        :class="inputClass('password')"
                                        @input="clearError('password')"
                                    />
                                    <button
                                        type="button"
                                        @click="showPassword = !showPassword"
                                        :disabled="isLoading"
                                        :aria-pressed="showPassword"
                                        :aria-label="showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'"
                                        class="absolute inset-y-1.5 right-1.5 grid w-10 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed"
                                    >
                                        <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10.7 10.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.7 7.7A16.6 16.6 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.3-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
                                    </button>
                                </div>

                                <p v-if="fieldErrors.password" id="password-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.password }}</p>

                                <div id="password-help" class="mt-2.5" aria-live="polite">
                                    <div class="flex gap-1.5" aria-hidden="true">
                                        <span
                                            v-for="n in 4"
                                            :key="n"
                                            class="h-1.5 flex-1 rounded-full transition-colors"
                                            :class="n <= passwordScore ? passwordColor : 'bg-slate-200'"
                                        ></span>
                                    </div>
                                    <p class="mt-1.5 text-xs text-slate-500">
                                        <span v-if="password" class="font-semibold text-slate-700">{{ passwordLabel }}.</span>
                                        Usa mayúsculas, números y símbolos.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label for="passwordConfirmation" class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] text-slate-500" aria-hidden="true"><path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                                    Confirmar contraseña
                                </label>
                                <input
                                    id="passwordConfirmation"
                                    v-model="passwordConfirmation"
                                    :type="showPassword ? 'text' : 'password'"
                                    name="passwordConfirmation"
                                    autocomplete="new-password"
                                    placeholder="Repite tu contraseña"
                                    required
                                    :disabled="isLoading"
                                    :aria-invalid="!!fieldErrors.passwordConfirmation"
                                    :aria-describedby="fieldErrors.passwordConfirmation ? 'passwordConfirmation-error' : 'passwordConfirmation-help'"
                                    class="w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    :class="[inputClass('passwordConfirmation'), passwordsMatch ? 'border-emerald-300' : '']"
                                    @input="clearError('passwordConfirmation')"
                                />
                                <p v-if="fieldErrors.passwordConfirmation" id="passwordConfirmation-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.passwordConfirmation }}</p>
                                <p v-else id="passwordConfirmation-help" class="mt-1.5 flex items-center gap-1.5 text-xs" :class="passwordsMatch ? 'font-medium text-emerald-600' : passwordsDiffer ? 'text-amber-600' : 'text-slate-400'" aria-live="polite">
                                    <template v-if="passwordsMatch">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>
                                        Las contraseñas coinciden.
                                    </template>
                                    <template v-else-if="passwordsDiffer">Las contraseñas aún no coinciden.</template>
                                    <template v-else>Escríbela de nuevo para evitar errores.</template>
                                </p>
                            </div>
                        </div>
                    </template>

                    <template v-else>
                        <div class="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                            <div class="flex min-w-0 items-center gap-3">
                                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white" aria-hidden="true">
                                    {{ (name.trim()[0] || '') + (lastName.trim()[0] || '') }}
                                </span>
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-semibold text-slate-900">{{ name }} {{ lastName }}</p>
                                    <p class="truncate text-xs text-slate-500">{{ email }} · Administrador</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                @click="goToStep(1)"
                                :disabled="isLoading"
                                class="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-blue-600 transition hover:text-blue-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Editar
                            </button>
                        </div>

                        <div class="grid items-start gap-4 sm:grid-cols-2">
                            <div>
                                <label for="companyName" class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] text-slate-500" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4"/></svg>
                                    Nombre de la empresa
                                </label>
                                <input
                                    id="companyName"
                                    ref="companyNameInput"
                                    v-model="companyName"
                                    type="text"
                                    name="companyName"
                                    autocomplete="organization"
                                    placeholder="Tecnonica"
                                    required
                                    :disabled="isLoading"
                                    :aria-invalid="!!fieldErrors.companyName"
                                    :aria-describedby="fieldErrors.companyName ? 'companyName-error' : undefined"
                                    class="w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    :class="inputClass('companyName')"
                                    @input="clearError('companyName')"
                                />
                                <p v-if="fieldErrors.companyName" id="companyName-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.companyName }}</p>
                            </div>

                            <div>
                                <div class="mb-2 flex items-center justify-between gap-3">
                                    <label for="companyEmail" class="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] text-slate-500" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>
                                        Correo de la empresa
                                    </label>
                                    <button
                                        type="button"
                                        @click="useAdminEmail"
                                        :disabled="isLoading"
                                        class="rounded text-xs font-bold text-blue-600 transition hover:text-blue-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Usar mi correo
                                    </button>
                                </div>
                                <input
                                    id="companyEmail"
                                    v-model="companyEmail"
                                    type="email"
                                    name="companyEmail"
                                    inputmode="email"
                                    autocapitalize="none"
                                    spellcheck="false"
                                    placeholder="contacto@tuempresa.com"
                                    required
                                    :disabled="isLoading"
                                    :aria-invalid="!!fieldErrors.companyEmail"
                                    :aria-describedby="fieldErrors.companyEmail ? 'companyEmail-error' : undefined"
                                    class="w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    :class="inputClass('companyEmail')"
                                    @input="clearError('companyEmail')"
                                />
                                <p v-if="fieldErrors.companyEmail" id="companyEmail-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.companyEmail }}</p>
                            </div>
                        </div>

                        <div>
                            <div class="mb-2 flex items-center justify-between gap-3">
                                <label for="companyDescription" class="text-sm font-semibold text-slate-700">Descripción de la empresa</label>
                                <span class="text-xs font-medium text-slate-400">Opcional · {{ companyDescription.length }}/250</span>
                            </div>
                            <textarea
                                id="companyDescription"
                                v-model="companyDescription"
                                name="companyDescription"
                                rows="2"
                                maxlength="250"
                                placeholder="Tienda de tecnología con servicio técnico a domicilio"
                                :disabled="isLoading"
                                class="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                            ></textarea>
                        </div>

                        <fieldset class="space-y-3">
                            <legend class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] text-blue-600" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                                Ubicación de la empresa
                            </legend>

                            <div class="grid items-start gap-4 sm:grid-cols-3">
                                <div>
                                    <label for="countryId" class="mb-2 block text-sm font-semibold text-slate-700">País</label>
                                    <div class="relative">
                                        <select
                                            id="countryId"
                                            v-model="countryId"
                                            name="countryId"
                                            required
                                            :disabled="isLoading || loadingCountries"
                                            :aria-invalid="!!fieldErrors.countryId"
                                            :aria-describedby="fieldErrors.countryId ? 'countryId-error' : undefined"
                                            class="w-full appearance-none rounded-xl border bg-white py-3 pl-4 pr-10 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                            :class="[inputClass('countryId'), countryId ? 'text-slate-900' : 'text-slate-400']"
                                        >
                                            <option value="" disabled>{{ loadingCountries ? 'Cargando...' : 'Selecciona' }}</option>
                                            <option v-for="country in countries" :key="country.id" :value="country.id" class="text-slate-900">{{ country.name }}</option>
                                        </select>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                    <p v-if="fieldErrors.countryId" id="countryId-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.countryId }}</p>
                                </div>

                                <div>
                                    <label for="departamentId" class="mb-2 block text-sm font-semibold text-slate-700">Departamento</label>
                                    <div class="relative">
                                        <select
                                            id="departamentId"
                                            v-model="departamentId"
                                            name="departamentId"
                                            required
                                            :disabled="isLoading || !countryId || loadingDepartaments"
                                            :aria-invalid="!!fieldErrors.departamentId"
                                            :aria-describedby="fieldErrors.departamentId ? 'departamentId-error' : 'departamentId-help'"
                                            class="w-full appearance-none rounded-xl border bg-white py-3 pl-4 pr-10 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                            :class="[inputClass('departamentId'), departamentId ? 'text-slate-900' : 'text-slate-400']"
                                        >
                                            <option value="" disabled>{{ loadingDepartaments ? 'Cargando...' : 'Selecciona' }}</option>
                                            <option v-for="departament in departaments" :key="departament.id" :value="departament.id" class="text-slate-900">{{ departament.name }}</option>
                                        </select>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                    <p v-if="fieldErrors.departamentId" id="departamentId-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.departamentId }}</p>
                                    <p v-else-if="!countryId" id="departamentId-help" class="mt-1.5 text-xs text-slate-400">Elige primero un país.</p>
                                </div>

                                <div>
                                    <label for="municipality" class="mb-2 block text-sm font-semibold text-slate-700">Municipio</label>
                                    <div class="relative">
                                        <select
                                            id="municipality"
                                            v-model="municipality"
                                            name="municipality"
                                            required
                                            :disabled="isLoading || !departamentId || loadingMunicipalities"
                                            :aria-invalid="!!fieldErrors.municipality"
                                            :aria-describedby="fieldErrors.municipality ? 'municipality-error' : 'municipality-help'"
                                            class="w-full appearance-none rounded-xl border bg-white py-3 pl-4 pr-10 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                            :class="[inputClass('municipality'), municipality ? 'text-slate-900' : 'text-slate-400']"
                                        >
                                            <option value="" disabled>{{ loadingMunicipalities ? 'Cargando...' : 'Selecciona' }}</option>
                                            <option v-for="item in municipalities" :key="item.id" :value="item.id" class="text-slate-900">{{ item.name }}</option>
                                        </select>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                    <p v-if="fieldErrors.municipality" id="municipality-error" class="mt-1.5 text-xs font-medium text-red-600">{{ fieldErrors.municipality }}</p>
                                    <p v-else-if="!departamentId" id="municipality-help" class="mt-1.5 text-xs text-slate-400">Elige primero un departamento.</p>
                                </div>
                            </div>
                        </fieldset>
                    </template>

                    <div v-if="errorMessage" id="register-error" role="alert" aria-live="polite" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></svg>
                        <p>{{ errorMessage }}</p>
                    </div>

                    <div class="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                        <button
                            v-if="step === 2"
                            type="button"
                            @click="goToStep(1)"
                            :disabled="isLoading"
                            class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>
                            Atrás
                        </button>

                        <button
                            type="submit"
                            :disabled="isLoading"
                            class="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-600/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        >
                            <svg v-if="isLoading" viewBox="0 0 24 24" fill="none" class="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
                            <template v-if="step === 1">
                                Continuar
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
                            </template>
                            <template v-else>
                                {{ isLoading ? 'Creando cuenta...' : 'Crear cuenta y empresa' }}
                            </template>
                        </button>
                    </div>
                </form>

                <div class="mt-5 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-4 text-sm text-slate-500 sm:flex-row">
                    <p>
                        ¿Tu empresa ya está registrada?
                        <RouterLink to="/login" class="ml-1 inline-flex items-center gap-1 rounded font-bold text-blue-600 transition hover:text-blue-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            Inicia sesión
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
                        </RouterLink>
                    </p>

                    <p class="flex items-center gap-2 text-xs text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                        Tus datos están protegidos
                    </p>
                </div>
            </div>
        </section>
    </main>
</template>
