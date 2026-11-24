export function getUser() {
    try {
        return JSON.parse(sessionStorage.getItem('user'));
    } catch {
        return null;
    }
}

export function isAuthenticated() {
    return !!sessionStorage.getItem('accessToken');
}

export function hasRole(user, roles) {
    if (!roles || roles.length === 0) return true;
    return !!user && roles.includes(user.role);
}

export function clearSession() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
}
