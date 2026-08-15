// Authentication & Session Helper
const Auth = {
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getUser() {
    try {
      const data = localStorage.getItem(CONFIG.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = "login.html";
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  },

  redirectIfLoggedIn() {
    if (this.isAuthenticated()) {
      window.location.href = "dashboard.html";
    }
  },

  renderUserBadge() {
    const user = this.getUser();
    if (!user) return;

    const nameEl = document.getElementById("sidebar-user-name");
    const roleEl = document.getElementById("sidebar-user-role");
    const avatarEl = document.getElementById("sidebar-user-avatar");
    const headerNameEl = document.getElementById("header-user-name");

    const username = user.username || "User";
    const initial = username.charAt(0).toUpperCase();

    if (nameEl) nameEl.textContent = username;
    if (roleEl) roleEl.textContent = user.role || "Student";
    if (avatarEl) avatarEl.textContent = initial;
    if (headerNameEl) headerNameEl.textContent = username;
  }
};
