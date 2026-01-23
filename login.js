const loginForm = document.querySelector('#login-form');
const passwordInput = document.querySelector('#password');
const errorText = document.querySelector('#login-error');
const driverSelect = document.querySelector('#driver-select');

init();

async function init() {
  try {
    if (shouldUseDemoData()) {
      populateDrivers(demoData().drivers);
      return;
    }

    const payload = await apiRequest('public-drivers.php', { method: 'GET' });
    populateDrivers(payload.drivers);
  } catch (error) {
    errorText.textContent = error.message;
    errorText.classList.remove('hidden');
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorText.classList.add('hidden');
  try {
    if (shouldUseDemoData()) {
      window.location.href = `driver.html?id=${driverSelect.value}&demo=1`;
      return;
    }

    if (!driverSelect.value) {
      errorText.textContent = 'Please select a driver.';
      errorText.classList.remove('hidden');
      return;
    }

    const payload = await apiLogin('user', passwordInput.value, driverSelect.value);
    window.location.href = `driver.html?id=${payload.driverId}`;
  } catch (error) {
    errorText.textContent = error.message;
    errorText.classList.remove('hidden');
  }
});

function populateDrivers(drivers) {
  driverSelect.innerHTML = '';
  if (!drivers.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No drivers available';
    driverSelect.appendChild(option);
    driverSelect.disabled = true;
    return;
  }

  driverSelect.disabled = false;
  drivers.forEach((driver) => {
    const option = document.createElement('option');
    option.value = driver.id;
    option.textContent = driver.name;
    driverSelect.appendChild(option);
  });

  if (driverSelect.value === '' && drivers.length > 0) {
    driverSelect.value = drivers[0].id;
  }
}
