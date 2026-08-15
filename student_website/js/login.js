// Login Form Handler
document.addEventListener("DOMContentLoaded", () => {
  Auth.redirectIfLoggedIn();

  const form = document.getElementById("login-form");
  const errorAlert = document.getElementById("login-error");
  const submitBtn = document.getElementById("btn-submit");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorAlert) errorAlert.style.display = "none";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      showError("Please enter your Registration ID / Username and Password.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Signing in...";
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed. Please verify your credentials.");
      }

      Auth.setAuth(data.access_token, data.user);

      if (data.user && data.user.must_change_password) {
        window.location.href = "change-password.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } catch (err) {
      showError(err.message || "Unable to connect to the authentication server.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Sign In to Portal";
      }
    }
  });

  function showError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = "block";
    } else {
      alert(msg);
    }
  }
});
