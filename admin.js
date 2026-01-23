const state = loadState();
const authPanel = document.querySelector("#auth-panel");
const adminPanel = document.querySelector("#admin-panel");
const priceForm = document.querySelector("#price-form");
const priceInput = document.querySelector("#price-input");
const currentPrice = document.querySelector("#current-price");
const userForm = document.querySelector("#user-form");
const userNameInput = document.querySelector("#user-name");
const driverAdminList = document.querySelector("#driver-admin-list");

const ADMIN_SESSION_KEY = "gas-tank-admin-session";

init();

function init() {
  if (!state.adminPassword) {
    renderPasswordSetup();
    return;
  }

  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    unlockAdmin();
    return;
  }

  renderPasswordPrompt();
}

function renderPasswordSetup() {
  authPanel.innerHTML = `
    <h2>Set admin password</h2>
    <p class="muted">This password is stored locally in your browser.</p>
    <form id="password-setup" class="stack">
      <label for="password-input">New password</label>
      <input id="password-input" type="password" required />
      <button type="submit">Save password</button>
    </form>
  `;

  const setupForm = authPanel.querySelector("#password-setup");
  setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = authPanel
      .querySelector("#password-input")
      .value.trim();
    if (!password) {
      return;
    }
    state.adminPassword = password;
    saveState(state);
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    unlockAdmin();
  });
}

function renderPasswordPrompt() {
  authPanel.innerHTML = `
    <h2>Admin login</h2>
    <p class="muted">Enter the admin password to continue.</p>
    <form id="password-login" class="stack">
      <label for="password-login-input">Password</label>
      <input id="password-login-input" type="password" required />
      <button type="submit">Unlock</button>
    </form>
  `;

  const loginForm = authPanel.querySelector("#password-login");
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = authPanel
      .querySelector("#password-login-input")
      .value.trim();
    if (password !== state.adminPassword) {
      authPanel.querySelector("#password-login-input").value = "";
      const error = document.createElement("p");
      error.className = "error";
      error.textContent = "Incorrect password. Try again.";
      authPanel.appendChild(error);
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    unlockAdmin();
  });
}

function unlockAdmin() {
  authPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  currentPrice.textContent = formatCurrency(state.gasPrice);
  renderDriverList();

  priceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = Number.parseFloat(priceInput.value);
    if (Number.isNaN(value)) {
      return;
    }
    state.gasPrice = value;
    priceInput.value = "";
    saveState(state);
    currentPrice.textContent = formatCurrency(state.gasPrice);
  });

  userForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = userNameInput.value.trim();
    if (!name) {
      return;
    }
    state.users.push({
      id: crypto.randomUUID(),
      name,
      fuelEntries: [],
      payments: [],
    });
    userNameInput.value = "";
    saveState(state);
    renderDriverList();
  });
}

function renderDriverList() {
  driverAdminList.innerHTML = "";

  if (state.users.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-item";
    empty.textContent = "No drivers yet.";
    driverAdminList.appendChild(empty);
    return;
  }

  state.users.forEach((user) => {
    const item = document.createElement("li");
    item.className = "history-item";
    item.innerHTML = `
      <strong>${user.name}</strong>
      <div class="muted">Driver ID: ${user.id}</div>
    `;
    driverAdminList.appendChild(item);
  });
}
