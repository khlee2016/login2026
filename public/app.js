const authCard = document.querySelector('#authCard');
const dashboard = document.querySelector('#dashboard');
const form = document.querySelector('#authForm');
const title = document.querySelector('#title');
const usernameInput = document.querySelector('#username');
const passwordInput = document.querySelector('#password');
const message = document.querySelector('#message');
const submitButton = document.querySelector('#submitButton');
const switchButton = document.querySelector('#switchButton');
const switchPrompt = document.querySelector('#switchPrompt');
const displayName = document.querySelector('#displayName');

let mode = 'login';

function showDashboard(username) {
  displayName.textContent = username;
  authCard.hidden = true;
  dashboard.hidden = false;
}

function showAuth() {
  dashboard.hidden = true;
  authCard.hidden = false;
}

async function checkSession() {
  const response = await fetch('/api/me');
  if (response.ok) {
    const data = await response.json();
    if (data.username) showDashboard(data.username);
  }
}

switchButton.addEventListener('click', () => {
  mode = mode === 'login' ? 'register' : 'login';
  message.textContent = '';
  title.textContent = mode === 'login' ? '로그인' : '회원가입';
  submitButton.textContent = mode === 'login' ? '로그인' : '회원가입';
  switchPrompt.textContent = mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?';
  switchButton.textContent = mode === 'login' ? '회원가입' : '로그인';
  passwordInput.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  usernameInput.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventEvent?.();
  event.preventDefault();
  message.textContent = '';
  submitButton.disabled = true;

  try {
    const response = await fetch(`/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || '요청을 처리할 수 없습니다.');
    showDashboard(data.username);
    form.reset();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector('#logoutButton').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showAuth();
  usernameInput.focus();
});

checkSession();
