const params = new URLSearchParams(window.location.search);
const driverId = params.get('id');

const driverName = document.querySelector('#driver-name');
const vehiclesSection = document.querySelector('#vehicles-section');
const recentFuelAllSection = document.querySelector('#recent-fuel-all');
const fuelSection = document.querySelector('#driver-fuel-entry');
const summarySection = document.querySelector('#driver-summary');
const paymentSection = document.querySelector('#driver-payment');
const historySection = document.querySelector('#driver-history');
const logoutButton = document.querySelector('#logout');
const hamburgerMenu = document.querySelector('#hamburger-menu');
const mobileMenu = document.querySelector('#mobile-menu');
const logoutMobile = document.querySelector('#logout-mobile');

let currentRole = null;
let driverData = null;
let recentFuelAll = [];
let currentGasPrice = 0;
let toastTimeoutId = null;

function showToast(message) {
  let toast = document.querySelector('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

function formatFuelEntry(entry) {
  const total = Number(entry.amount) * Number(entry.price_per_unit);
  const vehicles = driverData?.vehicles || [];
  const vehicleName = entry.vehicle_id 
    ? (vehicles.find(v => String(v.id) === String(entry.vehicle_id))?.name || 'Unknown')
    : null;
  const vehicleStr = vehicleName ? ` [${vehicleName}]` : '';
  return `${formatDate(entry.entry_date)}: ${Number(entry.amount).toFixed(2)} liters @ ${formatPrice(
    entry.price_per_unit
  )} = ${formatCurrency(total)}${vehicleStr}`;
}

init();

async function init() {
  try {
    if (shouldUseDemoData()) {
      currentRole = 'admin';
      const demo = demoData();
      driverData = demo.driverDetail;
      recentFuelAll = demo.recentFuel;
      currentGasPrice = demo.gasPrice;
      renderDriver();
      return;
    }

    currentRole = await getSessionRole();
    if (!currentRole) {
      window.location.href = 'login.html';
      return;
    }

    await Promise.all([loadDriverData(), loadCurrentGasPrice()]);
    renderDriver();
    await loadRecentFuelAll();
    renderRecentFuelAll();
  } catch (error) {
    renderError(error.message);
  }
}

async function loadDriverData() {
  if (!driverId) {
    throw new Error('Missing driver ID.');
  }
  const payload = await apiRequest(`driver.php?id=${driverId}`, { method: 'GET' });
  driverData = payload;
}

async function loadCurrentGasPrice() {
  const payload = await apiRequest('gas-price.php', { method: 'GET' });
  currentGasPrice = payload.gasPrice ?? 0;
}

async function loadRecentFuelAll() {
  try {
    const payload = await apiRequest('recent-fuel.php', { method: 'GET' });
    recentFuelAll = payload.entries ?? [];
    if (recentFuelAllSection) {
      recentFuelAllSection.dataset.error = 'false';
    }
  } catch (error) {
    recentFuelAll = [];
    if (recentFuelAllSection) {
      recentFuelAllSection.dataset.error = 'true';
      recentFuelAllSection.innerHTML = `
        <div class="card-header">
          <h3>Latest fuel entries</h3>
        </div>
        <p class="muted">Unable to load recent entries.</p>
      `;
    }
  }
}

logoutButton.addEventListener('click', async () => {
  try {
    await apiLogout();
  } finally {
    window.location.href = 'login.html';
  }
});

// Mobile menu functionality
if (hamburgerMenu && mobileMenu && logoutMobile) {
  hamburgerMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('active');
  });

  logoutMobile.addEventListener('click', async () => {
    try {
      await apiLogout();
    } finally {
      window.location.href = 'login.html';
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!hamburgerMenu.contains(event.target) && !mobileMenu.contains(event.target)) {
      mobileMenu.classList.remove('active');
    }
  });
}

function renderDriver() {
  if (!driverData) {
    renderError('Driver not found.');
    return;
  }

  const { driver, fuelEntries, payments, vehicles } = driverData;

  driverName.textContent = driver.name;
  renderRecentFuelAll();

  const totalFuel = sum(fuelEntries.map((entry) => Number(entry.amount)));
  const totalOwed = sum(
    fuelEntries.map(
      (entry) => Number(entry.amount) * Number(entry.price_per_unit)
    )
  );
  const totalPaid = sum(payments.map((payment) => Number(payment.amount)));
  const balance = totalOwed - totalPaid;

  summarySection.innerHTML = `
    <div class="user-summary">
      <div>
        <p class="summary-label">Total fuel</p>
        <p class="summary-value">${totalFuel.toFixed(2)} liters</p>
      </div>
      <div>
        <p class="summary-label">Total owed</p>
        <p class="summary-value">${formatCurrency(totalOwed)}</p>
      </div>
      <div>
        <p class="summary-label">Total paid</p>
        <p class="summary-value">${formatCurrency(totalPaid)}</p>
      </div>
      <div>
        <p class="summary-label">Balance</p>
        <p class="summary-value">${formatCurrency(balance)}</p>
      </div>
    </div>
  `;

  fuelSection.innerHTML = `
    <form class="stack" id="fuel-form">
      <h3>Add fuel entry <span class="muted">(Current price: ${formatPrice(currentGasPrice)}/L)</span></h3>
      <label>
        Vehicle
        <select name="vehicle" id="fuel-vehicle-select">
          <option value="">No vehicle</option>
        </select>
      </label>
      <label>
        Liters
        <input type="number" min="0" step="0.01" name="amount" required />
      </label>
      <label>
        Date
        <input type="date" name="date" required />
      </label>
      <button type="submit">Log fuel</button>
    </form>
  `;

  paymentSection.innerHTML = `
    <form class="stack" id="payment-form">
      <h3>Add payment</h3>
      <label>
        Amount paid
        <input type="number" min="0" step="0.01" name="amount" required />
      </label>
      <label>
        Date
        <input type="date" name="date" required />
      </label>
      <button type="submit" class="button-danger">Record payment</button>
    </form>
  `;

  historySection.innerHTML = `
    <div class="history-filters">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="10">Last 10</button>
      <button class="filter-btn" data-filter="30">Last 30</button>
      <button class="filter-btn" data-filter="90">Last 90 days</button>
    </div>
    <div class="user-history">
      <div>
        <h3>Fuel history</h3>
        <ul class="history-list" data-history="fuel"></ul>
      </div>
      <div>
        <h3>Payment history</h3>
        <ul class="history-list" data-history="payment"></ul>
      </div>
    </div>
  `;

  let currentFilter = 'all';

  historySection.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      historySection.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderHistory(document.querySelector("[data-history='fuel']"), fuelEntries, 'fuel', currentFilter);
      renderHistory(document.querySelector("[data-history='payment']"), payments, 'payment', currentFilter);
    });
  });

  const fuelForm = document.querySelector('#fuel-form');
  const paymentForm = document.querySelector('#payment-form');
  const fuelDateInput = fuelForm.querySelector("input[name='date']");
  const paymentDateInput = paymentForm.querySelector("input[name='date']");
  fuelDateInput.value = todayLocalDate();
  paymentDateInput.value = todayLocalDate();

  fuelForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = Number.parseFloat(
      fuelForm.querySelector("input[name='amount']").value
    );
    const date = fuelDateInput.value;
    const vehicleId = fuelForm.querySelector("select[name='vehicle']").value;
    if (!amount || !date) {
      return;
    }
    await apiRequest('gas-price.php', { method: 'GET' }).then(async (payload) => {
      await apiRequest('fuel-entries.php', {
        method: 'POST',
        body: JSON.stringify({
          driverId: driver.id,
          amount,
          date,
          pricePerUnit: payload.gasPrice,
          vehicleId: vehicleId || null,
        }),
      });
    });
    await Promise.all([loadDriverData(), loadRecentFuelAll()]);
    renderDriver();
    showToast('We have logged your fuel entry.');
  });

  paymentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = Number.parseFloat(
      paymentForm.querySelector("input[name='amount']").value
    );
    const date = paymentDateInput.value;
    if (!amount || !date) {
      return;
    }
    await apiRequest('payments.php', {
      method: 'POST',
      body: JSON.stringify({
        driverId: driver.id,
        amount,
        date,
      }),
    });
    await loadDriverData();
    renderDriver();
  });

  const fuelHistory = document.querySelector("[data-history='fuel']");
  const paymentHistory = document.querySelector("[data-history='payment']");

  renderHistory(fuelHistory, fuelEntries, 'fuel', 'all');
  renderHistory(paymentHistory, payments, 'payment', 'all');

  const fuelVehicleSelect = document.querySelector('#fuel-vehicle-select');
  if (fuelVehicleSelect) {
    const vehicleOptions = vehicles.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
    fuelVehicleSelect.innerHTML = `<option value="">No vehicle</option>${vehicleOptions}`;
  }

  renderVehicles(vehicles);
}

function renderRecentFuelAll() {
  if (!recentFuelAllSection || recentFuelAllSection.dataset.error === 'true') {
    return;
  }
  const latestEntry = recentFuelAll.slice(0, 1)[0];
  recentFuelAllSection.innerHTML = `
    <div class="card-header card-header-centered">
      <h3>Last Fuel Entry (please verify)</h3>
    </div>
    <div class="latest-liters" data-latest-liters></div>
  `;

  const litersContainer = recentFuelAllSection.querySelector("[data-latest-liters]");
  litersContainer.innerHTML = '';

  if (!latestEntry) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No fuel entries yet.';
    litersContainer.appendChild(empty);
    return;
  }

  const litersDisplay = document.createElement('div');
  litersDisplay.className = 'latest-liters-display';
  litersDisplay.innerHTML = `
    <div class="liters-value">${Number(latestEntry.amount).toFixed(2)}</div>
    <div class="liters-label">Liters</div>
  `;
  litersContainer.appendChild(litersDisplay);

  // Add report button
  const reportBody = [
    'Fuel entry report',
    `Driver: ${latestEntry.driver_name}`,
    `Date: ${formatDate(latestEntry.entry_date)}`,
    `Amount: ${Number(latestEntry.amount).toFixed(2)} liters`,
    `Price per liter: ${formatPrice(latestEntry.price_per_unit)}`,
  ].join('\n');
  const mailto = `mailto:brentjohnpeterson@gmail.com?subject=${encodeURIComponent(
    'Fuel entry report'
  )}&body=${encodeURIComponent(reportBody)}`;
  
  const reportButton = document.createElement('a');
  reportButton.className = 'link-button danger report-button';
  reportButton.href = mailto;
  reportButton.textContent = 'Report';
  recentFuelAllSection.appendChild(reportButton);
}

function renderVehicles(vehicles) {
  if (!vehiclesSection) return;

  vehiclesSection.innerHTML = `
    <div class="card-header">
      <h3>My Vehicles</h3>
      <button type="button" id="add-vehicle-btn" class="link-button">Add Vehicle</button>
    </div>
    <div class="vehicles-list" id="vehicles-list"></div>
  `;

  const vehiclesList = vehiclesSection.querySelector('#vehicles-list');
  
  if (vehicles.length === 0) {
    vehiclesList.innerHTML = '<p class="muted">No vehicles yet. Add one to start tracking fuel by vehicle.</p>';
  } else {
    vehiclesList.innerHTML = vehicles.map(vehicle => `
      <div class="vehicle-card">
        <div class="vehicle-header">
          <h4>${vehicle.name}</h4>
          <div class="vehicle-actions">
            <button class="link-button" data-edit-vehicle="${vehicle.id}">Edit</button>
            <button class="link-button danger" data-delete-vehicle="${vehicle.id}">Delete</button>
          </div>
        </div>
        <div class="vehicle-stats">
          <div class="vehicle-stat">
            <span class="stat-label">Current Month</span>
            <span class="stat-value">${vehicle.stats.currentMonth.amount.toFixed(2)} L (${formatCurrency(vehicle.stats.currentMonth.cost)})</span>
          </div>
          <div class="vehicle-stat">
            <span class="stat-label">Last Month</span>
            <span class="stat-value">${vehicle.stats.lastMonth.amount.toFixed(2)} L (${formatCurrency(vehicle.stats.lastMonth.cost)})</span>
          </div>
          <div class="vehicle-stat">
            <span class="stat-label">Current Year</span>
            <span class="stat-value">${vehicle.stats.currentYear ? vehicle.stats.currentYear.amount.toFixed(2) : '0.00'} L (${formatCurrency(vehicle.stats.currentYear ? vehicle.stats.currentYear.cost : 0)})</span>
          </div>
          <div class="vehicle-stat">
            <span class="stat-label">Last Year</span>
            <span class="stat-value">${vehicle.stats.lastYear.amount.toFixed(2)} L (${formatCurrency(vehicle.stats.lastYear.cost)})</span>
          </div>
          <div class="vehicle-stat">
            <span class="stat-label">Total</span>
            <span class="stat-value">${vehicle.stats.total.amount.toFixed(2)} L (${formatCurrency(vehicle.stats.total.cost)})</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  const addVehicleBtn = vehiclesSection.querySelector('#add-vehicle-btn');
  addVehicleBtn.addEventListener('click', () => openVehicleModal());

  vehiclesSection.querySelectorAll('[data-edit-vehicle]').forEach(button => {
    button.addEventListener('click', () => {
      const vehicleId = button.getAttribute('data-edit-vehicle');
      const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
      openVehicleModal(vehicle);
    });
  });

  vehiclesSection.querySelectorAll('[data-delete-vehicle]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this vehicle? Fuel entries will not be deleted but will no longer be associated with a vehicle.')) {
        return;
      }
      const vehicleId = button.getAttribute('data-delete-vehicle');
      await apiRequest(`vehicles.php?id=${vehicleId}`, { method: 'DELETE' });
      await loadDriverData();
      renderDriver();
    });
  });
}

function openVehicleModal(vehicle = null) {
  const isEdit = !!vehicle;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>${isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
      <form class="stack" id="vehicle-form">
        <label>
          Vehicle Name
          <input type="text" name="name" required value="${vehicle?.name || ''}" placeholder="e.g., Truck, Car, Van" />
        </label>
        <div class="modal-actions">
          <button type="button" class="link-button danger" data-cancel>Cancel</button>
          <button type="submit">${isEdit ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const removeModal = () => modal.remove();
  modal.querySelector('[data-cancel]').addEventListener('click', removeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) removeModal();
  });

  modal.querySelector('#vehicle-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = modal.querySelector("input[name='name']").value.trim();
    if (!name) return;

    if (isEdit) {
      await apiRequest(`vehicles.php?id=${vehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
    } else {
      await apiRequest('vehicles.php', {
        method: 'POST',
        body: JSON.stringify({ driverId, name }),
      });
    }
    
    await loadDriverData();
    renderDriver();
    removeModal();
  });
}

function renderHistory(container, items, type, filter = 'all') {
  container.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-item';
    empty.textContent = 'No entries yet.';
    container.appendChild(empty);
    return;
  }

  let filteredItems = items;
  
  if (filter !== 'all') {
    const days = parseInt(filter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    filteredItems = items.filter(item => {
      const itemDate = new Date(item.entry_date);
      return itemDate >= cutoffDate;
    });
  }

  filteredItems.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'history-item history-item-row';
    const content = type === 'fuel' ? formatFuelEntry(item) : formatPayment(item);
    listItem.innerHTML = `
      <span>${content}</span>
      <div class="history-actions">
        <button class="link-button" data-edit="${item.id}" data-type="${type}">Edit</button>
        <button class="link-button danger" data-delete="${item.id}" data-type="${type}">Delete</button>
      </div>
    `;
    container.appendChild(listItem);
  });

  container.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-edit');
        const entryType = button.getAttribute('data-type');
        openEditModal(entryType, id);
      });
    });
    container.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-delete');
        const entryType = button.getAttribute('data-type');
        const endpoint = entryType === 'fuel' ? 'fuel-entries.php' : 'payments.php';
        await apiRequest(`${endpoint}?id=${id}`, { method: 'DELETE' });
        await loadDriverData();
        renderDriver();
      });
    });
}

function openEditModal(type, id) {
  const entry = type === 'fuel'
    ? driverData.fuelEntries.find((item) => String(item.id) === String(id))
    : driverData.payments.find((item) => String(item.id) === String(id));

  if (!entry) {
    return;
  }

  const vehicles = driverData.vehicles || [];
  const vehicleOptions = vehicles.map(v => 
    `<option value="${v.id}" ${String(entry.vehicle_id) === String(v.id) ? 'selected' : ''}>${v.name}</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Edit ${type === 'fuel' ? 'fuel entry' : 'payment'}</h3>
      <form class="stack" id="edit-form">
        ${
          type === 'fuel'
            ? `<label>
                Vehicle
                <select name="vehicle">
                  <option value="">No vehicle</option>
                  ${vehicleOptions}
                </select>
              </label>`
            : ''
        }
        <label>
          Amount
          <input type="number" min="0" step="0.01" name="amount" required value="${entry.amount}" />
        </label>
        <label>
          Date
          <input type="date" name="date" required value="${entry.entry_date}" />
        </label>
        ${
          type === 'fuel'
            ? `<label>
                Price per liter
                <input type="number" min="0" step="0.0001" name="price" required value="${entry.price_per_unit}" />
              </label>`
            : ''
        }
        <div class="modal-actions">
          <button type="button" class="link-button danger" data-cancel>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const removeModal = () => {
    modal.remove();
  };

  modal.querySelector('[data-cancel]').addEventListener('click', removeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      removeModal();
    }
  });

  modal.querySelector('#edit-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      amount: Number.parseFloat(formData.get('amount')),
      date: formData.get('date'),
    };
    if (type === 'fuel') {
      payload.pricePerUnit = Number.parseFloat(formData.get('price'));
      const vehicleId = formData.get('vehicle');
      payload.vehicleId = vehicleId ? vehicleId : null;
    }

    const endpoint = type === 'fuel' ? 'fuel-entries.php' : 'payments.php';
    await apiRequest(`${endpoint}?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    await loadDriverData();
    renderDriver();
    removeModal();
  });
}

function renderError(message) {
  if (driverName) {
    driverName.textContent = 'Driver not found';
  }
  if (recentFuelAllSection) {
    recentFuelAllSection.classList.remove('highlight-card');
    recentFuelAllSection.innerHTML = '';
  }
  if (fuelSection) {
    fuelSection.innerHTML = '';
  }
  if (summarySection) {
    summarySection.innerHTML = `<p class="error">${message}</p>`;
  }
  if (paymentSection) {
    paymentSection.innerHTML = '';
  }
  if (historySection) {
    historySection.innerHTML = '';
  }
}
