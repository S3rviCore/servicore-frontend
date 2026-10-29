<script setup>
import api from '@/services/api';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const heroFailed = ref(false);

watch([email, password], () => {
    if (errorMessage.value) {
        errorMessage.value = '';
    }
});

async function handleLogin() {
    errorMessage.value = '';

    if (!email.value.trim() || !password.value) {
        errorMessage.value = 'Ingresa tu correo y contraseña.';
        return;
    }

    isLoading.value = true;

    try {
        const response = await api.post('/auth/login', {
            email: email.value.trim(),
            password: password.value,
        });

        const data = response.data;

        sessionStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('user', JSON.stringify({
            userId: data.userId,
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
        }));

        if (data.mustChangePassword) {
            errorMessage.value = 'Debes cambiar tu contraseña antes de continuar.';
            return;
        }

        await router.push('/');
    } catch (error) {
        if (error.response?.status === 401) {
            errorMessage.value = 'Correo o contraseña incorrectos.';
        } else if (error.response?.status === 403) {
            errorMessage.value = 'Tu cuenta está desactivada o no tienes permiso.';
        } else {
            errorMessage.value = 'No se pudo conectar con el servidor. Inténtalo nuevamente.';
        }

        console.error('Error de inicio de sesión:', error);
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <main class="min-h-screen bg-slate-50 font-sans text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <section class="relative isolate hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#061633] via-[#0a2a5c] to-[#0c4385] p-10 text-white lg:flex xl:p-14">
            <img
                v-if="!heroFailed"
                src="/src/images/login-hero.png"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-30 mix-blend-luminosity"
                @error="heroFailed = true"
            />
            <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-[#061633] via-[#0a2a5c]/70 to-[#0c4385]/60"></div>
            <div aria-hidden="true" class="pointer-events-none absolute -left-24 -top-28 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
            <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 left-10 -z-10 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"></div>
            <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:44px_44px]"></div>

            <svg aria-hidden="true" class="pointer-events-none absolute inset-y-0 -right-px z-10 h-full w-32 fill-slate-50 xl:w-44" viewBox="0 0 100 1000" preserveAspectRatio="none">
                <path d="M100 0L52 0C18 190 98 340 86 520C74 700 6 840 28 1000L100 1000Z"/>
            </svg>

            <RouterLink to="/" class="relative z-10 inline-flex w-fit items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40" aria-label="ServiCore, inicio">
                <svg class="h-12 w-12 shrink-0" viewBox="0 0 64 64" role="img" aria-label="Logo ServiCore">
                    <path d="M32 3 56 17 56 28 32 14 19 21 43 35 43 45 32 52 8 38 8 27 32 41 45 34 21 20 21 10Z" fill="currentColor"/>
                    <path d="M8 27 8 38 32 52 32 61 2 44 2 22 32 5 32 14Z" fill="#39B8FF"/>
                    <path d="M32 3 62 20 62 42 32 59 32 48 52 37 52 25 32 14Z" fill="#0877F9"/>
                </svg>
                <span class="text-3xl font-extrabold tracking-tight">Servi<span class="text-sky-400">Core</span></span>
            </RouterLink>

            <div class="relative z-10 my-10 max-w-xl pr-10 xl:pr-16">
                <span class="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-white/5 px-4 py-2 text-sm font-medium text-sky-100 backdrop-blur">
                    <span class="relative flex h-2 w-2">
                        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60 motion-reduce:animate-none"></span>
                        <span class="relative inline-flex h-2 w-2 rounded-full bg-sky-400"></span>
                    </span>
                    Gestión de servicios técnicos
                </span>

                <h1 class="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl 2xl:text-6xl">
                    Tus servicios técnicos,
                    <span class="mt-1 block bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">bajo control.</span>
                </h1>

                <p class="mt-6 max-w-lg text-base leading-7 text-blue-100/80 xl:text-lg">
                    Organiza tus órdenes de trabajo, coordina a tus técnicos y administra tus operaciones desde una sola plataforma.
                </p>

                <ul class="mt-9 space-y-5">
                    <li class="flex items-start gap-4">
                        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-sky-300 backdrop-blur">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M3 17 9 11 13 14 21 5M15 5h6v6"/></svg>
                        </span>
                        <div>
                            <h2 class="font-semibold text-white">Control operativo</h2>
                            <p class="mt-0.5 max-w-sm text-sm leading-6 text-blue-100/70">Consulta el estado de las órdenes y da seguimiento a cada trabajo.</p>
                        </div>
                    </li>

                    <li class="flex items-start gap-4">
                        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-sky-300 backdrop-blur">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2ZM17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg>
                        </span>
                        <div>
                            <h2 class="font-semibold text-white">Coordinación de técnicos</h2>
                            <p class="mt-0.5 max-w-sm text-sm leading-6 text-blue-100/70">Asigna y gestiona a tu equipo de manera simple y eficiente.</p>
                        </div>
                    </li>

                    <li class="flex items-start gap-4">
                        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-sky-300 backdrop-blur">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                        </span>
                        <div>
                            <h2 class="font-semibold text-white">Información centralizada</h2>
                            <p class="mt-0.5 max-w-sm text-sm leading-6 text-blue-100/70">Mantén los datos de tu empresa organizados en un solo lugar.</p>
                        </div>
                    </li>
                </ul>
            </div>

            <footer class="relative z-10 pr-10 text-sm text-blue-100/60 xl:pr-16">
                ServiCore · Gestión inteligente de servicios
            </footer>
        </section>

        <section class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 px-5 py-12 sm:px-8 sm:py-16">
            <div aria-hidden="true" class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl"></div>
            <div aria-hidden="true" class="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl"></div>

            <div class="relative w-full max-w-lg rounded-3xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_80px_-28px_rgba(22,65,130,0.28)] backdrop-blur-xl sm:p-12">
                <RouterLink to="/" class="mb-10 flex flex-col items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25" aria-label="ServiCore, inicio">
                    <svg class="h-12 w-12" viewBox="0 0 64 64" aria-hidden="true">
                        <path d="M32 3 56 17 56 28 32 14 19 21 43 35 43 45 32 52 8 38 8 27 32 41 45 34 21 20 21 10Z" fill="#102c59"/>
                        <path d="M8 27 8 38 32 52 32 61 2 44 2 22 32 5 32 14Z" fill="#39B8FF"/>
                        <path d="M32 3 62 20 62 42 32 59 32 48 52 37 52 25 32 14Z" fill="#0877F9"/>
                    </svg>
                    <span class="text-2xl font-extrabold tracking-tight text-[#102c59]">Servi<span class="text-blue-600">Core</span></span>
                </RouterLink>

                <header class="mb-12 text-center">
                    <p class="mb-3 text-xs font-extrabold tracking-[0.2em] text-blue-600">BIENVENIDO DE NUEVO</p>
                    <h2 class="text-3xl font-extrabold tracking-tight text-slate-900">Inicia sesión</h2>
                    <p class="mx-auto mt-4 max-w-sm text-sm leading-7 text-slate-500">Accede a tu espacio de trabajo y continúa gestionando los servicios de tu empresa.</p>
                </header>

                <form @submit.prevent="handleLogin" class="space-y-9" novalidate :aria-busy="isLoading">
                    <div>
                        <label for="email" class="mb-3.5 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
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
                            autofocus
                            placeholder="nombre@empresa.com"
                            required
                            :disabled="isLoading"
                            :aria-invalid="!!errorMessage"
                            :aria-describedby="errorMessage ? 'login-error' : undefined"
                            class="w-full rounded-xl border bg-white px-5 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                            :class="errorMessage ? 'border-red-300' : 'border-slate-200'"
                        />
                    </div>

                    <div>
                        <label for="password" class="mb-3.5 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-[18px] w-[18px] text-slate-500" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                            Contraseña
                        </label>
                        <div class="relative">
                            <input
                                id="password"
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                name="password"
                                autocomplete="current-password"
                                placeholder="Ingresa tu contraseña"
                                required
                                :disabled="isLoading"
                                :aria-invalid="!!errorMessage"
                                :aria-describedby="errorMessage ? 'login-error' : undefined"
                                class="w-full rounded-xl border bg-white py-4 pl-5 pr-16 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                :class="errorMessage ? 'border-red-300' : 'border-slate-200'"
                            />
                            <button
                                type="button"
                                @click="showPassword = !showPassword"
                                :disabled="isLoading"
                                :aria-pressed="showPassword"
                                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                                class="absolute inset-y-2 right-2 grid w-11 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed"
                            >
                                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A10.7 10.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.7 7.7A16.6 16.6 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.3-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
                            </button>
                        </div>
                    </div>

                    <div v-if="errorMessage" id="login-error" role="alert" aria-live="polite" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium leading-6 text-red-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/></svg>
                        <p>{{ errorMessage }}</p>
                    </div>

                    <button
                        type="submit"
                        :disabled="isLoading"
                        class="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-600/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                        <svg v-if="isLoading" viewBox="0 0 24 24" fill="none" class="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".25" stroke-width="3"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>
                        {{ isLoading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
                    </button>
                </form>

                <div class="my-10 flex items-center gap-4 text-[0.68rem] font-bold tracking-[0.14em] text-slate-400">
                    <span class="h-px flex-1 bg-slate-200"></span>
                    <span>¿NUEVO EN SERVICORE?</span>
                    <span class="h-px flex-1 bg-slate-200"></span>
                </div>

                <p class="text-center text-sm leading-7 text-slate-500">
                    ¿Tu empresa aún no tiene una cuenta?
                    <RouterLink to="/registro" class="ml-1 inline-flex items-center gap-1 rounded font-bold text-blue-600 transition hover:text-blue-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        Regístrate
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
                    </RouterLink>
                </p>

                <div class="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                    Acceso protegido a tu espacio de trabajo
                </div>
            </div>
        </section>
    </main>
</template>