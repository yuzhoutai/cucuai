const workflows = {
  sketch:{ title:'方案生成', sub:'上传素材图与资产库图片，设置参数，生成高质量室内方案效果图' },
  edit:{ title:'局部替换修改', sub:'上传两张参考图，描述替换内容，AI精准完成元素替换' },
  floor:{ title:'户型图 → 效果图', sub:'上传户型平面图，AI分析空间结构，生成专属顶墙效果图' },
  style:{ title:'风格迁移生成', sub:'选择目标风格，一键将您的空间转化为理想的装修效果' }
};
let currentWF='sketch';
let activeAssetPreviewId='sketch-preview';
let activeAssetSlotLabel='素材';
let activeLibraryCategory='all';
const productLibraryFilters=[
  ['all','全部'],['lighting','照明'],['heating','取暖'],['ventilation','换气'],['cooler','凉霸'],['multi','多功能电器'],['smart','智能家居系统'],['audio','音响'],['switch','开关'],['hanger','晾衣机'],['ecommerce','电商款']
];
const chuchuLibraryAssets=[
  {name:'CC-DS900120DFNF-1（Z）',meta:'电器系统 · 照明',category:'lighting',image:'https://oss.cucu.com.cn/SourcePhoto/20244/20244258101_3857.png'},
  {name:'CC-DS900120LB-3Z',meta:'电器系统 · 照明',category:'lighting',image:'https://oss.cucu.com.cn/SourcePhoto/20244/20244258922_4493.png'},
  {name:'CC-DS30042LB-4Z',meta:'电器系统 · 照明',category:'lighting',image:'https://oss.cucu.com.cn/SourcePhoto/20244/20244258834_1578.png'},
  {name:'CC-DS900120DFNF-7Z',meta:'电器系统 · 取暖',category:'heating',image:'https://oss.cucu.com.cn/SourcePhoto/20244/20244258757_4652.png'},
  {name:'CC-DS900120LB-3z',meta:'电器系统 · 照明',category:'lighting',image:'https://oss.cucu.com.cn/SourcePhoto/20244/20244258719_726.png'},
  {name:'CC-DS30042DFNF-11Z',meta:'电器系统 · 取暖',category:'heating',image:'https://oss.cucu.com.cn/SourcePhoto/20244/2024425874_6555.png'}
];

function assetIconSvg(){
  return '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
}

function openAssetLibrary(previewId,slotLabel='素材'){
  activeAssetPreviewId=previewId;
  activeAssetSlotLabel=slotLabel;
  activeLibraryCategory='all';
  document.getElementById('assetLibraryTitle').textContent=`选择楚楚资产库图片 · ${slotLabel}`;
  renderAssetLibrary();
  document.getElementById('assetLibraryModal').classList.add('show');
}

function hideAssetLibrary(){
  document.getElementById('assetLibraryModal').classList.remove('show');
}

function closeAssetLibrary(e){
  if(e.target===document.getElementById('assetLibraryModal')) hideAssetLibrary();
}

function renderAssetLibrary(){
  const grid=document.getElementById('assetLibraryGrid');
  const filters=document.getElementById('assetLibraryFilters');
  filters.innerHTML=productLibraryFilters.map(([type,label])=>
    `<button class="asset-library-filter ${activeLibraryCategory===type?'active':''}" onclick="setLibraryCategory('${type}')">${label}</button>`
  ).join('');
  const visibleAssets=chuchuLibraryAssets
    .map((asset,index)=>({...asset,index}))
    .filter(asset=>activeLibraryCategory==='all'||asset.category===activeLibraryCategory);
  grid.innerHTML=visibleAssets.length?visibleAssets.map(asset=>`
    <div class="library-card" onclick="selectLibraryAsset(${asset.index})">
      <div class="library-thumb"><img src="${asset.image}" alt="${asset.name}"></div>
      <div class="library-info">
        <div class="library-name">${asset.name}</div>
        <div class="library-meta">${asset.meta}</div>
      </div>
    </div>
  `).join(''):'<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted);font-size:13px;">当前分类暂无素材</div>';
}

function setLibraryCategory(type){
  activeLibraryCategory=type;
  renderAssetLibrary();
}

function findUploadPreview(previewId){
  let el=document.getElementById(previewId);
  if(el) return el;
  if(previewId==='edit-preview-a') return document.querySelector('#wf-edit-config .upload-mini:nth-child(1)');
  if(previewId==='edit-preview-b') return document.querySelector('#wf-edit-config .upload-mini:nth-child(2)');
  if(previewId==='floor-preview') return document.querySelector('#wf-floor-config .upload-zone');
  if(previewId==='style-preview') return document.querySelector('#wf-style-config .upload-zone');
  return null;
}

function selectLibraryAsset(index){
  const asset=chuchuLibraryAssets[index];
  const el=findUploadPreview(activeAssetPreviewId);
  if(!el) return;
  if(el.classList.contains('upload-zone')||el.classList.contains('upload-mini')) el.removeAttribute('onclick');
  el.innerHTML=`
    <div class="picked-asset-state">
      <div class="picked-asset-thumb">
        <img src="${asset.image}" alt="${asset.name}">
      </div>
      <div class="asset-picked-note">${activeAssetSlotLabel}已选择<br>${asset.name}</div>
    </div>
  `;
  updateStep(2);
  hideAssetLibrary();
}

function selectWF(el,type){
  document.querySelectorAll('.wf-card').forEach(c=>c.classList.remove('active'));
  el.classList.add('active'); currentWF=type;
  document.getElementById('workTitle').textContent=workflows[type].title;
  document.getElementById('workSubtitle').textContent=workflows[type].sub;
  document.querySelectorAll('[id^="wf-"][id$="-config"]').forEach(c=>c.style.display='none');
  document.getElementById('wf-'+type+'-config').style.display='block';
  document.getElementById('resultPlaceholder').style.display='flex';
  document.getElementById('resultContent').style.display='none';
  resetSteps();
}

function selectStyle(btn){
  btn.closest('.style-chips').querySelectorAll('.style-chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  const prompt=btn.dataset.prompt;
  const configBlock=btn.closest('[id^="wf-"][id$="-config"]');
  const styleSection=btn.closest('[id^="wf-"][id$="-config"], .config-area');
  const promptTarget=(configBlock || styleSection || document).querySelector('.prompt-editor, .form-textarea');
  if(prompt && promptTarget) setPromptContent(promptTarget,prompt);
}

function setPromptContent(target,prompt){
  if(target.classList.contains('prompt-editor')){
    const hint='（此处删除括号及文字后可填写您想描述的设计内容）';
    const [before,after='']=prompt.split(hint);
    target.innerHTML=[
      `<span class="prompt-normal">${escapeHTML(before)}</span>`,
      `<span class="prompt-insert-hint" contenteditable="false">${escapeHTML(hint)}</span>`,
      `<span class="prompt-normal">${escapeHTML(after)}</span>`
    ].join('');
    placeCaretAtEnd(target);
    return;
  }
  target.value=prompt;
}

function placeCaretAtEnd(el){
  el.focus();
  const range=document.createRange();
  const selection=window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function escapeHTML(text){
  return text.replace(/[&<>"']/g,(char)=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[char]));
}
function selectRatio(btn){
  btn.closest('.ratio-btns').querySelectorAll('.ratio-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const configBlock=btn.closest('[id^="wf-"][id$="-config"]');
  const promptTarget=configBlock ? configBlock.querySelector('.prompt-editor, .form-textarea') : document.querySelector('.config-area .prompt-editor, .config-area .form-textarea');
  if(!promptTarget) return;
  const ratioText=`图片比例：${btn.textContent.trim()}`;
  const cleaned=getPromptPlainText(promptTarget)
    .replace(/(?:\n\n?)?图片比例：(?:1:1|4:3|16:9|9:16|3:4)\s*$/,'')
    .trim();
  setPlainPromptContent(promptTarget,cleaned ? `${cleaned}\n${ratioText}` : ratioText);
}

function getPromptPlainText(target){
  return target.classList.contains('prompt-editor') ? target.innerText : target.value;
}

function setPlainPromptContent(target,text){
  if(target.classList.contains('prompt-editor')){
    target.innerHTML=escapeHTML(text).replace(/\n/g,'<br>');
    placeCaretAtEnd(target);
    return;
  }
  target.value=text;
}

function useGeneratedAsMaterial(btn){
  const card=btn.closest('.result-card');
  const resultImg=card ? card.querySelector('.result-img') : null;
  const preview=document.getElementById('material-preview');
  if(!resultImg || !preview) return;
  const bg=resultImg.style.background || getComputedStyle(resultImg).background;
  const label=(resultImg.querySelector('.result-img-placeholder')?.textContent || '生成图片').trim();
  preview.innerHTML=`
    <div class="picked-generated-state">
      <div class="picked-generated-thumb" style="background:${bg};">
        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>${label}</span>
      </div>
      <div class="asset-picked-note">已作为素材图<br>可继续二次修改</div>
    </div>
  `;
  updateStep(2);
  document.getElementById('configArea')?.scrollTo({top:0,behavior:'smooth'});
}

function resetSteps(){
  [1,2,3].forEach(i=>{
    document.getElementById('step'+i).className='step-num';
    document.getElementById('step'+i).nextElementSibling && (document.getElementById('step'+i).nextElementSibling.className='step-label');
  });
  document.getElementById('step1').className='step-num active';
}

function previewUpload(input,previewId){
  if(!input.files[0]) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const el=document.getElementById(previewId);
    if(el) el.innerHTML=`
      <div class="picked-asset-state">
        <div class="picked-asset-thumb">
          <img src="${e.target.result}" alt="上传素材图">
        </div>
        <div class="asset-picked-note">素材图已上传</div>
      </div>
    `;
  };
  reader.readAsDataURL(input.files[0]);
  updateStep(2);
}

function updateStep(n){
  for(let i=1;i<n;i++){
    document.getElementById('step'+i).className='step-num done';
    document.getElementById('step'+i).textContent='?';
  }
  document.getElementById('step'+n).className='step-num active';
}

function getImageGenerateCount(){
  const config=document.getElementById('wf-'+currentWF+'-config');
  const select=[...(config?.querySelectorAll('.form-select') || [])].find((item)=>{
    const label=item.closest('div')?.querySelector('.form-label');
    return label?.textContent.includes('生成数量');
  });
  const match=(select?.value || '1张').match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function chargeChuchuCoins(cost){
  if(!window.CucuAuth?.chargeCoins) return true;
  if(CucuAuth.chargeCoins(cost,{kind:'image',count:getImageGenerateCount()})) return true;
  alert(`积分余额不足，本次需要 ${cost} 积分`);
  return false;
}

function startGenerate(){
  const cost=Math.round(getImageGenerateCount()*0.4*100)/100;
  if(!chargeChuchuCoins(cost)) return;
  updateStep(3);
  const placeholder=document.getElementById('resultPlaceholder');
  const content=document.getElementById('resultContent');
  placeholder.style.display='flex';
  placeholder.innerHTML=`
    <div class="gen-spinner"></div>
    <div class="gen-progress-text">AI 正在渲染效果图...</div>
    <div class="gen-progress-bar"><div class="gen-progress-fill"></div></div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">预计需要 15-30 秒</div>
  `;
  content.style.display='none';
  setTimeout(()=>{
    placeholder.style.display='none';
    content.style.display='block';
    if(window.matchMedia('(max-width: 768px)').matches){
      document.getElementById('resultArea')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }, 3000);
}

function tuneImageMobileCopy(){
  if(!window.matchMedia('(max-width: 768px)').matches) return;
  document.querySelectorAll('.prompt-editor').forEach((editor)=>{
    editor.setAttribute('data-placeholder','描述你想生成的顶墙效果');
  });
  const placeholderText=document.querySelector('#resultPlaceholder .placeholder-text');
  if(placeholderText) placeholderText.textContent='效果图将在这里显示';
}

function openMobileDrawer(){
  document.body.classList.add('mobile-drawer-open');
  document.body.classList.remove('mobile-feature-open');
  document.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded','true');
  document.querySelector('.mobile-feature-toggle')?.setAttribute('aria-expanded','false');
}

function closeMobileDrawer(){
  document.body.classList.remove('mobile-drawer-open');
  document.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded','false');
}

function toggleMobileFeatures(){
  const isOpen=document.body.classList.toggle('mobile-feature-open');
  document.body.classList.remove('mobile-drawer-open');
  document.querySelector('.mobile-feature-toggle')?.setAttribute('aria-expanded',String(isOpen));
  document.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded','false');
}

function closeMobileFeatures(){
  document.body.classList.remove('mobile-feature-open');
  document.querySelector('.mobile-feature-toggle')?.setAttribute('aria-expanded','false');
}

document.addEventListener('DOMContentLoaded',()=>{
  tuneImageMobileCopy();
  document.querySelector('.mobile-menu-toggle')?.addEventListener('click',openMobileDrawer);
  document.querySelector('.mobile-feature-toggle')?.addEventListener('click',(event)=>{
    event.stopPropagation();
    toggleMobileFeatures();
  });
  document.getElementById('mobileDrawerMask')?.addEventListener('click',closeMobileDrawer);
  document.querySelectorAll('.mobile-feature-menu a,.wf-panel .history-card,.mobile-drawer-link').forEach((item)=>{
    item.addEventListener('click',()=>{
      closeMobileDrawer();
      closeMobileFeatures();
    });
  });
  document.addEventListener('click',(event)=>{
    if(!event.target.closest('.mobile-feature-menu')&&!event.target.closest('.mobile-feature-toggle')){
      closeMobileFeatures();
    }
  });
  document.addEventListener('keydown',(event)=>{
    if(event.key==='Escape'){
      closeMobileDrawer();
      closeMobileFeatures();
    }
  });
});

