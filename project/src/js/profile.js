import {
  getCurrentUser,
  logout,
  requireAuth,
  setUserAvatar,
  updateUserProfile,
} from './auth.js';

const user = requireAuth();

if (user) {
  const usernameEl = document.getElementById('profileUsername');
  const emailEl = document.getElementById('profileEmail');
  const heroNameEl = document.getElementById('profileHeroName');
  const avatarImg = document.getElementById('profileAvatar');
  const avatarInput = document.getElementById('avatarInput');
  const profileForm = document.getElementById('profileForm');
  const showEditBtn = document.getElementById('showEditBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editUsername = document.getElementById('editUsername');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const profileMessage = document.getElementById('profileMessage');

  function setEditMode(isEditing) {
    if (!profileForm) {
      return;
    }

    profileForm.classList.toggle('is-hidden', !isEditing);
    if (showEditBtn) {
      showEditBtn.classList.toggle('is-hidden', isEditing);
    }
  }

  usernameEl.textContent = user.username;
  heroNameEl.textContent = user.username;
  emailEl.textContent = user.email || '-';

  if (editUsername) {
    editUsername.value = user.username || '';
  }

  if (editEmail) {
    editEmail.value = user.email || '';
  }

  setEditMode(false);

  if (avatarImg) {
    avatarImg.src = user.avatar || '../../img/picture8.jpg';
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const avatarDataUrl = String(reader.result || '');
        setUserAvatar(avatarDataUrl);
        if (avatarImg) {
          avatarImg.src = avatarDataUrl;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', event => {
      event.preventDefault();

      const result = updateUserProfile({
        username: editUsername?.value,
        email: editEmail?.value,
        password: editPassword?.value,
      });

      if (!result.ok) {
        if (profileMessage) {
          profileMessage.textContent = result.message;
          profileMessage.classList.add('error');
        }
        return;
      }

      const updatedUser = result.user;
      usernameEl.textContent = updatedUser.username;
      heroNameEl.textContent = updatedUser.username;
      emailEl.textContent = updatedUser.email || '-';

      if (editPassword) {
        editPassword.value = '';
      }

      if (profileMessage) {
        profileMessage.textContent = 'Tiedot päivitetty.';
        profileMessage.classList.remove('error');
      }
    });
  }

  if (showEditBtn) {
    showEditBtn.addEventListener('click', () => {
      if (editUsername) {
        editUsername.value = usernameEl.textContent || '';
      }
      if (editEmail) {
        editEmail.value =
          emailEl.textContent === '-' ? '' : emailEl.textContent;
      }
      if (editPassword) {
        editPassword.value = '';
      }
      if (profileMessage) {
        profileMessage.textContent = '';
        profileMessage.classList.remove('error');
      }
      setEditMode(true);
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      if (profileMessage) {
        profileMessage.textContent = '';
        profileMessage.classList.remove('error');
      }
      setEditMode(false);
    });
  }
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
