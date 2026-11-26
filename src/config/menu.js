const icons = {
    dashboard: 'M3 12 12 3l9 9M5 10v10h5v-6h4v6h5V10',
    orders: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2ZM9 12h6M9 16h4',
    customers: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    technicians: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z',
    tools: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
    materials: 'm21 8-9-5-9 5v8l9 5 9-5V8ZM3.3 7 12 12l8.7-5M12 22V12',
    payments: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7ZM2 10h20M6 15h4',
    users: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
    roles: 'm12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z',
    company: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4',
};

export const menu = [
    {
        title: 'General',
        items: [
            { label: 'Inicio', to: '/', icon: icons.dashboard },
            { label: 'Órdenes de trabajo', to: '/work-orders', icon: icons.orders, roles: ['Administrador', 'Tecnico'] },
            { label: 'Clientes', to: '/customers', icon: icons.customers, roles: ['Administrador'] },
        ],
    },
    {
        title: 'Operación',
        items: [
            { label: 'Técnicos', to: '/technicians', icon: icons.technicians, roles: ['Administrador'] },
            { label: 'Especialidades', to: '/specialities', icon: icons.technicians, roles: ['Administrador'] },
            { label: 'Herramientas', to: '/tools', icon: icons.tools, roles: ['Administrador'] },
            { label: 'Materiales', to: '/materials', icon: icons.materials, roles: ['Administrador'] },
            { label: 'Pagos', to: '/payments', icon: icons.payments, roles: ['Administrador'] },
        ],
    },
    {
        title: 'Administración',
        items: [
            { label: 'Usuarios', to: '/users', icon: icons.users, roles: ['Administrador'] },
            { label: 'Roles', to: '/roles', icon: icons.roles, roles: ['Administrador'] },
            { label: 'Mi empresa', to: '/company', icon: icons.company, roles: ['Administrador'] },
        ],
    },
];
