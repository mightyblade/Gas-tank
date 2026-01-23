const state = loadState();
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

const driverName = document.querySelector("#driver-name");
const driverMeta = document.querySelector("#driver-meta");
const summarySection = document.querySelector("#driver-summary");
const actionsSection = document.querySelector("#driver-actions");
const historySection = document.querySelector("#driver-history");

const user = userId ? getUserById(state, userId) : null;

if (!user) {
  driverName.textContent = "Driver not found";
  driverMeta.textContent = "Check the link and try again.";
  summarySection.innerHTML = "";
  actionsSection.innerHTML = "";
  historySection.innerHTML = "";
} else {
  renderDriver();
}

function renderDriver() {
  driverName.textContent = user.name;
  driverMeta.textContent = `Driver ID: ${user.id}`;

  const totalFuel = sum(user.fuelEntries.map((entry) => entry.amount));
  const totalOwed = sum(
    user.fuelEntries.map((entry) => entry.amount * entry.pricePerUnit)
  );
  const totalPaid = sum(user.payments.map((payment) => payment.amount));
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

  const fuelForm = document.querySelector("#fuel-form");
  const paymentForm = document.querySelector("#payment-form");
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
    saveState(state);
    renderDriver();
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
    saveState(state);
    renderDriver();
  });

  const fuelHistory = document.querySelector("[data-history='fuel']");
  const paymentHistory = document.querySelector("[data-history='payment']");

  renderHistory(fuelHistory, user.fuelEntries.map((entry) => formatFuelEntry(entry)));
  renderHistory(paymentHistory, user.payments.map((payment) => formatPayment(payment)));
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
