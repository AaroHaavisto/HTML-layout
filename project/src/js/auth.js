const USERS_KEY = 'or_users';
const CURRENT_USER_KEY = 'or_current_user';

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const favouriteRestaurants = Array.isArray(user.favouriteRestaurants)
    ? user.favouriteRestaurants
    : user.favouriteRestaurant
      ? [user.favouriteRestaurant].filter(Boolean)
      : [];

  return {
    ...user,
    favouriteRestaurants,
    avatar: user.avatar || null,
  };
}

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(users) ? users.map(normalizeUser).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  try {
    return normalizeUser(
      JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null')
    );
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

export function redirectIfAuthenticated() {
  const user = getCurrentUser();
  if (user) {
    window.location.href = 'restaurants.html';
  }
}

export function registerUser({username, email, password}) {
  const users = readUsers();
  const normalizedUsername = username.trim().toLowerCase();

  if (users.some(user => user.username.toLowerCase() === normalizedUsername)) {
    return {ok: false, message: 'Käyttäjätunnus on jo käytössä.'};
  }

  const newUser = {
    id: crypto.randomUUID(),
    username: username.trim(),
    email: email.trim(),
    password,
    favouriteRestaurants: [],
    avatar: null,
  };

  users.push(newUser);
  writeUsers(users);

  return {ok: true, user: newUser};
}

export function loginUser({username, password}) {
  const users = readUsers();
  const user = users.find(
    entry =>
      entry.username.toLowerCase() === username.trim().toLowerCase() &&
      entry.password === password
  );

  if (!user) {
    return {ok: false, message: 'Väärä käyttäjätunnus tai salasana.'};
  }

  const normalizedUser = normalizeUser(user);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
  return {ok: true, user: normalizedUser};
}

export function updateCurrentUser(nextUser) {
  const normalizedUser = normalizeUser(nextUser);
  if (!normalizedUser) {
    return null;
  }

  const users = readUsers();
  const updatedUsers = users.map(user =>
    user.id === normalizedUser.id ? normalizedUser : user
  );

  writeUsers(updatedUsers);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
  return normalizedUser;
}

export function updateUserProfile({username, email, password}) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return {ok: false, message: 'Et ole kirjautunut sisään.'};
  }

  const nextUsername = String(username || '').trim();
  const nextEmail = String(email || '').trim();
  const nextPassword = String(password || '');

  if (!nextUsername) {
    return {ok: false, message: 'Käyttäjätunnus ei voi olla tyhjä.'};
  }

  if (!nextEmail) {
    return {ok: false, message: 'Sähköposti ei voi olla tyhjä.'};
  }

  const users = readUsers();
  const duplicateUser = users.find(
    user =>
      user.id !== currentUser.id &&
      user.username.toLowerCase() === nextUsername.toLowerCase()
  );

  if (duplicateUser) {
    return {ok: false, message: 'Käyttäjätunnus on jo käytössä.'};
  }

  const updatedUser = {
    ...currentUser,
    username: nextUsername,
    email: nextEmail,
    password: nextPassword ? nextPassword : currentUser.password,
  };

  const normalizedUser = updateCurrentUser(updatedUser);
  if (!normalizedUser) {
    return {ok: false, message: 'Tietojen päivitys epäonnistui.'};
  }

  return {ok: true, user: normalizedUser};
}

export function setUserAvatar(avatarDataUrl) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return null;
  }

  return updateCurrentUser({
    ...currentUser,
    avatar: avatarDataUrl,
  });
}

export function toggleFavouriteRestaurant(restaurantId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return null;
  }

  const favouriteRestaurants = Array.isArray(currentUser.favouriteRestaurants)
    ? [...currentUser.favouriteRestaurants]
    : [];

  const index = favouriteRestaurants.indexOf(restaurantId);
  if (index >= 0) {
    favouriteRestaurants.splice(index, 1);
  } else {
    favouriteRestaurants.push(restaurantId);
  }

  return updateCurrentUser({
    ...currentUser,
    favouriteRestaurants,
  });
}
