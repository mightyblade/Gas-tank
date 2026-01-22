const STORAGE_KEY = "gas-tank-tracker";

const priceForm = document.querySelector("#price-form");
const priceInput = document.querySelector("#price-input");
const currentPrice = document.querySelector("#current-price");
const userForm = document.querySelector("#user-form");
const userNameInput = document.querySelector("#user-name");
const userList = document.querySelector("#user-list");
const userTemplate = document.querySelector("#user-card-template");

const state = loadState();

render();

priceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = Number.parseFloat(priceInput.value);
  if (Number.isNaN(value)) {
    return;
  }
  state.gasPrice = value;
  priceInput.value = "";
  saveState();
  render();
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
  saveState();
  render();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        gasPrice: parsed.gasPrice ?? 0,
        users: parsed.users ?? [],
      };
    } catch (error) {
      console.warn("Unable to parse saved state", error);
    }
  }
  return { gasPrice: 0, users: [] };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  currentPrice.textContent = formatCurrency(state.gasPrice);
  userList.innerHTML = "";

  if (state.users.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No drivers yet. Add one to get started.";
    userList.appendChild(empty);
    return;
  }

  state.users.forEach((user) => {
    const card = userTemplate.content.cloneNode(true);
    const nameEl = card.querySelector(".user-name");
    const idEl = card.querySelector(".user-id");
    const fuelEl = card.querySelector("[data-summary='fuel']");
    const owedEl = card.querySelector("[data-summary='owed']");
    const paidEl = card.querySelector("[data-summary='paid']");
    const balanceEl = card.querySelector("[data-summary='balance']");
    const fuelForm = card.querySelector(".fuel-form");
    const paymentForm = card.querySelector(".payment-form");
    const fuelHistory = card.querySelector("[data-history='fuel']");
    const paymentHistory = card.querySelector("[data-history='payment']");

    nameEl.textContent = user.name;
    idEl.textContent = `Driver ID: ${user.id}`;

    const totalFuel = sum(user.fuelEntries.map((entry) => entry.amount));
    const totalOwed = sum(
      user.fuelEntries.map((entry) => entry.amount * entry.pricePerUnit)
    );
    const totalPaid = sum(user.payments.map((payment) => payment.amount));
    const balance = totalOwed - totalPaid;

    fuelEl.textContent = `${totalFuel.toFixed(2)} units`;
    owedEl.textContent = formatCurrency(totalOwed);
    paidEl.textContent = formatCurrency(totalPaid);
    balanceEl.textContent = formatCurrency(balance);

    const fuelDateInput = fuelForm.querySelector("input[name='date']");
    const paymentDateInput = paymentForm.querySelector("input[name='date']");
    fuelDateInput.valueAsDate = new Date();
    paymentDateInput.valueAsDate = new Date();

    fuelForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const amount = Number.parseFloat(
        fuelForm.querySelector("input[name='amount']").value
      );
      const date = fuelDateInput.value;
      if (!amount || !date) {
        return;
      }
      user.fuelEntries.push({
        id: crypto.randomUUID(),
        amount,
        date,
        pricePerUnit: state.gasPrice,
      });
      saveState();
      render();
    });

    paymentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const amount = Number.parseFloat(
        paymentForm.querySelector("input[name='amount']").value
      );
      const date = paymentDateInput.value;
      if (!amount || !date) {
        return;
      }
      user.payments.push({
        id: crypto.randomUUID(),
        amount,
        date,
      });
      saveState();
      render();
    });

    renderHistory(
      fuelHistory,
      user.fuelEntries.map((entry) =>
        formatFuelEntry(entry, state.gasPrice)
      )
    );
    renderHistory(
      paymentHistory,
      user.payments.map((payment) => formatPayment(payment))
    );

    userList.appendChild(card);
  });
}

function renderHistory(container, items) {
  container.innerHTML = "";
  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-item";
    empty.textContent = "No entries yet.";
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className = "history-item";
    listItem.textContent = item;
    container.appendChild(listItem);
  });
}

function formatFuelEntry(entry) {
  return `${entry.date}: ${entry.amount.toFixed(2)} units @ ${formatCurrency(
    entry.pricePerUnit
  )} = ${formatCurrency(entry.amount * entry.pricePerUnit)}`;
}

function formatPayment(payment) {
  return `${payment.date}: ${formatCurrency(payment.amount)} paid`;
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
