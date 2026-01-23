const STORAGE_KEY = "gas-tank-tracker";

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        gasPrice: parsed.gasPrice ?? 0,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        adminPassword: parsed.adminPassword ?? null,
      };
    } catch (error) {
      console.warn("Unable to parse saved state", error);
    }
  }
  return { gasPrice: 0, users: [], adminPassword: null };
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function formatFuelEntry(entry) {
  return `${entry.date}: ${entry.amount.toFixed(2)} units @ ${formatCurrency(
    entry.pricePerUnit
  )} = ${formatCurrency(entry.amount * entry.pricePerUnit)}`;
}

function formatPayment(payment) {
  return `${payment.date}: ${formatCurrency(payment.amount)} paid`;
}

function getUserById(state, userId) {
  return state.users.find((user) => user.id === userId);
}
