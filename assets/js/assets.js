let selectedCards=new Set();
let folders=[];
let folderSeq=1;
let assetSeq=1;
let currentCollection='all';
let currentTag='all';
let searchKeyword='';
const moduleTitles={all:'全部资产',image:'效果图',video:'设计视频',fav:'我的收藏',cclib:'楚楚资产库'};
const moduleCounts={all:42,image:28,video:14,fav:8,cclib:6};
const productFilterTags=[
  ['all','全部'],['lighting','照明'],['heating','取暖'],['ventilation','换气'],['cooler','凉霸'],['multi','多功能电器'],['smart','智能家居系统'],['audio','音响'],['switch','开关'],['hanger','晾衣机'],['ecommerce','电商款']
];
const moduleStats={
  all:['image','video','fav','storage'],
  image:['image','storage'],
  video:['video','storage'],
  fav:['image','video','storage'],
  cclib:['product','storage']
};
const statIcons={
  image:'<div class="stat-icon img"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#4ade80" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke="#4ade80" stroke-width="1.5"/><path d="M21 15l-5-5L5 21" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round"/></svg></div>',
  video:'<div class="stat-icon vid"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" stroke="#a5b4fc" stroke-width="1.5"/></svg></div>',
  fav:'<div class="stat-icon fav"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#C56A4A" stroke-width="1.5"/></svg></div>',
  product:'<div class="stat-icon img"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" stroke="#4ade80" stroke-width="1.5"/><path d="M8 7h8M8 11h8M8 15h5M3 19h18" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round"/></svg></div>'
};
const statLabels={image:'效果图',video:'设计视频',fav:'已收藏',product:'产品素材'};

function ensureAssetIds(){
  document.querySelectorAll('.asset-card').forEach(card=>{
    if(!card.dataset.assetId) card.dataset.assetId='asset-'+assetSeq++;
    if(!card.dataset.assetType){
      const badge=card.querySelector('.asset-type-badge');
      card.dataset.assetType=badge?.classList.contains('badge-vid')?'video':'image';
    }
  });
}

function getModuleCount(type){
  return moduleCounts[type]||0;
}

function getCardType(card){
  return card.dataset.assetType||'image';
}

function isProductCard(card){
  return getCardType(card)==='product';
}

function isFavoriteCard(card){
  return !!card.querySelector('.asset-fav.active');
}

function getWorkflowType(card){
  const modalCall=card.getAttribute('ondblclick')||card.querySelector('.hover-btn')?.getAttribute('onclick')||'';
  if(modalCall.includes('线稿渲染')) return 'sketch';
  if(modalCall.includes('局部修改')) return 'edit';
  if(modalCall.includes('户型生成')) return 'floor';
  if(modalCall.includes('风格迁移')) return 'style';
  if(getCardType(card)==='video') return 'video';
  return 'all';
}

function cardMatchesCurrentView(card){
  const name=getAssetName(card).toLowerCase();
  const type=getCardType(card);
  if(isProductCard(card)){
    const productTag=card.dataset.productCategory||'all';
    return currentCollection==='cclib'&&(currentTag==='all'||currentTag===productTag)&&(!searchKeyword||name.includes(searchKeyword));
  }
  const collectionMatch=
    currentCollection==='all'||
    currentCollection===type||
    (currentCollection==='fav'&&isFavoriteCard(card));
  const tagMatch=
    currentTag==='all'||
    currentTag===type||
    currentTag===getWorkflowType(card);
  const searchMatch=!searchKeyword||name.includes(searchKeyword);
  return collectionMatch&&tagMatch&&searchMatch;
}

function renderFilterTags(){
  const row=document.getElementById('filterRow');
  if(currentCollection!=='cclib'){
    row.style.display='none';
    row.innerHTML='';
    currentTag='all';
    return;
  }
  row.style.display='flex';
  const tags=productFilterTags;
  row.innerHTML='<span class="filter-label">筛选：</span>'+tags.map(([type,label],index)=>
    `<button class="filter-tag ${currentTag===type?'active':''}" onclick="filterTag(this,'${type}')">${label}</button>`
  ).join('');
}

function renderSidebarCounts(){
  document.querySelectorAll('[data-count-for]').forEach(el=>{
    el.textContent=getModuleCount(el.dataset.countFor);
  });
  const badge=document.querySelector('.ai-badge');
  if(badge) badge.textContent=`已保存 ${getModuleCount('all')} 个文件`;
}

function getStatCount(type){
  if(type==='product') return getModuleCount('cclib');
  if(type==='fav') return getModuleCount('fav');
  if(currentCollection==='fav'){
    const favDemoTotal=getModuleCount('fav');
    const base=getModuleCount(type);
    const all=getModuleCount('all');
    return Math.round(favDemoTotal*base/all);
  }
  return getModuleCount(type);
}

function renderStats(){
  const statsBar=document.getElementById('statsBar');
  const stats=moduleStats[currentCollection]||moduleStats.all;
  statsBar.classList.toggle('compact',currentCollection!=='all');
  statsBar.innerHTML=stats.map(type=>{
    if(type==='storage'){
      return '<div class="stat-item"><div style="padding-left:4px;"><div class="stat-num" style="font-size:16px;">6.2 GB</div><div class="stat-label">已使用存储</div></div></div>';
    }
    return `<div class="stat-item">${statIcons[type]}<div><div class="stat-num">${getStatCount(type)}</div><div class="stat-label">${statLabels[type]}</div></div></div><div class="stat-divider"></div>`;
  }).join('');
}

function refreshAssetView(){
  renderSidebarCounts();
  renderStats();
  renderFilterTags();
  document.getElementById('toolbarTitle').textContent=moduleTitles[currentCollection]||'全部资产';
  document.getElementById('toolbarCount').textContent=`共 ${getModuleCount(currentCollection)} 个文件`;
  document.getElementById('statsBar').style.display=currentCollection==='cclib'?'none':'flex';
  document.querySelectorAll('.asset-card').forEach(card=>{
    card.style.display=cardMatchesCurrentView(card)?'':'none';
  });
  document.querySelectorAll('.gallery-section').forEach(section=>{
    const hasVisible=[...section.querySelectorAll('.asset-card')].some(card=>card.style.display!=='none');
    section.style.display=hasVisible?'':'none';
  });
}

function toggleSelect(card){
  if(card.classList.contains('selected')){
    card.classList.remove('selected');
    selectedCards.delete(card);
  } else {
    card.classList.add('selected');
    selectedCards.add(card);
  }
  document.getElementById('bulkActions').style.display=selectedCards.size>0?'flex':'none';
}

function clearSelection(){
  document.querySelectorAll('.asset-card.selected').forEach(c=>c.classList.remove('selected'));
  selectedCards.clear();
  document.getElementById('bulkActions').style.display='none';
}

function toggleFav(btn){
  const wasActive=btn.classList.contains('active');
  btn.classList.toggle('active');
  const svg=btn.querySelector('svg');
  if(btn.classList.contains('active')){
    svg.setAttribute('fill','var(--gold)');
    svg.setAttribute('stroke','var(--gold)');
  } else {
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','var(--text-muted)');
  }
  const isActive=btn.classList.contains('active');
  if(wasActive!==isActive) moduleCounts.fav+=isActive?1:-1;
  refreshAssetView();
}

function filterCollection(el,type){
  document.querySelectorAll('.as-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
  currentCollection=type;
  currentTag='all';
  document.querySelectorAll('.filter-tag').forEach((tag,index)=>tag.classList.toggle('active',index===0));
  refreshAssetView();
}

function getAssetName(card){
  return card.querySelector('.asset-name')?.textContent.trim()||'未命名作品';
}

function getAssetMeta(card){
  return card.querySelector('.asset-meta')?.textContent.trim()||'';
}

function getFolderIcon(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7.5A2.5 2.5 0 015.5 5H10l2 2h6.5A2.5 2.5 0 0121 9.5v7A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5v-9z" stroke-linejoin="round"/></svg>';
}

function openFolderModal(){
  ensureAssetIds();
  const picker=document.getElementById('folderAssetPicker');
  picker.innerHTML='';
  document.querySelectorAll('.asset-card').forEach((card,index)=>{
    const row=document.createElement('label');
    row.className='folder-pick-row';
    row.innerHTML=`<input type="checkbox" value="${card.dataset.assetId}"><span class="folder-pick-name">${getAssetName(card)}</span><span class="folder-pick-meta">${getAssetMeta(card)}</span>`;
    picker.appendChild(row);
  });
  document.getElementById('folderNameInput').value='';
  document.getElementById('folderModalOverlay').classList.add('show');
  setTimeout(()=>document.getElementById('folderNameInput').focus(),0);
}

function hideFolderModal(){
  document.getElementById('folderModalOverlay').classList.remove('show');
}

function closeFolderModal(e){
  if(e.target===document.getElementById('folderModalOverlay')) hideFolderModal();
}

function createFolder(){
  const name=document.getElementById('folderNameInput').value.trim();
  if(!name){
    document.getElementById('folderNameInput').focus();
    return;
  }
  const assetIds=[...document.querySelectorAll('#folderAssetPicker input:checked')].map(input=>input.value);
  const folder={id:'folder-'+folderSeq++,name,assetIds};
  folders.push(folder);
  renderFolders();
  updateMoveFolderSelect();
  hideFolderModal();
  selectFolder(folder.id);
}

function renderFolders(){
  const list=document.getElementById('folderList');
  list.innerHTML='';
  document.getElementById('folderEmpty')?.remove();
  if(folders.length===0){
    list.innerHTML='<div class="folder-empty" id="folderEmpty">还没有文件夹，点击 + 创建。</div>';
    return;
  }
  folders.forEach(folder=>{
    const item=document.createElement('div');
    item.className='as-item';
    item.dataset.folderId=folder.id;
    item.onclick=()=>selectFolder(folder.id);
    item.innerHTML=`<div class="as-item-left">${getFolderIcon()}<span class="as-item-name">${folder.name}</span></div><span class="as-count">${folder.assetIds.length}</span>`;
    list.appendChild(item);
  });
}

function selectFolder(folderId){
  const folder=folders.find(item=>item.id===folderId);
  if(!folder) return;
  document.querySelectorAll('.as-item').forEach(i=>i.classList.remove('active'));
  document.querySelector(`[data-folder-id="${folderId}"]`)?.classList.add('active');
  document.getElementById('toolbarTitle').textContent=folder.name;
  document.getElementById('toolbarCount').textContent=`共 ${folder.assetIds.length} 个文件`;
  document.querySelectorAll('.asset-card').forEach(card=>{
    card.style.display=folder.assetIds.includes(card.dataset.assetId)?'':'none';
  });
}

function updateMoveFolderSelect(){
  const select=document.getElementById('moveFolderSelect');
  select.innerHTML='<option value="">添加到文件夹</option>';
  folders.forEach(folder=>{
    const option=document.createElement('option');
    option.value=folder.id;
    option.textContent=folder.name;
    select.appendChild(option);
  });
}

function moveSelectedToFolder(folderId){
  ensureAssetIds();
  if(!folderId) return;
  const folder=folders.find(item=>item.id===folderId);
  if(!folder) return;
  selectedCards.forEach(card=>{
    if(!folder.assetIds.includes(card.dataset.assetId)) folder.assetIds.push(card.dataset.assetId);
  });
  renderFolders();
  updateMoveFolderSelect();
  document.getElementById('moveFolderSelect').value='';
  alert(`已添加 ${selectedCards.size} 个作品到「${folder.name}」`);
}

ensureAssetIds();
refreshAssetView();

function filterTag(btn,type){
  document.querySelectorAll('.filter-tag').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentTag=type;
  refreshAssetView();
}

function searchAssets(val){
  searchKeyword=val.trim().toLowerCase();
  refreshAssetView();
}
function downloadSelected(){ alert('正在准备下载 '+selectedCards.size+' 个文件...'); }
function deleteSelected(){
  if(!selectedCards.size) return;
  if(confirm('确认删除选中的 '+selectedCards.size+' 个文件？')){
    const deletedIds=[];
    selectedCards.forEach(card=>{
      const type=getCardType(card);
      moduleCounts.all=Math.max(0,moduleCounts.all-1);
      moduleCounts[type]=Math.max(0,moduleCounts[type]-1);
      if(isFavoriteCard(card)) moduleCounts.fav=Math.max(0,moduleCounts.fav-1);
      deletedIds.push(card.dataset.assetId);
      card.remove();
    });
    folders.forEach(folder=>{
      folder.assetIds=folder.assetIds.filter(id=>!deletedIds.includes(id));
    });
    selectedCards.clear();
    document.getElementById('bulkActions').style.display='none';
    renderFolders();
    updateMoveFolderSelect();
    refreshAssetView();
  }
}

let modalVideoPlaying=false;
let modalVideoProgress=0;
let modalVideoTimer=null;
let modalVideoDuration=8;

function getModalVideoDuration(title,size){
  if(title.includes('厨卫')) return 15;
  if(size.includes('68')) return 15;
  return 8;
}

function formatVideoTime(seconds){
  const min=Math.floor(seconds/60);
  const sec=String(seconds%60).padStart(2,'0');
  return `${min}:${sec}`;
}

function updateModalVideoTime(){
  const fill=document.getElementById('modalProgressFill');
  const time=document.getElementById('modalTime');
  if(!fill||!time) return;
  fill.style.width=modalVideoProgress+'%';
  const current=Math.floor(modalVideoDuration*modalVideoProgress/100);
  time.textContent=`${formatVideoTime(current)} / ${formatVideoTime(modalVideoDuration)}`;
}

function setModalPlayIcon(isPlaying){
  const icon=document.getElementById('modalPlayIcon');
  if(!icon) return;
  icon.innerHTML=isPlaying
    ?'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
    :'<polygon points="5 3 19 12 5 21 5 3"/>';
}

function stopModalVideo(){
  clearInterval(modalVideoTimer);
  modalVideoTimer=null;
  modalVideoPlaying=false;
  setModalPlayIcon(false);
}

function toggleModalVideo(){
  modalVideoPlaying=!modalVideoPlaying;
  setModalPlayIcon(modalVideoPlaying);
  clearInterval(modalVideoTimer);
  if(modalVideoPlaying){
    modalVideoTimer=setInterval(()=>{
      modalVideoProgress=Math.min(100,modalVideoProgress+(100/(modalVideoDuration*10)));
      updateModalVideoTime();
      if(modalVideoProgress>=100){
        stopModalVideo();
        modalVideoProgress=0;
        updateModalVideoTime();
      }
    },100);
  }
}

function seekModalVideo(e,bar){
  const rect=bar.getBoundingClientRect();
  modalVideoProgress=Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100));
  updateModalVideoTime();
}

function renderModalPreview(isVideo,title,size){
  const preview=document.getElementById('modalPreview');
  const closeButton='<button class="modal-close" onclick="hideDetailModal()">×</button>';
  if(isVideo){
    modalVideoDuration=getModalVideoDuration(title,size);
    modalVideoProgress=0;
    preview.innerHTML=closeButton+`
      <div class="modal-video-player">
        <div class="modal-video-scene">
          <svg viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" stroke-width="1"/></svg>
        </div>
        <div class="modal-video-controls">
          <button class="modal-play-btn" onclick="toggleModalVideo()">
            <svg viewBox="0 0 24 24" id="modalPlayIcon"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <div class="modal-progress" onclick="seekModalVideo(event,this)">
            <div class="modal-progress-fill" id="modalProgressFill"></div>
          </div>
          <div class="modal-time" id="modalTime">0:00 / ${formatVideoTime(modalVideoDuration)}</div>
        </div>
      </div>`;
    return;
  }
  preview.innerHTML=closeButton+`
    <div class="modal-preview-inner" style="background:linear-gradient(135deg,#2A2010,#1A1508,#2E1F0A);">
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(197,106,74,0.15)"><rect x="3" y="3" width="18" height="18" rx="3" stroke-width="0.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="0.5"/><path d="M21 15l-5-5L5 21" stroke-width="0.5" stroke-linecap="round"/></svg>
    </div>`;
}

function hideDetailModal(){
  stopModalVideo();
  document.getElementById('modalOverlay').classList.remove('show');
}

function openModal(title,type,wf,res,size,date){
  stopModalVideo();
  const isVideo=type.includes('视频');
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalType').textContent=type;
  document.getElementById('modalWF').textContent=wf;
  document.getElementById('modalRes').textContent=res;
  document.getElementById('modalSize').textContent=size;
  document.getElementById('modalDate').textContent=date;
  renderModalPreview(isVideo,title,size);
  document.getElementById('modalRegenerateBtn').textContent=isVideo?'重新生成视频':'重新生成';
  document.getElementById('modalRegenerateBtn').onclick=()=>{location.href=isVideo?'video.html':'image.html';};
  document.getElementById('modalVideoBtn').style.display=isVideo?'none':'block';
  document.getElementById('modalDownloadBtn').textContent=isVideo?'下载视频':'下载文件';
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal(e){
  if(e.target===document.getElementById('modalOverlay')){
    hideDetailModal();
  }
}

