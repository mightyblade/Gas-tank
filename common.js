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

// Returns today's date as YYYY-MM-DD in Mountain Time (handles MST/MDT automatically)
function todayLocalDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
}

// Formats a YYYY-MM-DD date string for display in Mountain Time (e.g. "Mar 10, 2024")
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatFuelEntry(entry) {
  const total = Number(entry.amount) * Number(entry.price_per_unit);
  return `${formatDate(entry.entry_date)}: ${Number(entry.amount).toFixed(2)} liters @ ${formatPrice(
    entry.price_per_unit
  )} = ${formatCurrency(total)}`;
}

function formatPayment(payment) {
  return `${formatDate(payment.entry_date)}: ${formatCurrency(payment.amount)} paid`;
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
      driver: { id: 1, name: 'Alex', tank_size: 80, starting_fuel_level: 40, current_fuel_level: 35 },
      vehicles: [
        { id: 1, driver_id: 1, name: 'Truck', stats: { total: { amount: 150, cost: 517.5 }, currentMonth: { amount: 45, cost: 155.25 }, lastMonth: { amount: 30, cost: 103.5 }, currentYear: { amount: 75, cost: 258.75 }, lastYear: { amount: 200, cost: 690 } } },
        { id: 2, driver_id: 1, name: 'Car', stats: { total: { amount: 80, cost: 276 }, currentMonth: { amount: 20, cost: 69 }, lastMonth: { amount: 15, cost: 51.75 }, currentYear: { amount: 35, cost: 120.75 }, lastYear: { amount: 100, cost: 345 } } }
      ],
      fuelEntries: [
        { id: 3, vehicle_id: 1, amount: 7.0, entry_date: '2024-03-12', price_per_unit: 3.45 },
        { id: 2, vehicle_id: 2, amount: 8.5, entry_date: '2024-03-01', price_per_unit: 3.35 },
        { id: 1, vehicle_id: 1, amount: 12.5, entry_date: '2024-02-10', price_per_unit: 3.25 },
      ],
      payments: [{ id: 1, amount: 20.0, entry_date: '2024-03-15' }],
    },
    recentFuel: [
      { id: 4, driver_name: 'Casey', amount: 11.2, entry_date: '2024-03-18', price_per_unit: 3.52 },
      { id: 3, driver_name: 'Alex', amount: 7.0, entry_date: '2024-03-12', price_per_unit: 3.45 },
    ],
  };
}
