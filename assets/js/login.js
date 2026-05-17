function getRedirect() {
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || 'index.html';
  return redirect === 'index.html' ? '../index.html' : redirect;
}

function handleLogin(e) {
  e.preventDefault();
  const account = document.getElementById('account').value.trim();
  const password = document.getElementById('password').value.trim();
  const isAdmin = document.getElementById('adminLogin').checked;
  if (!account || !password) {
    document.getElementById('loginError').textContent = '请输入账号和密码';
    return;
  }
  CucuAuth.login(isAdmin ? '经销商老板' : (account === 'cucu.design' ? '楚楚成员顾问' : account), {
    isAdmin,
    account: isAdmin ? 'dealer.admin' : account
  });
  location.href = isAdmin ? 'admin.html' : getRedirect();
}

function demoLogin() {
  const isAdmin = document.getElementById('adminLogin').checked;
  CucuAuth.login(isAdmin ? '经销商老板' : '楚楚成员顾问', {
    isAdmin,
    account: isAdmin ? 'dealer.admin' : 'cucu.design'
  });
  location.href = isAdmin ? 'admin.html' : getRedirect();
}



