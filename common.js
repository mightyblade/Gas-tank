const API_BASE = './api';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}/${path}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

async function apiLogin(role, password, driverId = null, username = '') {
  return apiRequest('login.php', {
    method: 'POST',
    body: JSON.stringify({ role, password, driverId, username }),
  });
}

async function apiLogout() {
  return apiRequest('logout.php', { method: 'POST' });
}

async function getSessionRole() {
  const payload = await apiRequest('status.php', { method: 'GET' });
  return payload.role;
}

async function getSessionInfo() {
  return apiRequest('status.php', { method: 'GET' });
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatPrice(value) {
  return `$${Number(value).toFixed(4)}`;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function formatFuelEntry(entry) {
  return `${entry.entry_date}: ${Number(entry.amount).toFixed(2)} liters @ ${formatPrice(
    entry.price_per_unit
  )} = ${formatCurrency(entry.amount * entry.price_per_unit)}`;
}

function formatPayment(payment) {
  return `${payment.entry_date}: ${formatCurrency(payment.amount)} paid`;
}

function shouldUseDemoData() {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === '1';
}

function demoData() {
  return {
    gasPrice: 3.45,
    drivers: [
      {
        id: 1,
        name: 'Alex',
        latestFuel: {
          id: 1,
          amount: 12.5,
          entry_date: '2024-03-10',
          price_per_unit: 3.45,
        },
      },
    ],
    driverDetail: {
      driver: { id: 1, name: 'Alex' },
      fuelEntries: [
        { id: 3, amount: 7.0, entry_date: '2024-03-12', price_per_unit: 3.45 },
        { id: 2, amount: 8.5, entry_date: '2024-03-01', price_per_unit: 3.35 },
        { id: 1, amount: 12.5, entry_date: '2024-02-10', price_per_unit: 3.25 },
      ],
      payments: [{ id: 1, amount: 20.0, entry_date: '2024-03-15' }],
    },
    recentFuel: [
      { id: 4, driver_name: 'Casey', amount: 11.2, entry_date: '2024-03-18', price_per_unit: 3.52 },
      { id: 3, driver_name: 'Alex', amount: 7.0, entry_date: '2024-03-12', price_per_unit: 3.45 },
    ],
  };
}
