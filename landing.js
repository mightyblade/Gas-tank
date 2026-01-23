const state = loadState();
const driverList = document.querySelector("#driver-list");
const currentPrice = document.querySelector("#current-price");

currentPrice.textContent = formatCurrency(state.gasPrice);

renderDrivers();

function renderDrivers() {
  driverList.innerHTML = "";

  if (state.users.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No drivers yet. Add one in Admin settings.";
    driverList.appendChild(empty);
    return;
  }

  state.users.forEach((user) => {
    const totalOwed = sum(
      user.fuelEntries.map((entry) => entry.amount * entry.pricePerUnit)
    );
    const totalPaid = sum(user.payments.map((payment) => payment.amount));
    const balance = totalOwed - totalPaid;

    const card = document.createElement("article");
    card.className = "card driver-card";

    card.innerHTML = `
      <div>
        <h3>${user.name}</h3>
        <p class="muted">Driver ID: ${user.id}</p>
      </div>
      <div>
        <p class="summary-label">Balance</p>
        <p class="summary-value">${formatCurrency(balance)}</p>
      </div>
      <a class="link-button" href="driver.html?id=${user.id}">Open driver page</a>
    `;

    driverList.appendChild(card);
  });
}
