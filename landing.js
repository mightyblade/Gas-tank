const driverList = document.querySelector('#driver-list');
const currentPrice = document.querySelector('#current-price');
const logoutButton = document.querySelector('#logout');
const lastFuelAmount = document.querySelector('#last-fuel-amount');
const lastFuelReport = document.querySelector('#last-fuel-report');

init();

async function init() {
  try {
    if (shouldUseDemoData()) {
      renderLanding(demoData());
      return;
    }

    const role = await getSessionRole();
    if (!role) {
      window.location.href = 'login.html';
      return;
    }

    const [pricePayload, driversPayload, recentFuelPayload] = await Promise.all([
      apiRequest('gas-price.php', { method: 'GET' }),
      apiRequest('drivers.php', { method: 'GET' }),
      apiRequest('recent-fuel.php', { method: 'GET' }),
    ]);

    renderLanding({
      gasPrice: pricePayload.gasPrice,
      drivers: driversPayload.drivers,
      recentFuel: recentFuelPayload.entries,
    });
  } catch (error) {
    renderError(error.message);
  }
}

logoutButton.addEventListener('click', async () => {
  try {
    await apiLogout();
  } finally {
    window.location.href = 'login.html';
  }
});

function renderLanding(data) {
  currentPrice.textContent = formatPrice(data.gasPrice);
  renderLastFuel(data.recentFuel);
  driverList.innerHTML = '';

  if (data.drivers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No drivers yet. Add one in Admin settings.';
    driverList.appendChild(empty);
    return;
  }

  data.drivers.forEach((driver) => {
    const latestFuelEntry = driver.latestFuel;
    const card = document.createElement('article');
    card.className = 'card driver-card';

    card.innerHTML = `
      <div>
        <h3>${driver.name}</h3>
        <p class="muted">Driver ID: ${driver.id}</p>
      </div>
      <div>
        <p class="summary-label">Most recent fuel log</p>
        <p class="summary-value">
          ${latestFuelEntry ? formatFuelEntry(latestFuelEntry) : 'No fuel logged.'}
        </p>
      </div>
      <a class="link-button" href="driver.html?id=${driver.id}">Open driver page</a>
    `;

    driverList.appendChild(card);
  });
}

function renderLastFuel(entries = []) {
  lastFuelAmount.textContent = 'No entries';
  lastFuelReport.innerHTML = '';
  
  if (!entries.length) {
    return;
  }

  const lastEntry = entries[0]; // Get the most recent entry
  lastFuelAmount.textContent = Number(lastEntry.amount).toFixed(1);
  
  // Create report button
  const reportBody = [
    'Fuel entry report',
    `Driver: ${lastEntry.driver_name}`,
    `Date: ${formatDate(lastEntry.entry_date)}`,
    `Amount: ${Number(lastEntry.amount).toFixed(2)} liters`,
    `Price per liter: ${formatPrice(lastEntry.price_per_unit)}`,
  ].join('\n');
  
  const mailto = `mailto:brentjohnpeterson@gmail.com?subject=${encodeURIComponent(
    'Fuel entry report'
  )}&body=${encodeURIComponent(reportBody)}`;
  
  lastFuelReport.innerHTML = `<a class="link-button" href="${mailto}" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">Report</a>`;
}

function renderError(message) {
  driverList.innerHTML = `
    <p class="error">Unable to load drivers: ${message}</p>
  `;
}
