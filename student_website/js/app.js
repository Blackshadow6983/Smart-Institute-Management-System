// Global App Utilities and API Client
const App = {
  async fetchAPI(endpoint, options = {}) {
    const token = Auth.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${CONFIG.API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        Auth.logout();
        throw new Error("Session expired. Please log in again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "An error occurred");
      }

      return data;
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    }
  },

  formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  },

  formatCurrency(amount) {
    if (amount === undefined || amount === null) return "₹0.00";
    return "₹" + Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  getStatusBadge(status, type = "default") {
    const s = String(status).toLowerCase();
    if (s === "present" || s === "paid" || s === "completed" || s === "active" || s === "pass" || s === "true") {
      return `<span class="badge badge-success">${status === "true" || status === true ? "Present" : status}</span>`;
    }
    if (s === "absent" || s === "unpaid" || s === "failed" || s === "fail" || s === "false") {
      return `<span class="badge badge-danger">${status === "false" || status === false ? "Absent" : status}</span>`;
    }
    if (s === "pending" || s === "partial" || s === "in progress") {
      return `<span class="badge badge-pending">${status}</span>`;
    }
    return `<span class="badge badge-info">${status}</span>`;
  },

  initSidebar() {
    // Highlight active link
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-item").forEach(link => {
      const href = link.getAttribute("href");
      if (href === currentPath || (currentPath === "" && href === "dashboard.html")) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Mobile menu toggle
    const menuBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.querySelector(".app-sidebar");
    if (menuBtn && sidebar) {
      menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }

    // Logout buttons
    document.querySelectorAll(".btn-logout").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        Auth.logout();
      });
    });

    // Render user profile details
    Auth.renderUserBadge();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  App.initSidebar();
});
