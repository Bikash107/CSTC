// --- SLA Timer (landing page) ---
let remaining = (1 * 3600) + (47 * 60) + 12;
const timerEl = document.getElementById("slaTimer");

if (timerEl) {
  setInterval(function () {
    remaining = remaining - 1;
    let hours = Math.floor(remaining / 3600);
    let minutes = Math.floor((remaining % 3600) / 60);
    let seconds = remaining % 60;
    timerEl.textContent = hours + ":" + minutes + ":" + seconds;
  }, 1000);
}

// --- Login/Register tab switching (login page) ---
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

if (loginTab) {
  loginTab.addEventListener("click", function () {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  });

  registerTab.addEventListener("click", function () {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });
}

// --- Login form submit -> redirect to dashboard ---
if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        return;
      }

      localStorage.setItem("cstc_user", JSON.stringify(data.user));

      if (data.user.role === "agent") {
        window.location.href = "agentdashboard.html";
      } else if (data.user.role === "admin") {
        window.location.href = "admindashboard.html";
      } else {
        window.location.href = "customerdashboard.html";
      }

    } catch (err) {
      alert("Could not connect to server. Is the backend running?");
    }
  });
}