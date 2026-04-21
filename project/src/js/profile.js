import {getCurrentUser, logout, requireAuth} from './auth.js';

const user = requireAuth();

if (user) {
  const usernameEl = document.getElementById('profileUsername');
  const emailEl = document.getElementById('profileEmail');
  const favRestaurantEl = document.getElementById('profileFavouriteRestaurant');
  const heroNameEl = document.getElementById('profileHeroName');

  usernameEl.textContent = user.username;
  heroNameEl.textContent = user.username;
  emailEl.textContent = user.email || '-';
  favRestaurantEl.textContent = user.favouriteRestaurant || '-';
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    logout();
    window.location.href = 'login.html';
  });
}

const backBtn = document.getElementById('backBtn');
if (backBtn && !getCurrentUser()) {
  backBtn.href = 'login.html';
}
