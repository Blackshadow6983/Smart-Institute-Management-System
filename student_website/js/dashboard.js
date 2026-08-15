// Dashboard Data Loader
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.requireAuth()) return;

  const user = Auth.getUser();
  if (!user) return;

  const welcomeNameEl = document.getElementById("welcome-user-name");
  if (welcomeNameEl) {
    welcomeNameEl.textContent = user.username;
  }

  try {
    // 1. Fetch Student Profile
    const profileData = await App.fetchAPI(`/students/${user.username}`);
    const student = profileData.student;
    
    if (student) {
      const studentNameEl = document.getElementById("dash-student-name");
      const courseEl = document.getElementById("dash-course");
      const batchEl = document.getElementById("dash-batch");
      const regIdEl = document.getElementById("dash-reg-id");

      if (studentNameEl) studentNameEl.textContent = student.name || user.username;
      if (courseEl) courseEl.textContent = student.course || "General Curriculum";
      if (batchEl) batchEl.textContent = student.batch || "2026 Batch";
      if (regIdEl) regIdEl.textContent = student.registration_id;

      // 2. Fetch Attendance
      try {
        const attData = await App.fetchAPI(`/attendance/percentage/${student.id}`);
        const attValueEl = document.getElementById("dash-attendance-val");
        const attBarEl = document.getElementById("dash-attendance-bar");
        if (attValueEl) {
          const pct = Math.round(attData.attendance_percentage || 0);
          attValueEl.textContent = `${pct}%`;
          if (attBarEl) {
            attBarEl.style.width = `${pct}%`;
            attBarEl.className = `progress-bar-fill ${pct >= 75 ? "success" : pct >= 60 ? "warning" : "danger"}`;
          }
        }
      } catch (e) {
        console.warn("Attendance load note:", e.message);
      }

      // 3. Fetch Fee Summary
      try {
        const feeData = await App.fetchAPI(`/fees/summary/${student.id}`);
        const feePendingEl = document.getElementById("dash-pending-fee");
        if (feePendingEl) {
          const pending = feeData.balance !== undefined ? feeData.balance : 0;
          feePendingEl.textContent = App.formatCurrency(pending);
        }
      } catch (e) {
        console.warn("Fee summary load note:", e.message);
      }

      // 4. Fetch Result / Marks Summary
      try {
        const resultData = await App.fetchAPI(`/assessments/result/${student.id}`);
        const gradeEl = document.getElementById("dash-grade");
        const pctEl = document.getElementById("dash-result-pct");
        if (gradeEl && resultData.grade) {
          gradeEl.textContent = resultData.grade;
        }
        if (pctEl && resultData.percentage !== undefined) {
          pctEl.textContent = `${Math.round(resultData.percentage)}% Overall`;
        }
      } catch (e) {
        console.warn("Result load note:", e.message);
      }
    }
  } catch (err) {
    console.error("Dashboard profile fetch error:", err);
  }

  // 5. Fetch Recent Notices
  try {
    const notices = await App.fetchAPI("/notices/");
    const noticesContainer = document.getElementById("dash-notices-container");
    if (noticesContainer) {
      if (!notices || notices.length === 0) {
        noticesContainer.innerHTML = `<div class="p-3 text-muted text-center">No recent announcements at this time.</div>`;
      } else {
        noticesContainer.innerHTML = notices.slice(0, 4).map(n => `
          <div class="notice-list-item">
            <div class="notice-meta">
              <span class="badge badge-info">Notice</span>
              <span>${App.formatDate(n.created_at)}</span>
            </div>
            <div class="notice-title">${n.title}</div>
            <div class="notice-body">${n.message}</div>
          </div>
        `).join("");
      }
    }
  } catch (err) {
    console.warn("Notices fetch error:", err.message);
  }
});
