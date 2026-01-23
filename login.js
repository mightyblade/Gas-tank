const loginForm = document.querySelector('#login-form');
const passwordInput = document.querySelector('#password');
const errorText = document.querySelector('#login-error');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorText.classList.add('hidden');
  try {
    await apiLogin('user', passwordInput.value);
    window.location.href = 'index.html';
  } catch (error) {
    errorText.textContent = error.message;
    errorText.classList.remove('hidden');
  }
});
