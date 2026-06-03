async function submitLogin() {
    const username = document.getElementById("login-username")?.value.trim();
    const password = document.getElementById("login-password")?.value.trim();

    if (!username || !password) {
        showError("Введите логин и пароль");
        return;
    }

    const res = await apiLogin(username, password);

    if (res?.error) return showError(res.error);

    updateAuthUI(res);
    if (typeof refreshFavoritesState === 'function') {
        await refreshFavoritesState();
    }
    navigateTo("/profile");
}

function validatePassword(password) {
    // Минимум 8 символов, хотя бы одна цифра, 
    // хотя бы один спецсимвол, заглавная и строчная буквы
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-={}\[\]:;"'<>?,./]).{8,}$/;
    return regex.test(password);
}

async function submitRegister() {
    const username = document.getElementById("register-username")?.value.trim();
    const email = document.getElementById("register-email")?.value.trim();
    const password = document.getElementById("register-password")?.value.trim();
    const recoveryKeyword = document.getElementById("register-recovery-keyword")?.value.trim();

    if (!validatePassword(password)) {
        showError("Пароль должен быть от 8 символов (цифры, спецсимволы, разные регистры).");
        return;
    }

    if (!username || !email || !password || !recoveryKeyword) {
        showError("Заполните все поля, включая ключевое слово для восстановления.");
        return;
    }
    
    const res = await apiRegister(username, email, password, recoveryKeyword);

    if (res?.error) return showError(res.error);

    showSuccess("Регистрация успешна");
    document.getElementById("register-form")?.reset();
    switchAuthMode("login");
}

async function submitRestore() {
    const usernameOrEmail = document.getElementById("restore-username-or-email")?.value.trim();
    const recoveryKeyword = document.getElementById("restore-keyword")?.value.trim();
    const password = document.getElementById("restore-password")?.value.trim();

    if (!usernameOrEmail || !recoveryKeyword || !password) {
        showError("Заполните все поля для восстановления.");
        return;
    }

    if (!validatePassword(password)) {
        showError("Пароль должен быть от 8 символов (цифры, спецсимволы, разные регистры).");
        return;
    }

    const res = await apiRecoverPassword(usernameOrEmail, recoveryKeyword, password);

    if (res?.error) return showError(res.error);

    showSuccess("Пароль успешно восстановлен. Войдите с новым паролем.");
    document.getElementById("restore-form")?.reset();
    switchAuthMode("login");
}

async function handleLogout() {
    await apiLogout();
    updateAuthUI(null);
    if (typeof clearFavoritesState === 'function') {
        await clearFavoritesState();
    }
    navigateTo("/");
}

async function checkSession() {
    const user = await apiCheckProfile();
    updateAuthUI(user);
}

function clearAuthForms() {
    document.getElementById("login-form")?.reset();
    document.getElementById("register-form")?.reset();
    document.getElementById("restore-form")?.reset();
    clearMessages();
}

function switchAuthMode(mode) {
    const login = document.getElementById("login-box");
    const register = document.getElementById("register-box");
    const restore = document.getElementById("restore-box");

    clearAuthForms();

    if (mode === "register") {
        if (login) login.style.display = "none";
        if (register) register.style.display = "block";
        if (restore) restore.style.display = "none";
    } else if (mode === "restore") {
        if (login) login.style.display = "none";
        if (register) register.style.display = "none";
        if (restore) restore.style.display = "block";
    } else {
        if (login) login.style.display = "block";
        if (register) register.style.display = "none";
        if (restore) restore.style.display = "none";
    }
}

function updateAuthUI(user) {
    console.log("Данные пользователя:", user);
    const auth = document.getElementById("nav-auth-link");
    const profile = document.getElementById("nav-profile-link");
    const admin = document.getElementById("nav-admin-link");

    if (user?.username) {
        if (auth) auth.style.display = "none";
        if (profile) profile.style.display = "inline";
        if (admin) admin.style.display = user.admin ? "inline" : "none";

        renderProfileInfo(user);
    } else {
        if (auth) auth.style.display = "inline";
        if (profile) profile.style.display = "none";
        if (admin) admin.style.display = "none";

        const box = document.getElementById("user-info-block");
        if (box) box.innerHTML = "<p>Пользователь не авторизован</p>";
    }
}

function renderProfileInfo(user) {
    const box = document.getElementById("user-info-block");
    if (!box || !user) return;

    box.innerHTML = `
        <p><b>Имя:</b> ${user.username}</p>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>Статус:</b> ${user.admin ? "Админ" : "Пользователь"}</p>
    `;
}

function showError(msg) {
    const box = document.getElementById("auth-error");
    if (!box) return;

    box.style.display = "block";
    box.style.background = "#fee2e2";
    box.style.color = "#b91c1c";
    box.textContent = msg;
} 

function showSuccess(msg) {
    const box = document.getElementById("auth-error");
    if (!box) return;

    box.style.display = "block";
    box.style.background = "#dcfce7";
    box.style.color = "#166534";
    box.textContent = msg;
}

function clearMessages() {
    const box = document.getElementById("auth-error");
    if (box) box.style.display = "none";
}
