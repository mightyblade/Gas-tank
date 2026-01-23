const loginForm = document.querySelector('#login-form');
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const errorText = document.querySelector('#login-error');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorText.classList.add('hidden');
  try {
    if (shouldUseDemoData()) {
      window.location.href = 'driver.html?id=1&demo=1';
      return;
    }

    const username = usernameInput.value.trim();
    if (!username) {
      errorText.textContent = 'Please enter a username.';
      errorText.classList.remove('hidden');
      return;
    }

    const payload = await apiLogin('user', passwordInput.value, null, username);
    window.location.href = `driver.html?id=${payload.driverId}`;
  } catch (error) {
    errorText.textContent = error.message;
    errorText.classList.remove('hidden');
  }
});
