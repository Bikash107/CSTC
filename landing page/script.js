function showToast(message, type) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = "toast show " + type;

  setTimeout(function () {
    toast.className = "toast " + type;
  }, 3000);
}

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
        showToast(data.error, "error");
        return;
      }

      localStorage.setItem("cstc_user", JSON.stringify(data.user));

      showToast("Login successful! Redirecting...", "success");

      setTimeout(function () {
        if (data.user.role === "agent") {
          window.location.href = "agentdashboard.html";
        } else if (data.user.role === "admin") {
          window.location.href = "admindashboard.html";
        } else {
          window.location.href = "customerdashboard.html";
        }
      }, 1200);

    } catch (err) {
      showToast("Could not connect to server. Is the backend running?", "error");
    }
  });
}

// --- Register form submit -> create account, switch to login tab ---
if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirm").value;

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error, "error");
        return;
      }

      showToast("Account created! Please log in.", "success");

      setTimeout(function () {
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        loginTab.classList.add("active");
        registerTab.classList.remove("active");
      }, 1200);

    } catch (err) {
      showToast("Could not connect to server. Is the backend running?", "error");
    }
  });
}

// --- Create Ticket form submit ---
const createTicketForm = document.getElementById("createTicketForm");

if (createTicketForm) {
  createTicketForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem("cstc_user"));

    if (!currentUser) {
      showToast("Please log in first", "error");
      return;
    }

    const subject = document.getElementById("ticketSubject").value;
    const category_id = document.getElementById("ticketCategory").value;
    const priority = document.getElementById("ticketPriority").value;
    const description = document.getElementById("ticketDescription").value;
    const fileInput = document.getElementById("ticketAttachment");

    try {
      const response = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: currentUser.id,
          category_id: category_id,
          subject: subject,
          description: description,
          priority: priority
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error, "error");
        return;
      }

      const newTicketId = data.ticketId;

      if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("uploaded_by", currentUser.id);

        await fetch("http://localhost:3000/api/tickets/" + newTicketId + "/attachments", {
          method: "POST",
          body: formData
        });
      }

      showToast("Ticket submitted successfully!", "success");

      setTimeout(function () {
        window.location.href = "customerdashboard.html";
      }, 1200);

    } catch (err) {
      showToast("Could not connect to server. Is the backend running?", "error");
    }
  });
}

// --- Load real tickets into Customer Dashboard ---
const ticketListEl = document.getElementById("ticketList");

if (ticketListEl) {
  const currentUser = JSON.parse(localStorage.getItem("cstc_user"));
  let myTicketsData = [];

  function renderCustomerTickets(filterStatus) {
    let filtered = myTicketsData;

    if (filterStatus && filterStatus !== "all") {
      filtered = myTicketsData.filter(function (ticket) {
        return ticket.status === filterStatus;
      });
    }

    if (filtered.length === 0) {
      ticketListEl.innerHTML = "<p class='loading-text'>No tickets match this filter.</p>";
      return;
    }

    ticketListEl.innerHTML = "";

    filtered.forEach(function (ticket) {
      const statusClass = "status-" + ticket.status.replace("_", "-");

      const row = document.createElement("a");
      row.href = "ticketdetail.html?id=" + ticket.id;
      row.className = "ticket-row";

      row.innerHTML = `
        <div class="ticket-row-main">
          <span class="ticket-row-id">TCK-${ticket.id}</span>
          <h4>${ticket.subject}</h4>
          <p>Created ${new Date(ticket.created_at).toLocaleDateString()}</p>
        </div>
        <span class="status-pill ${statusClass}">${ticket.status.replace("_", " ")}</span>
      `;

      ticketListEl.appendChild(row);
    });
  }

  if (!currentUser) {
    ticketListEl.innerHTML = "<p class='loading-text'>Please log in to view your tickets.</p>";
  } else {
    fetch("http://localhost:3000/api/tickets")
      .then(function (response) {
        return response.json();
      })
      .then(function (allTickets) {
        myTicketsData = allTickets.filter(function (ticket) {
          return ticket.customer_id === currentUser.id;
        });

        renderCustomerTickets("all");

        const filterButtons = document.querySelectorAll(".filter-btn");
        const filterMap = {
          "All": "all",
          "Open": "open",
          "In Progress": "in_progress",
          "Resolved": "resolved",
          "Closed": "closed"
        };

        filterButtons.forEach(function (btn) {
          btn.addEventListener("click", function () {
            filterButtons.forEach(function (b) {
              b.classList.remove("active");
            });
            btn.classList.add("active");

            const filterValue = filterMap[btn.textContent.trim()];
            renderCustomerTickets(filterValue);
          });
        });
      })
      .catch(function (err) {
        ticketListEl.innerHTML = "<p class='loading-text'>Could not load tickets. Is the backend running?</p>";
      });
  }
}

// --- Load real tickets into Agent Dashboard ---
const agentTicketListEl = document.getElementById("ticketList");

if (agentTicketListEl && document.title.includes("Agent")) {
  let agentTicketsData = [];

  function renderAgentTickets(filterPriority) {
    let filtered = agentTicketsData;

    if (filterPriority && filterPriority !== "all") {
      filtered = agentTicketsData.filter(function (ticket) {
        return ticket.priority === filterPriority;
      });
    }

    if (filtered.length === 0) {
      agentTicketListEl.innerHTML = "<p class='loading-text'>No tickets match this filter.</p>";
      return;
    }

    agentTicketListEl.innerHTML = "";

    filtered.forEach(function (ticket) {
      const statusClass = "status-" + ticket.status.replace("_", "-");
      const priorityClass = "priority-" + ticket.priority;

      const row = document.createElement("a");
      row.href = "ticketdetail.html?id=" + ticket.id;
      row.className = "ticket-row";

      row.innerHTML = `
        <div class="ticket-row-main">
          <span class="ticket-row-id">TCK-${ticket.id}</span>
          <h4>${ticket.subject}</h4>
          <p>Created ${new Date(ticket.created_at).toLocaleDateString()}</p>
        </div>
        <div class="ticket-row-actions">
          <span class="priority-pill ${priorityClass}">${ticket.priority}</span>
          <span class="status-pill ${statusClass}">${ticket.status.replace("_", " ")}</span>
        </div>
      `;

      agentTicketListEl.appendChild(row);
    });
  }

  fetch("http://localhost:3000/api/tickets")
    .then(function (response) {
      return response.json();
    })
    .then(function (allTickets) {
      agentTicketsData = allTickets;

      renderAgentTickets("all");

      const filterButtons = document.querySelectorAll(".filter-btn");
      const filterMap = {
        "All": "all",
        "Urgent": "urgent",
        "High": "high",
        "Medium": "medium",
        "Low": "low"
      };

      filterButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          filterButtons.forEach(function (b) {
            b.classList.remove("active");
          });
          btn.classList.add("active");

          const filterValue = filterMap[btn.textContent.trim()];
          renderAgentTickets(filterValue);
        });
      });
    })
    .catch(function (err) {
      agentTicketListEl.innerHTML = "<p class='loading-text'>Could not load tickets. Is the backend running?</p>";
    });
}

// --- Load real tickets into Admin Dashboard ---
const adminTicketListEl = document.getElementById("ticketList");

if (adminTicketListEl && document.title.includes("Admin")) {
  let adminTicketsData = [];

  function renderAdminTickets(filterStatus) {
    let filtered = adminTicketsData;

    if (filterStatus && filterStatus !== "all") {
      filtered = adminTicketsData.filter(function (ticket) {
        return ticket.status === filterStatus;
      });
    }

    const recentFiltered = filtered.slice(0, 5);

    if (recentFiltered.length === 0) {
      adminTicketListEl.innerHTML = "<p class='loading-text'>No tickets match this filter.</p>";
      return;
    }

    adminTicketListEl.innerHTML = "";

    recentFiltered.forEach(function (ticket) {
      const statusClass = "status-" + ticket.status.replace("_", "-");

      const row = document.createElement("a");
      row.href = "ticketdetail.html?id=" + ticket.id;
      row.className = "ticket-row";

      row.innerHTML = `
        <div class="ticket-row-main">
          <span class="ticket-row-id">TCK-${ticket.id}</span>
          <h4>${ticket.subject}</h4>
          <p>Created ${new Date(ticket.created_at).toLocaleDateString()}</p>
        </div>
        <span class="status-pill ${statusClass}">${ticket.status.replace("_", " ")}</span>
      `;

      adminTicketListEl.appendChild(row);
    });
  }

  fetch("http://localhost:3000/api/tickets")
    .then(function (response) {
      return response.json();
    })
    .then(function (allTickets) {
      adminTicketsData = allTickets;

      renderAdminTickets("all");

      const filterButtons = document.querySelectorAll(".filter-btn");
      const filterMap = {
        "All": "all",
        "Open": "open",
        "In Progress": "in_progress",
        "Resolved": "resolved",
        "Closed": "closed"
      };

      filterButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          filterButtons.forEach(function (b) {
            b.classList.remove("active");
          });
          btn.classList.add("active");

          const filterValue = filterMap[btn.textContent.trim()];
          renderAdminTickets(filterValue);
        });
      });
    })
    .catch(function (err) {
      adminTicketListEl.innerHTML = "<p class='loading-text'>Could not load tickets. Is the backend running?</p>";
    });
}

// --- Load real ticket into Ticket Detail page ---
const ticketDetailEl = document.getElementById("ticketDetailContent");

if (ticketDetailEl) {
  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get("id");

  if (!ticketId) {
    ticketDetailEl.innerHTML = "<p class='loading-text'>No ticket ID provided.</p>";
  } else {
    fetch("http://localhost:3000/api/tickets/" + ticketId)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Ticket not found");
        }
        return response.json();
      })
      .then(function (ticket) {
        document.title = "CSTC — TCK-" + ticket.id;

        const statusClass = "status-" + ticket.status.replace("_", "-");
        const priorityClass = "priority-" + ticket.priority;

        ticketDetailEl.innerHTML = `
          <div class="detail-header">
            <div>
              <span class="ticket-row-id">TCK-${ticket.id}</span>
              <h1>${ticket.subject}</h1>
            </div>
            <div class="detail-pills">
              <span class="priority-pill ${priorityClass}">${ticket.priority}</span>
              <span class="status-pill ${statusClass}">${ticket.status.replace("_", " ")}</span>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-main">
              <div class="detail-card">
                <p class="ticket-desc">${ticket.description}</p>
              </div>

              <div class="thread">
                <p class="loading-text">No replies yet.</p>
              </div>

              <form class="reply-box" id="replyForm">
                <textarea rows="4" placeholder="Type your reply..."></textarea>
                <div class="reply-actions">
                  <label class="checkbox-label">
                    <input type="checkbox"> Internal note only
                  </label>
                  <button type="submit" class="btn btn-primary">Send Reply</button>
                </div>
              </form>
            </div>

            <div class="detail-sidebar">
              <div class="detail-card">
                <h4>Ticket Info</h4>
                <div class="info-row"><span>Category ID</span><span>${ticket.category_id || "—"}</span></div>
                <div class="info-row"><span>Customer ID</span><span>${ticket.customer_id}</span></div>
                <div class="info-row">
                  <span>Assigned Agent ID</span>
                  <span>
                    ${ticket.assigned_agent_id ? ticket.assigned_agent_id : `Unassigned <button id="assignMeBtn" class="btn btn-primary" style="padding:4px 10px; font-size:12px; margin-left:8px;">Assign to me</button>`}
                  </span>
                </div>
                <div class="info-row"><span>Created</span><span>${new Date(ticket.created_at).toLocaleDateString()}</span></div>
              </div>

              <div class="detail-card">
                <h4>Update Ticket</h4>
                <div class="form-group">
                  <label>Status</label>
                  <select id="updateStatus">
                    <option value="open" ${ticket.status === "open" ? "selected" : ""}>Open</option>
                    <option value="in_progress" ${ticket.status === "in_progress" ? "selected" : ""}>In Progress</option>
                    <option value="resolved" ${ticket.status === "resolved" ? "selected" : ""}>Resolved</option>
                    <option value="closed" ${ticket.status === "closed" ? "selected" : ""}>Closed</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Priority</label>
                  <select id="updatePriority">
                    <option value="low" ${ticket.priority === "low" ? "selected" : ""}>Low</option>
                    <option value="medium" ${ticket.priority === "medium" ? "selected" : ""}>Medium</option>
                    <option value="high" ${ticket.priority === "high" ? "selected" : ""}>High</option>
                    <option value="urgent" ${ticket.priority === "urgent" ? "selected" : ""}>Urgent</option>
                  </select>
                </div>
                <button class="btn btn-primary" id="saveUpdateBtn" style="width:100%; margin-top:8px;">Save Changes</button>
              </div>
            </div>
          </div>
        `;

        function loadComments(ticketId) {
          fetch("http://localhost:3000/api/tickets/" + ticketId + "/comments")
            .then(function (response) {
              return response.json();
            })
            .then(function (comments) {
              const threadEl = document.querySelector(".thread");

              if (comments.length === 0) {
                threadEl.innerHTML = "<p class='loading-text'>No replies yet.</p>";
                return;
              }

              threadEl.innerHTML = "";

              comments.forEach(function (comment) {
                const item = document.createElement("div");
                item.className = "thread-item" + (comment.is_internal ? " thread-internal" : "");

                const roleLabel = comment.is_internal ? "Internal note" : comment.author_role;

                item.innerHTML = `
          <div class="thread-head">
            <span class="thread-author">${comment.author_name} (${roleLabel})</span>
            <span class="thread-time">${new Date(comment.created_at).toLocaleString()}</span>
          </div>
          <p>${comment.message}</p>
        `;

                threadEl.appendChild(item);
              });
            })
            .catch(function (err) {
              console.error("Could not load comments:", err);
            });
        }

        loadComments(ticket.id);

        function loadAttachments(ticketId) {
          fetch("http://localhost:3000/api/tickets/" + ticketId + "/attachments")
            .then(function (response) {
              return response.json();
            })
            .then(function (attachments) {
              if (attachments.length === 0) return;

              const attachmentsHtml = attachments.map(function (att) {
                return `<a href="http://localhost:3000${att.file_url}" target="_blank" class="attachment-link">📎 ${att.file_name}</a>`;
              }).join("");

              const detailCard = document.querySelector(".detail-main .detail-card");
              detailCard.insertAdjacentHTML("beforeend", `<div class="attachments-list">${attachmentsHtml}</div>`);
            })
            .catch(function (err) {
              console.error("Could not load attachments:", err);
            });
        }

        loadAttachments(ticket.id);

        const replyForm = document.getElementById("replyForm");
        replyForm.addEventListener("submit", async function (event) {
          event.preventDefault();

          const currentUser = JSON.parse(localStorage.getItem("cstc_user"));

          if (!currentUser) {
            showToast("Please log in first", "error");
            return;
          }

          const messageInput = replyForm.querySelector("textarea");
          const internalCheckbox = replyForm.querySelector("input[type='checkbox']");

          const message = messageInput.value;
          const isInternal = internalCheckbox.checked;

          if (!message.trim()) {
            showToast("Reply cannot be empty", "error");
            return;
          }

          try {
            const response = await fetch("http://localhost:3000/api/tickets/" + ticket.id + "/comments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: currentUser.id,
                message: message,
                is_internal: isInternal
              })
            });

            const data = await response.json();

            if (!response.ok) {
              showToast(data.error, "error");
              return;
            }

            showToast("Reply sent!", "success");
            messageInput.value = "";
            internalCheckbox.checked = false;
            loadComments(ticket.id);

          } catch (err) {
            showToast("Could not connect to server.", "error");
          }
        });

        const saveUpdateBtn = document.getElementById("saveUpdateBtn");
        saveUpdateBtn.addEventListener("click", async function () {
          const newStatus = document.getElementById("updateStatus").value;
          const newPriority = document.getElementById("updatePriority").value;

          try {
            const response = await fetch("http://localhost:3000/api/tickets/" + ticket.id, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: newStatus,
                priority: newPriority
              })
            });

            const data = await response.json();

            if (!response.ok) {
              showToast(data.error, "error");
              return;
            }

            showToast("Ticket updated successfully!", "success");

            setTimeout(function () {
              location.reload();
            }, 1000);

          } catch (err) {
            showToast("Could not connect to server.", "error");
          }
        });

        const assignMeBtn = document.getElementById("assignMeBtn");
        if (assignMeBtn) {
          assignMeBtn.addEventListener("click", async function () {
            const currentUser = JSON.parse(localStorage.getItem("cstc_user"));

            if (!currentUser) {
              showToast("Please log in first", "error");
              return;
            }

            try {
              const response = await fetch("http://localhost:3000/api/tickets/" + ticket.id, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  assigned_agent_id: currentUser.id
                })
              });

              const data = await response.json();

              if (!response.ok) {
                showToast(data.error, "error");
                return;
              }

              showToast("Ticket assigned to you!", "success");

              setTimeout(function () {
                location.reload();
              }, 1000);

            } catch (err) {
              showToast("Could not connect to server.", "error");
            }
          });
        }
      })
      .catch(function (err) {
        ticketDetailEl.innerHTML = "<p class='loading-text'>Ticket not found.</p>";
      });
  }
}