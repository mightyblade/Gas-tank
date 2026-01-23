const authPanel = document.querySelector('#auth-panel');
const adminPanel = document.querySelector('#admin-panel');
const priceForm = document.querySelector('#price-form');
const priceInput = document.querySelector('#price-input');
const currentPrice = document.querySelector('#current-price');
const userForm = document.querySelector('#user-form');
const userNameInput = document.querySelector('#user-name');
const driverAdminList = document.querySelector('#driver-admin-list');
const logoutButton = document.querySelector('#admin-logout');
const adminPasswordForm = document.querySelector('#admin-password-form');
const adminPasswordInput = document.querySelector('#admin-password');
const userPasswordForm = document.querySelector('#user-password-form');
const userPasswordInput = document.querySelector('#user-password');

init();

async function init() {
  try {
    if (shouldUseDemoData()) {
      renderAdmin(demoData());
      return;
    }

    const role = await getSessionRole();
    if (role !== 'admin') {
      renderLogin();
      return;
    }

    await renderAdmin(await loadAdminData());
  } catch (error) {
    renderError(error.message);
  }
}

function renderLogin() {
  authPanel.innerHTML = `
    <h2>Admin login</h2>
    <p class="muted">Enter the admin password to continue.</p>
    <form id="admin-login" class="stack">
      <label for="admin-login-input">Password</label>
      <input id="admin-login-input" type="password" required />
      <button type="submit">Unlock</button>
    </form>
    <p id="login-error" class="error hidden"></p>
  `;

  const loginForm = authPanel.querySelector('#admin-login');
  const errorText = authPanel.querySelector('#login-error');
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorText.classList.add('hidden');
    try {
      await apiLogin('admin', authPanel.querySelector('#admin-login-input').value);
      await renderAdmin(await loadAdminData());
    } catch (error) {
      errorText.textContent = error.message;
      errorText.classList.remove('hidden');
    }
  });
}

async function loadAdminData() {
  const [pricePayload, driversPayload] = await Promise.all([
    apiRequest('gas-price.php', { method: 'GET' }),
    apiRequest('drivers.php', { method: 'GET' }),
  ]);

  return {
    gasPrice: pricePayload.gasPrice,
    drivers: driversPayload.drivers,
  };
}

async function renderAdmin(data) {
  authPanel.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  currentPrice.textContent = formatCurrency(data.gasPrice);
  renderDriverList(data.drivers);

  priceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = Number.parseFloat(priceInput.value);
    if (Number.isNaN(value)) {
      return;
    }
    const payload = await apiRequest('gas-price.php', {
      method: 'POST',
      body: JSON.stringify({ gasPrice: value }),
    });
    priceInput.value = '';
    currentPrice.textContent = formatCurrency(payload.gasPrice);
  });

  userForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = userNameInput.value.trim();
    if (!name) {
      return;
    }
    await apiRequest('drivers.php', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    userNameInput.value = '';
    renderDriverList((await loadAdminData()).drivers);
  });

  adminPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await apiRequest('set-admin-password.php', {
      method: 'POST',
      body: JSON.stringify({ password: adminPasswordInput.value }),
    });
    adminPasswordInput.value = '';
  });

  userPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await apiRequest('set-user-password.php', {
      method: 'POST',
      body: JSON.stringify({ password: userPasswordInput.value }),
    });
    userPasswordInput.value = '';
  });
}

logoutButton.addEventListener('click', async () => {
  try {
    await apiLogout();
  } finally {
    window.location.href = 'admin.html';
  }
});

function renderDriverList(drivers) {
  driverAdminList.innerHTML = '';

  if (drivers.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-item';
    empty.textContent = 'No drivers yet.';
    driverAdminList.appendChild(empty);
    return;
  }

  drivers.forEach((driver) => {
    const item = document.createElement('li');
    item.className = 'history-item history-item-row';
    item.innerHTML = `
      <div>
        <strong>${driver.name}</strong>
        <div class="muted">Driver ID: ${driver.id}</div>
      </div>
      <button class="link-button danger" data-delete-driver="${driver.id}">Delete</button>
    `;
    driverAdminList.appendChild(item);
  });

  driverAdminList.querySelectorAll('[data-delete-driver]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-delete-driver');
      await apiRequest(`drivers.php?id=${id}`, { method: 'DELETE' });
      renderDriverList((await loadAdminData()).drivers);
    });
  });
}

function renderError(message) {
  authPanel.innerHTML = `<p class="error">${message}</p>`;
}
