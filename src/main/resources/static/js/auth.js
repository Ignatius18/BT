/**
 * Логика регистрации, входа и выхода
 */

async function submitRegister() {
    clearMessage();

    const { username, email, password } = getRegisterFormData();

    if (!username || !email || !password) {
        showMessage('Заполните все поля для регистрации.', 'error');
        return;
    }

    const result = await apiRegister(username, email, password);

    if (result.message) {
        showMessage(result.message, 'success');
        clearRegisterForm();
        showTab('login');
    } else {
        showMessage(result.error || 'Ошибка регистрации.', 'error');
    }
}

async function submitLogin() {
    clearMessage();

    const { username, password } = getLoginFormData();

    if (!username || !password) {
        showMessage('Заполните логин и пароль.', 'error');
        return;
    }

    const result = await apiLogin(username, password);

    if (result.message) {
        showMessage(result.message, 'success');
        showProfile(result.username);
    } else {
        showMessage(result.error || 'Ошибка входа.', 'error');
    }
}

async function logout() {
    await apiLogout();
    hideProfile();
    showTab('login');
    showMessage('Вы успешно вышли.', 'success');
}

async function checkSession() {
    const result = await apiCheckProfile();
    if (result && result.username) {
        showProfile(result.username);
    }
}

// Проверяем сессию при загрузке страницы
document.addEventListener('DOMContentLoaded', checkSession);
