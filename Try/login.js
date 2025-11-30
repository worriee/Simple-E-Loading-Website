document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // this is just a sample.
        if (username === 'admin' && password === 'admin') {
            sessionStorage.setItem('isAdmin', 'true');
            window.location.href = './index.html';
        } else {
            errorMessage.textContent = 'Invalid username or password';
        }
    });
});
