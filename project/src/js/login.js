import {loginUser, redirectIfAuthenticated, registerUser} from './auth.js';

redirectIfAuthenticated();

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');

function showPanel(panel) {
  if (panel === 'login') {
    loginPanel.hidden = false;
    registerPanel.hidden = true;
  } else {
    loginPanel.hidden = true;
    registerPanel.hidden = false;
  }
}

showRegisterBtn.addEventListener('click', () => showPanel('register'));
showLoginBtn.addEventListener('click', () => showPanel('login'));

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  loginError.textContent = '';

  const formData = new FormData(loginForm);
  const result = loginUser({
    username: String(formData.get('username') || ''),
    password: String(formData.get('password') || ''),
  });

  if (!result.ok) {
    loginError.textContent = result.message;
    return;
  }

  window.location.href = 'restaurants.html';
});

registerForm.addEventListener('submit', event => {
  event.preventDefault();
  registerError.textContent = '';
  registerSuccess.textContent = '';

  const formData = new FormData(registerForm);
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (password.length < 4) {
    registerError.textContent = 'Salasanassa tulee olla ainakin 4 merkkiä.';
    return;
  }

  if (password !== confirmPassword) {
    registerError.textContent = 'Salasanat eivät täsmää.';
    return;
  }

  const result = registerUser({
    username: String(formData.get('username') || ''),
    email: String(formData.get('email') || ''),
    password,
  });

  if (!result.ok) {
    registerError.textContent = result.message;
    return;
  }

  registerSuccess.textContent =
    'Rekisteröinti onnistui! Voit nyt kirjautua sisään.';
  registerForm.reset();
  showPanel('login');
});
