<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { menu } from '@/config/menu';
import { clearSession, getUser, hasRole } from '@/composables/useAuth';

const route = useRoute();
const router = useRouter();
const user = getUser();
const sidebarOpen = ref(false);

const groups = computed(() => {
    return menu
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => hasRole(user, item.roles)),
        }))
        .filter((group) => group.items.length > 0);
});

const initials = computed(() => {
    return ((user?.name?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase();
});

const pageTitle = computed(() => route.meta.title || 'ServiCore');

function handleLogout() {
    clearSession();
    router.push('/login');
}

function handleKeydown(event) {
    if (event.key === 'Escape') {
        sidebarOpen.value = false;
    }
}

watch(() => route.fullPath, () => {
    sidebarOpen.value = false;
});

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
        <div
            v-if="sidebarOpen"
            class="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
            @click="sidebarOpen = false"
        ></div>

        <aside
            id="sidebar"
            class="fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col bg-gradient-to-b from-[#061633] via-[#0a2a5c] to-[#0c4385] text-white transition-transform duration-300 motion-reduce:transition-none lg:translate-x-0"
            :class="{ 'translate-x-0': sidebarOpen }"
        >
            <div class="flex items-center justify-between px-6 py-6">
                <RouterLink to="/" class="inline-flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40" aria-label="ServiCore, inicio">
                    <svg class="h-10 w-10 shrink-0" viewBox="0 0 64 64" aria-hidden="true">
                        <path d="M32 3 56 17 56 28 32 14 19 21 43 35 43 45 32 52 8 38 8 27 32 41 45 34 21 20 21 10Z" fill="currentColor"/>
                        <path d="M8 27 8 38 32 52 32 61 2 44 2 22 32 5 32 14Z" fill="#39B8FF"/>
                        <path d="M32 3 62 20 62 42 32 59 32 48 52 37 52 25 32 14Z" fill="#0877F9"/>
                    </svg>
                    <span class="text-2xl font-extrabold tracking-tight">Servi<span class="text-sky-400">Core</span></span>
                </RouterLink>

                <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-lg text-blue-100/80 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:hidden"
                    aria-label="Cerrar menú"
                    @click="sidebarOpen = false"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
                </button>
            </div>

            <nav aria-label="Menú principal" class="flex-1 overflow-y-auto px-4 pb-4">
                <div v-for="group in groups" :key="group.title" class="mb-6">
                    <p class="mb-2 px-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-200/50">{{ group.title }}</p>
                    <ul class="space-y-1">
                        <li v-for="item in group.items" :key="item.to">
                            <RouterLink
                                :to="item.to"
                                class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-100/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                                active-class="bg-white/10 text-white"
                                exact-active-class="!bg-sky-400/20 !text-white"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 shrink-0 text-sky-300" aria-hidden="true"><path :d="item.icon"/></svg>
                                {{ item.label }}
                            </RouterLink>
                        </li>
                    </ul>
                </div>
            </nav>

            <div class="border-t border-white/10 p-4">
                <div class="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold" aria-hidden="true">{{ initials }}</span>
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold">{{ user?.name }} {{ user?.lastName }}</p>
                        <p class="truncate text-xs text-blue-100/60">{{ user?.role }}</p>
                    </div>
                    <button
                        type="button"
                        class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-blue-100/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                        @click="handleLogout"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    </button>
                </div>
            </div>
        </aside>

        <div class="lg:pl-72">
            <header class="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-8">
                <button
                    type="button"
                    class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 lg:hidden"
                    aria-label="Abrir menú"
                    aria-controls="sidebar"
                    :aria-expanded="sidebarOpen"
                    @click="sidebarOpen = true"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-5 w-5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>

                <h1 class="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{{ pageTitle }}</h1>
            </header>

            <main class="p-4 sm:p-8">
                <RouterView />
            </main>
        </div>
    </div>
</template>
