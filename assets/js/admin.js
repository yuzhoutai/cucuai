function escapeHTML(text){
  return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function memberName(name){
  return String(name).replace(/设计师/g,'成员').replace(/设计/g,'成员');
}

function memberRole(role){
  return String(role).replace(/设计师/g,'成员').replace(/设计顾问/g,'成员顾问');
}

function renderAdmin(){
  const workspace=CucuAuth.dealer();
  const designers=[...workspace.designers].sort((a,b)=>Number(b.usedCoins||0)-Number(a.usedCoins||0));
  const usedTotal=designers.reduce((sum,item)=>sum+Number(item.usedCoins||0),0);
  const maxUsed=Math.max(...designers.map(item=>Number(item.usedCoins||0)),1);
  document.getElementById('dealerPill').textContent=workspace.dealerName;
  document.querySelectorAll('[data-coin-balance]').forEach(el=>{el.textContent=Number(workspace.sharedCoins||0);});
  document.getElementById('designerCount').textContent=designers.length;
  document.getElementById('usedTotal').textContent=Math.round(usedTotal*10)/10;
  document.getElementById('rechargeTotal').textContent=Number(workspace.rechargeTotal||0);
  document.getElementById('designerTable').innerHTML=designers.map((item)=>{
    const used=Number(item.usedCoins||0);
    const ratio=Math.round(used/maxUsed*100);
    return `
      <tr>
        <td><div class="designer-name"><div class="designer-avatar">${escapeHTML(memberName(item.name).slice(0,1))}</div><div><div>${escapeHTML(memberName(item.name))}</div><div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${escapeHTML(item.account)}</div></div></div></td>
        <td><span class="role-tag">${escapeHTML(memberRole(item.role))}</span></td>
        <td>${Number(item.images||0)} 张</td>
        <td>${Number(item.videos||0)} 条</td>
        <td>${used}</td>
        <td><div class="usage-bar"><div class="usage-fill" style="width:${ratio}%;"></div></div></td>
        <td>${escapeHTML(item.lastActive)}</td>
      </tr>
    `;
  }).join('');
  document.getElementById('rankList').innerHTML=designers.slice(0,4).map((item,index)=>{
    const used=Number(item.usedCoins||0);
    return `
      <div class="rank-item">
        <div class="rank-no">${index+1}</div>
        <div>
          <div class="rank-name">${escapeHTML(memberName(item.name))}</div>
          <div class="rank-track"><span style="width:${Math.max(8,Math.round(used/maxUsed*100))}%;"></span></div>
        </div>
        <div class="rank-value">${used}</div>
      </div>
    `;
  }).join('');
  document.getElementById('txList').innerHTML=workspace.transactions.slice(0,6).map((item)=>{
    const isPlus=Number(item.amount)>0;
    return `
      <div class="tx-item">
        <div class="tx-icon ${isPlus?'plus':'minus'}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8">${isPlus?'<path d="M12 5v14M5 12h14" stroke-linecap="round"/>':'<path d="M5 12h14" stroke-linecap="round"/>'}</svg>
        </div>
        <div>
          <div class="tx-main">${escapeHTML(memberName(item.user))} · ${escapeHTML(item.note).replace(/设计师/g,'成员')}</div>
          <div class="tx-sub">${escapeHTML(item.time)}</div>
        </div>
        <div class="tx-amount ${isPlus?'plus':'minus'}">${isPlus?'+':''}${Number(item.amount)}</div>
      </div>
    `;
  }).join('');
}

function setRecharge(amount){
  document.getElementById('rechargeAmount').value=amount;
}

function focusRecharge(){
  document.getElementById('rechargeAmount').focus();
}

function submitRecharge(){
  const input=document.getElementById('rechargeAmount');
  const amount=Number(input.value);
  if(!Number.isFinite(amount)||amount<=0){
    showToast('请输入有效充值积分');
    return;
  }
  CucuAuth.rechargeCoins(amount,'经销商后台充值');
  input.value='';
  renderAdmin();
  showToast(`已充值 ${amount} 积分`);
}

function showToast(text){
  const toast=document.getElementById('toast');
  toast.textContent=text;
  toast.classList.add('show');
  clearTimeout(window.__adminToastTimer);
  window.__adminToastTimer=setTimeout(()=>toast.classList.remove('show'),1800);
}

document.addEventListener('DOMContentLoaded',renderAdmin);


