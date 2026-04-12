/**
 * API-запросы к backend
 */

async function apiRegister(username, email, password) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        return await response.json();
    } catch (error) {
        console.error('ApiRegister error:', error);
        return { error: 'Ошибка сети' };
    }
}

async function apiLogin(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await response.json();
    } catch (error) {
        console.error('ApiLogin error:', error);
        return { error: 'Ошибка сети' };
    }
}

async function apiCheckProfile() {
    try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('ApiCheckProfile error:', error);
        return null;
    }
}

async function apiLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        return true;
    } catch (error) {
        console.error('ApiLogout error:', error);
        return false;
    }
}
