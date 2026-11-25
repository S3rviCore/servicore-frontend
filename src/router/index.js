import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import { getUser, hasRole, isAuthenticated } from '@/composables/useAuth';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
        { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
        {
            path: '/',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                { path: '', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: 'Inicio' } },
                { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { title: 'Usuarios', roles: ['Administrador'] } },
                { path: 'roles', name: 'roles', component: () =>  import('@/views/RoleView.vue'), meta: { title: 'Roles', roles: ['Administrador'] } }
            ],
        },
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
});

router.beforeEach((to) => {
    const logged = isAuthenticated();

    if (to.meta.requiresAuth && !logged) {
        return { name: 'login' };
    }

    if (to.meta.guest && logged) {
        return { name: 'home' };
    }

    if (to.meta.roles && !hasRole(getUser(), to.meta.roles)) {
        return { name: 'home' };
    }
});

export default router;
