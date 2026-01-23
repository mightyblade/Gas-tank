const params = new URLSearchParams(window.location.search);
const driverId = params.get('id');

const driverName = document.querySelector('#driver-name');
const driverMeta = document.querySelector('#driver-meta');
const recentFuelSection = document.querySelector('#recent-fuel');
const summarySection = document.querySelector('#driver-summary');
const actionsSection = document.querySelector('#driver-actions');
const historySection = document.querySelector('#driver-history');
const logoutButton = document.querySelector('#logout');

let currentRole = null;
let driverData = null;

init();

async function init() {
  try {
    if (shouldUseDemoData()) {
      currentRole = 'admin';
      driverData = demoData().driverDetail;
      renderDriver();
      return;
    }

    currentRole = await getSessionRole();
    if (!currentRole) {
      window.location.href = 'login.html';
      return;
    }

    await loadDriverData();
    renderDriver();
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

logoutButton.addEventListener('click', async () => {
  try {
    await apiLogout();
  } finally {
    window.location.href = 'login.html';
  }
});

function renderDriver() {
  if (!driverData) {
    renderError('Driver not found.');
    return;
  }

  const { driver, fuelEntries, payments } = driverData;

  driverName.textContent = driver.name;
  driverMeta.textContent = `Driver ID: ${driver.id}`;

  renderRecentFuel(fuelEntries);

  const totalFuel = sum(fuelEntries.map((entry) => Number(entry.amount)));
  const totalOwed = sum(
    fuelEntries.map((entry) => Number(entry.amount) * Number(entry.price_per_unit))
  );
  const totalPaid = sum(payments.map((payment) => Number(payment.amount)));
  const balance = totalOwed - totalPaid;

  summarySection.innerHTML = `
    <div class="user-summary">
      <div>
        <p class="summary-label">Total fuel</p>
        <p class="summary-value">${totalFuel.toFixed(2)} units</p>
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

  actionsSection.innerHTML = `
    <div class="user-actions">
      <form class="stack" id="fuel-form">
        <h3>Add fuel entry</h3>
        <label>
          Amount used
          <input type="number" min="0" step="0.01" name="amount" required />
        </label>
        <label>
          Date
          <input type="date" name="date" required />
        </label>
        <button type="submit">Log fuel</button>
      </form>
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
        <button type="submit">Record payment</button>
      </form>
    </div>
  `;

  historySection.innerHTML = `
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

  const fuelForm = document.querySelector('#fuel-form');
  const paymentForm = document.querySelector('#payment-form');
  const fuelDateInput = fuelForm.querySelector("input[name='date']");
  const paymentDateInput = paymentForm.querySelector("input[name='date']");
  fuelDateInput.valueAsDate = new Date();
  paymentDateInput.valueAsDate = new Date();

  fuelForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = Number.parseFloat(
      fuelForm.querySelector("input[name='amount']").value
    );
    const date = fuelDateInput.value;
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
        }),
      });
    });
    await loadDriverData();
    renderDriver();
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

  renderHistory(fuelHistory, fuelEntries, 'fuel');
  renderHistory(paymentHistory, payments, 'payment');
}

function renderRecentFuel(fuelEntries) {
  const recentEntries = fuelEntries.slice(0, 10);
  recentFuelSection.innerHTML = `
    <div class="card-header">
      <h3>Recent fuel entries</h3>
      ${currentRole === 'admin' ? '<span class="pill">Admin can delete</span>' : ''}
    </div>
    <ul class="history-list" data-history="recent-fuel"></ul>
  `;

  const list = recentFuelSection.querySelector("[data-history='recent-fuel']");
  renderHistory(list, recentEntries, 'fuel');
}

function renderHistory(container, items, type) {
  container.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-item';
    empty.textContent = 'No entries yet.';
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'history-item history-item-row';
    const content = type === 'fuel' ? formatFuelEntry(item) : formatPayment(item);
    listItem.innerHTML = `
      <span>${content}</span>
      ${currentRole === 'admin' ? `<button class="link-button danger" data-delete="${item.id}" data-type="${type}">Delete</button>` : ''}
    `;
    container.appendChild(listItem);
  });

  if (currentRole === 'admin') {
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
}

function renderError(message) {
  driverName.textContent = 'Driver not found';
  driverMeta.textContent = message;
  recentFuelSection.innerHTML = '';
  summarySection.innerHTML = '';
  actionsSection.innerHTML = '';
  historySection.innerHTML = '';
}
