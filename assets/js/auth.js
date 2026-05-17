(function () {
  const SESSION_KEY = 'cucu_ai_user';
  const DEALER_KEY = 'cucu_dealer_workspace';
  const publicPages = ['login.html'];
  const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isPagesRoute = location.pathname.split('/').includes('pages');

  function pageUrl(page) {
    if (page === 'index.html') return isPagesRoute ? '../index.html' : 'index.html';
    return isPagesRoute ? page : `pages/${page}`;
  }

  function seedDealerWorkspace() {
    const existing = localStorage.getItem(DEALER_KEY);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch (e) {
        localStorage.removeItem(DEALER_KEY);
      }
    }
    const workspace = {
      dealerName: '楚楚杭州经销商',
      ownerName: '经销商老板',
      sharedCoins: 328,
      rechargeTotal: 1200,
      designers: [
        { id: 'd001', name: '楚楚成员顾问', account: 'cucu.design', role: '空间成员顾问', usedCoins: 86.4, images: 142, videos: 2, lastActive: '2026-05-09 09:42' },
        { id: 'd002', name: '李成员', account: 'li.design', role: '门店成员', usedCoins: 52.8, images: 96, videos: 1, lastActive: '2026-05-08 18:15' },
        { id: 'd003', name: '王成员', account: 'wang.design', role: '门店成员', usedCoins: 31.6, images: 79, videos: 0, lastActive: '2026-05-07 16:20' },
        { id: 'd004', name: '陈成员', account: 'chen.design', role: '外拓成员', usedCoins: 18.4, images: 46, videos: 0, lastActive: '2026-05-06 11:08' }
      ],
      transactions: [
        { type: '充值', user: '经销商老板', amount: 500, time: '2026-05-08 14:10', note: '门店月度补充' },
        { type: '消费', user: '楚楚成员顾问', amount: -12, time: '2026-05-09 09:42', note: '视频生成' },
        { type: '消费', user: '李成员', amount: -0.8, time: '2026-05-08 18:15', note: '图片生成 2 张' }
      ]
    };
    localStorage.setItem(DEALER_KEY, JSON.stringify(workspace));
    return workspace;
  }

  function saveDealerWorkspace(workspace) {
    localStorage.setItem(DEALER_KEY, JSON.stringify(workspace));
  }

  function getDealerWorkspace() {
    return seedDealerWorkspace();
  }

  function normalizeUser(user) {
    if (!user) return null;
    const normalized = { ...user };
    const legacyBalanceKey = 'cre' + 'dits';
    if (normalized.coins == null) {
      normalized.coins = normalized[legacyBalanceKey] == null ? getDealerWorkspace().sharedCoins : normalized[legacyBalanceKey];
    }
    if (legacyBalanceKey in normalized) {
      delete normalized[legacyBalanceKey];
    }
    if (!normalized.roleType) normalized.roleType = normalized.isAdmin ? 'admin' : 'designer';
    if (!normalized.dealerName) normalized.dealerName = getDealerWorkspace().dealerName;
    localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function getUser() {
    try {
      const user = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return normalizeUser(user);
    } catch (e) {
      return null;
    }
  }

  function defaultUser(name, options = {}) {
    const workspace = getDealerWorkspace();
    const isAdmin = Boolean(options.isAdmin);
    const account = options.account || (isAdmin ? 'dealer.admin' : 'cucu.design');
    const designer = workspace.designers.find((item) => item.account === account) || workspace.designers[0];
    return {
      name: name || (isAdmin ? workspace.ownerName : designer.name),
      account,
      roleType: isAdmin ? 'admin' : 'designer',
      role: isAdmin ? '经销商管理员' : designer.role,
      phone: isAdmin ? '139****8888' : '138****2026',
      department: workspace.dealerName,
      dealerName: workspace.dealerName,
      coins: workspace.sharedCoins,
      lastLogin: new Date().toLocaleString('zh-CN', { hour12: false })
    };
  }

  function getCoinBalance() {
    return Number(getDealerWorkspace().sharedCoins || 0);
  }

  function syncUserCoins() {
    const user = getUser();
    if (!user) return;
    user.coins = getCoinBalance();
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function renderCoinBalance() {
    const balance = getCoinBalance();
    document.querySelectorAll('[data-coin-balance]').forEach((el) => {
      el.textContent = balance;
    });
  }

  if (!publicPages.includes(currentPage) && !getUser()) {
    location.replace(pageUrl('login.html') + '?redirect=' + encodeURIComponent(currentPage));
    return;
  }

  if (currentPage === 'admin.html') {
    const user = getUser();
    if (user && user.roleType !== 'admin') {
      location.replace(pageUrl('index.html'));
      return;
    }
  }

  window.CucuAuth = {
    login(name, options = {}) {
      const user = defaultUser(name, options);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    },
    logout() {
      localStorage.removeItem(SESSION_KEY);
      location.href = pageUrl('login.html');
    },
    user() {
      return getUser() || defaultUser();
    },
    dealer() {
      return getDealerWorkspace();
    },
    coins() {
      return getCoinBalance();
    },
    rechargeCoins(amount, note = '管理员充值') {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) return false;
      const workspace = getDealerWorkspace();
      workspace.sharedCoins = Math.round((Number(workspace.sharedCoins || 0) + value) * 100) / 100;
      workspace.rechargeTotal = Math.round((Number(workspace.rechargeTotal || 0) + value) * 100) / 100;
      workspace.transactions.unshift({
        type: '充值',
        user: this.user().name,
        amount: value,
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        note
      });
      saveDealerWorkspace(workspace);
      syncUserCoins();
      renderCoinBalance();
      return true;
    },
    chargeCoins(cost, meta = {}) {
      const value = Number(cost);
      if (!Number.isFinite(value) || value <= 0) return false;
      const workspace = getDealerWorkspace();
      const balance = Number(workspace.sharedCoins || 0);
      if (balance < value) return false;
      const user = this.user();
      workspace.sharedCoins = Math.round((balance - value) * 100) / 100;
      const designer = workspace.designers.find((item) => item.account === user.account || item.name === user.name);
      if (designer) {
        designer.usedCoins = Math.round((Number(designer.usedCoins || 0) + value) * 100) / 100;
        if (meta.kind === 'video') designer.videos = Number(designer.videos || 0) + 1;
        else designer.images = Number(designer.images || 0) + Number(meta.count || 1);
        designer.lastActive = new Date().toLocaleString('zh-CN', { hour12: false });
      }
      workspace.transactions.unshift({
        type: '消费',
        user: user.name,
        amount: -value,
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        note: meta.note || (meta.kind === 'video' ? '视频生成' : `图片生成 ${meta.count || 1} 张`)
      });
      saveDealerWorkspace(workspace);
      syncUserCoins();
      renderCoinBalance();
      return true;
    },
    pageUrl(page) {
      return pageUrl(page);
    }
  };

  function injectProfileStyles() {
    if (document.getElementById('profile-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'profile-modal-styles';
    style.textContent = `
      .profile-overlay{position:fixed;inset:0;background:rgba(43,39,35,0.26);backdrop-filter:blur(10px);z-index:1000;display:none;align-items:flex-start;justify-content:flex-end;padding:74px 32px 24px;}
      .profile-overlay.show{display:flex;}
      .profile-card{width:320px;border:1px solid var(--border);border-radius:14px;background:rgba(249,243,237,0.96);box-shadow:0 24px 70px rgba(86,53,36,0.18);overflow:hidden;color:var(--text-primary);}
      .profile-head{padding:20px;border-bottom:1px solid var(--border-light);display:flex;gap:14px;align-items:center;background:linear-gradient(135deg,rgba(197,106,74,0.11),rgba(255,255,255,0.34));}
      .profile-avatar{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;font-size:20px;border:2px solid rgba(255,255,255,0.75);}
      .profile-name{font-family:'Noto Serif SC',serif;font-size:17px;letter-spacing:1px;margin-bottom:4px;}
      .profile-role{font-size:12px;color:var(--text-secondary);}
      .profile-body{padding:16px 20px 18px;display:flex;flex-direction:column;gap:11px;}
      .profile-row{display:flex;justify-content:space-between;gap:16px;font-size:12px;line-height:1.5;}
      .profile-key{color:var(--text-muted);white-space:nowrap;}
      .profile-val{color:var(--text-secondary);text-align:right;}
      .profile-actions{display:flex;gap:10px;padding:0 20px 20px;}
      .profile-action{flex:1;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);font-family:'Noto Sans SC',sans-serif;font-size:12px;padding:9px 10px;cursor:pointer;transition:all .18s;}
      .profile-action:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-pale);}
      .profile-action.primary{background:linear-gradient(135deg,var(--gold),var(--gold-dark));border-color:transparent;color:#fff;}
      .profile-close{position:absolute;right:18px;top:14px;width:28px;height:28px;border:0;background:transparent;color:var(--text-muted);font-size:20px;cursor:pointer;}
      .avatar-btn{user-select:none;}
      .avatar-btn:focus-visible{outline:2px solid var(--gold-light);outline-offset:3px;}
    `;
    document.head.appendChild(style);
  }

  function openProfile() {
    const user = window.CucuAuth.user();
    const adminAction = user.roleType === 'admin'
      ? `<button class="profile-action" type="button" onclick="location.href='${pageUrl('admin.html')}'">管理后台</button>`
      : `<button class="profile-action" type="button" onclick="location.href='${pageUrl('assets.html')}'">我的资产</button>`;
    let overlay = document.getElementById('profileOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'profileOverlay';
      overlay.className = 'profile-overlay';
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.classList.remove('show');
      };
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="profile-card" role="dialog" aria-modal="true" aria-label="个人信息">
        <button class="profile-close" type="button" aria-label="关闭" onclick="document.getElementById('profileOverlay').classList.remove('show')">×</button>
        <div class="profile-head">
          <div class="profile-avatar">楚</div>
          <div>
            <div class="profile-name">${escapeHTML(user.name)}</div>
            <div class="profile-role">${escapeHTML(user.role)}</div>
          </div>
        </div>
        <div class="profile-body">
          <div class="profile-row"><span class="profile-key">所属经销商</span><span class="profile-val">${escapeHTML(user.dealerName || user.department)}</span></div>
          <div class="profile-row"><span class="profile-key">绑定手机</span><span class="profile-val">${escapeHTML(user.phone)}</span></div>
          <div class="profile-row"><span class="profile-key">共享积分</span><span class="profile-val"><span data-coin-balance>${getCoinBalance()}</span> 积分</span></div>
          <div class="profile-row"><span class="profile-key">最近登录</span><span class="profile-val">${escapeHTML(user.lastLogin)}</span></div>
        </div>
        <div class="profile-actions">
          ${adminAction}
          <button class="profile-action primary" type="button" onclick="CucuAuth.logout()">退出登录</button>
        </div>
      </div>
    `;
    overlay.classList.add('show');
    renderCoinBalance();
  }

  function escapeHTML(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (currentPage === 'login.html') return;
    injectProfileStyles();
    syncUserCoins();
    renderCoinBalance();
    document.querySelectorAll('.avatar-btn').forEach((btn) => {
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-label', '查看个人信息');
      btn.addEventListener('click', openProfile);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProfile();
        }
      });
    });
  });
})();

