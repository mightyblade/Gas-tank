const driverList = document.querySelector('#driver-list');
const currentPrice = document.querySelector('#current-price');
const logoutButton = document.querySelector('#logout');

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

    const [pricePayload, driversPayload] = await Promise.all([
      apiRequest('gas-price.php', { method: 'GET' }),
      apiRequest('drivers.php', { method: 'GET' }),
    ]);

    renderLanding({
      gasPrice: pricePayload.gasPrice,
      drivers: driversPayload.drivers,
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
  currentPrice.textContent = formatCurrency(data.gasPrice);
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

function renderError(message) {
  driverList.innerHTML = `
    <p class="error">Unable to load drivers: ${message}</p>
  `;
}
