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
  const [pricePayload, driversPayload, fuelSummaryPayload, tankPayload] = await Promise.all([
    apiRequest('gas-price.php', { method: 'GET' }),
    apiRequest('drivers.php', { method: 'GET' }),
    apiRequest('fuel-summary.php', { method: 'GET' }),
    apiRequest('tank.php', { method: 'GET' }),
  ]);

  return {
    gasPrice: pricePayload.gasPrice,
    drivers: driversPayload.drivers,
    fuelSummary: fuelSummaryPayload,
    tank: tankPayload,
  };
}

async function renderAdmin(data) {
  authPanel.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  currentPrice.textContent = formatPrice(data.gasPrice);
  
  if (data.fuelSummary) {
    const balance = data.fuelSummary.totalFuelCost - data.fuelSummary.totalPayments;
    document.getElementById('total-fuel-cost').textContent = formatCurrency(data.fuelSummary.totalFuelCost);
    document.getElementById('total-liters').textContent = data.fuelSummary.totalLiters.toFixed(2) + ' L';
    document.getElementById('total-paid').textContent = formatCurrency(data.fuelSummary.totalPayments);
    document.getElementById('balance-owed').textContent = formatCurrency(balance);
  }
  
  if (data.tank) {
    const tankSize = data.tank.tank_size || 0;
    const currentLevel = data.tank.current_fuel_level || 0;
    const percent = tankSize > 0 ? Math.min(100, Math.max(0, (currentLevel / tankSize) * 100)) : 0;
    
    document.getElementById('admin-tank-fill').style.height = percent + '%';
    document.getElementById('admin-tank-percent').textContent = percent.toFixed(0) + '%';
    document.getElementById('admin-tank-liters').textContent = currentLevel.toFixed(1) + ' / ' + tankSize.toFixed(0) + ' L';
    document.getElementById('tank-size').value = tankSize || '';
    document.getElementById('tank-level').value = currentLevel || '';
  }
  
  renderDriverList(data.drivers, data.fuelSummary);

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
    currentPrice.textContent = formatPrice(payload.gasPrice);
  });

  const updateTankBtn = document.getElementById('update-tank-btn');
  if (updateTankBtn) {
    updateTankBtn.addEventListener('click', async function() {
      const tankSize = document.getElementById('tank-size').value;
      const currentFuelLevel = document.getElementById('tank-level').value;
      
      if (!tankSize && !currentFuelLevel) {
        return;
      }
      
      await apiRequest('tank.php', {
        method: 'PUT',
        body: JSON.stringify({
          tankSize: tankSize || null,
          currentFuelLevel: currentFuelLevel || null,
        }),
      });
      
      const updatedData = await loadAdminData();
      renderAdmin(updatedData);
    });
  }
  
  document.getElementById('refill-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const refillAmount = document.getElementById('refill-amount').value;
    
    if (!refillAmount || refillAmount <= 0) {
      return;
    }
    
    await apiRequest('tank.php', {
      method: 'POST',
      body: JSON.stringify({ litersAdded: refillAmount }),
    });
    
    document.getElementById('refill-amount').value = '';
    const updatedData = await loadAdminData();
    renderAdmin(updatedData);
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
    const adminData = await loadAdminData();
    renderDriverList(adminData.drivers, adminData.fuelSummary);
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

function renderDriverList(drivers, fuelSummary) {
  driverAdminList.innerHTML = '';

  if (drivers.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-item';
    empty.textContent = 'No drivers yet.';
    driverAdminList.appendChild(empty);
    return;
  }

  drivers.forEach((driver) => {
    const fuelData = fuelSummary?.drivers?.find(d => d.id == driver.id) || {};
    const item = document.createElement('li');
    item.className = 'history-item';
    item.innerHTML = `
      <div>
        <strong>${driver.name}</strong>
        <div class="muted">Driver ID: ${driver.id}</div>
        <div class="muted">Username: ${driver.username ?? 'Not set'}</div>
        <div class="muted">Fuel cost: ${formatCurrency(fuelData.total_fuel_cost || 0)} | Paid: ${formatCurrency(fuelData.total_paid || 0)}</div>
      </div>
      <div class="history-actions">
        <button class="link-button" data-set-driver-password="${driver.id}">Set login</button>
        <button class="link-button danger" data-delete-driver="${driver.id}">Delete</button>
      </div>
    `;
    driverAdminList.appendChild(item);
  });

  driverAdminList.querySelectorAll('[data-set-driver-password]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-set-driver-password');
      const username = window.prompt('Enter a username for this driver');
      if (!username) {
        return;
      }
      const password = window.prompt('Enter a password for this driver');
      if (!password) {
        return;
      }
      await apiRequest('driver-credentials.php', {
        method: 'POST',
        body: JSON.stringify({ driverId: id, username, password }),
      });
    });
  });

  driverAdminList.querySelectorAll('[data-delete-driver]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-delete-driver');
      await apiRequest(`drivers.php?id=${id}`, { method: 'DELETE' });
      const adminData = await loadAdminData();
      renderDriverList(adminData.drivers, adminData.fuelSummary);
    });
  });
}

function renderError(message) {
  authPanel.innerHTML = `<p class="error">${message}</p>`;
}
