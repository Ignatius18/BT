/**
 * Работа с интерфейсом (показ/скрытие элементов, сообщения)
 */

function showTab(tab) {
    const isRegister = tab === 'register';
    const isLogin = tab === 'login';

    document.getElementById('tab-register').classList.toggle('active', isRegister);
    document.getElementById('tab-login').classList.toggle('active', isLogin);

    document.getElementById('register-form').style.display = isRegister ? 'block' : 'none';
    document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
    document.getElementById('profile').style.display = 'none';

    clearMessage();
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = 'message ' + type;
}

function clearMessage() {
    const message = document.getElementById('message');
    message.textContent = '';
    message.className = 'message';
}

function showProfile(username) {
    document.getElementById('profile-text').textContent = 'Вы вошли как: ' + username;
    document.getElementById('profile').style.display = 'block';

    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';

    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('tab-login').classList.remove('active');
}

function hideProfile() {
    document.getElementById('profile').style.display = 'none';
}

function getRegisterFormData() {
    return {
        username: document.getElementById('register-username').value.trim(),
        email: document.getElementById('register-email').value.trim(),
        password: document.getElementById('register-password').value
    };
}

function getLoginFormData() {
    return {
        username: document.getElementById('login-username').value.trim(),
        password: document.getElementById('login-password').value
    };
}

function clearRegisterForm() {
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
}

function clearLoginForm() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
}
