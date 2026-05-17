const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY';
let conversationHistory = [];
let isLoading = false;

const SYSTEM_PROMPT = `你是楚楚顶墙的专属AI设计顾问，楚楚顶墙是中国知名高端顶墙集成品牌（官网：www.cucu.com.cn），产品涵盖电器系统、厨卫空间、阳台空间、背景墙、顶墙空间等。
你的职责：
1. 为用户提供专业的顶墙设计方案、选材建议、风格搭配
2. 介绍楚楚顶墙的产品特色与优势
3. 引导用户使用图片生成、视频生成功能
4. 保持高端、专业、温暖的服务态度
5. 回答要简洁有力，适当使用分点说明
回答时可适当推荐用户跳转到"图片生成"或"视频生成"模块获取可视化效果。`;

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sendMessage();
  }
}

function getWelcomeHTML() {
  return `
    <div class="welcome-block" id="welcomeBlock">
      <div class="welcome-icon">
        <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <div class="welcome-title">楚楚 <span>AI</span> 设计顾问</div>
      <div class="welcome-sub">
        由 DeepSeek 大模型驱动 · 专注顶墙空间设计<br>
        从选材咨询到效果图生成，一站式智能设计体验
      </div>
      <div class="suggestion-grid">
        <div class="suggestion-card" onclick="sendSuggestion('我家客厅想做现代轻奢风格的集成吊顶，预算2万，请帮我推荐方案')">
          <div class="sc-label">DESIGN CONSULT</div>
          <div class="sc-text">客厅轻奢吊顶方案推荐</div>
        </div>
        <div class="suggestion-card" onclick="sendSuggestion('铝扣板和PVC扣板有什么区别？哪种更适合厨房使用？')">
          <div class="sc-label">MATERIAL GUIDE</div>
          <div class="sc-text">铝扣板与PVC材质对比</div>
        </div>
        <div class="suggestion-card" onclick="sendSuggestion('我有户型图，想生成顶墙效果图，怎么操作？')">
          <div class="sc-label">IMAGE GENERATE</div>
          <div class="sc-text">上传户型图生成效果图</div>
        </div>
        <div class="suggestion-card" onclick="sendSuggestion('帮我了解一下楚楚顶墙的主要产品系列和特色')">
          <div class="sc-label">BRAND INFO</div>
          <div class="sc-text">楚楚顶墙产品系列介绍</div>
        </div>
      </div>
    </div>
  `;
}

function newChat() {
  conversationHistory = [];
  document.getElementById('chatMessages').innerHTML = getWelcomeHTML();
  document.getElementById('chatInput').value = '';
  document.getElementById('chatInput').style.height = 'auto';
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  isLoading = false;
  closeMobileDrawer();
}

function loadChat(el, title) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  closeMobileDrawer();
}

function sendSuggestion(text) {
  document.getElementById('welcomeBlock')?.remove();
  document.getElementById('chatInput').value = text;
  sendMessage();
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || isLoading) return;

  document.getElementById('welcomeBlock')?.remove();
  appendMessage('user', text);
  input.value = '';
  input.style.height = 'auto';

  conversationHistory.push({ role: 'user', content: text });

  const typingId = appendTyping();
  isLoading = true;

  try {
    if (!hasConfiguredApiKey()) {
      await wait(500);
      const reply = getDemoReply(text);
      conversationHistory.push({ role: 'assistant', content: reply });
      removeTyping(typingId);
      appendAIMessage(reply, text);
      return;
    }

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory
        ],
        temperature: 0.7, max_tokens: 1000, stream: false
      })
    });
    if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回应，请稍后再试。';
    conversationHistory.push({ role: 'assistant', content: reply });
    removeTyping(typingId);
    appendAIMessage(reply, text);
  } catch(e) {
    removeTyping(typingId);
    const reply = '网络连接异常或 API 配置暂不可用，已切换为演示回复：\n\n作为楚楚顶墙的 AI 设计顾问，我可以为您提供：\n- 顶墙风格方案推荐\n- 材质选择指导\n- 效果图生成引导\n- 产品系列详解\n\n请问您最关心哪方面的设计需求？';
    conversationHistory.push({ role: 'assistant', content: reply });
    appendAIMessage(reply, text);
  } finally {
    isLoading = false;
  }
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg-row ${role}`;
  div.innerHTML = `
    <div class="msg-avatar ${role}">${role==='ai'?'楚':'我'}</div>
    <div class="msg-bubble ${role}">${formatMessageContent(text)}</div>
  `;
  document.getElementById('chatMessages').appendChild(div);
  scrollBottom();
}

function appendAIMessage(text, userText) {
  const needsImage = /效果图|设计图|出图|生成图|图片/i.test(userText + text);
  const needsVideo = /视频|动画/i.test(userText + text);
  const div = document.createElement('div');
  div.className = 'msg-row';
  let chips = '';
  if (needsImage) chips += `<button class="msg-chip" onclick="location.href='pages/image.html'">→ 去生成效果图</button>`;
  if (needsVideo) chips += `<button class="msg-chip" onclick="location.href='pages/video.html'">→ 去生成视频</button>`;
  chips += `<button class="msg-chip" onclick="document.getElementById('chatInput').focus()">继续提问</button>`;
  div.innerHTML = `
    <div class="msg-avatar ai">楚</div>
    <div>
      <div class="msg-bubble ai">${formatMessageContent(text)}</div>
      <div class="msg-chips">${chips}</div>
    </div>
  `;
  document.getElementById('chatMessages').appendChild(div);
  scrollBottom();
}

function hasConfiguredApiKey() {
  return DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'YOUR_DEEPSEEK_API_KEY';
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDemoReply(text) {
  if (/产品|系列|特色|楚楚顶墙/.test(text)) {
    return '楚楚顶墙主要围绕顶墙空间、电器系统、厨卫空间、阳台空间、背景墙等场景提供一体化产品方案。\n\n建议介绍时可以抓住 3 个重点：\n- 顶墙一体化：吊顶、墙面、灯光、电器统一规划，整体感更强。\n- 厨卫耐用性：关注防潮、防油污、易清洁和长期稳定。\n- 风格适配：现代轻奢、奶油风、新中式、极简等空间都能做成系列化搭配。\n\n如果用于客户接待，我可以继续帮你整理成一版更像销售顾问话术的产品系列介绍。';
  }

  if (/铝扣板|PVC|材质/.test(text)) {
    return '铝扣板更适合厨房和卫生间这类高湿、高油烟空间，优势是耐潮、耐热、易清洁，长期使用稳定性更好。PVC 扣板价格通常更低，但质感、耐热性和耐久度会弱一些。\n\n如果客户预算允许，厨卫空间我会优先建议选择铝扣板；如果是临时装修或预算敏感项目，再考虑 PVC。';
  }

  if (/效果图|户型图|生成图|图片/.test(text)) {
    return '可以先进入“图片生成”模块，上传户型图或空间照片，再补充风格、吊顶形式、灯光氛围和材质偏好。\n\n为了让效果更稳定，描述里建议包含：空间类型、风格、主色调、顶墙材料、灯光方式、是否保留现有家具。';
  }

  return '可以的。我先按楚楚顶墙设计顾问的方式帮你梳理：\n\n- 空间定位：先明确是客厅、厨房、卫生间、阳台还是背景墙。\n- 风格方向：确认现代轻奢、极简、新中式、奶油风等主风格。\n- 材质建议：根据防潮、清洁、预算和质感要求选择顶墙材料。\n- 落地方案：再细化吊顶造型、灯光、电器和墙面搭配。\n\n你可以继续告诉我空间面积、预算和喜欢的风格，我会给你一版更具体的方案。';
}

function formatMessageContent(text) {
  return escapeHTML(text).replace(/\n/g, '<br>');
}

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appendTyping() {
  const id = 'typing_' + Date.now();
  const div = document.createElement('div');
  div.className = 'msg-row'; div.id = id;
  div.innerHTML = `
    <div class="msg-avatar ai">楚</div>
    <div class="msg-bubble ai">
      <div class="typing-indicator">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>
  `;
  document.getElementById('chatMessages').appendChild(div);
  scrollBottom(); return id;
}

function removeTyping(id) { document.getElementById(id)?.remove(); }
function scrollBottom() {
  const el = document.getElementById('chatMessages');
  el.scrollTop = el.scrollHeight;
}

function openMobileDrawer() {
  document.body.classList.add('mobile-drawer-open');
  document.body.classList.remove('mobile-feature-open');
  document.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded', 'true');
  document.querySelector('.mobile-feature-toggle')?.setAttribute('aria-expanded', 'false');
}

function closeMobileDrawer() {
  document.body.classList.remove('mobile-drawer-open');
  document.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded', 'false');
}

function toggleMobileFeatures() {
  const isOpen = document.body.classList.toggle('mobile-feature-open');
  document.body.classList.remove('mobile-drawer-open');
  document.querySelector('.mobile-feature-toggle')?.setAttribute('aria-expanded', String(isOpen));
  document.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded', 'false');
}

function closeMobileFeatures() {
  document.body.classList.remove('mobile-feature-open');
  document.querySelector('.mobile-feature-toggle')?.setAttribute('aria-expanded', 'false');
}

function syncMobilePlaceholder() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  if (!input.dataset.desktopPlaceholder) {
    input.dataset.desktopPlaceholder = input.getAttribute('placeholder') || '';
  }
  input.setAttribute(
    'placeholder',
    window.matchMedia('(max-width: 768px)').matches
      ? '请向楚楚AI描述你的设计需求'
      : input.dataset.desktopPlaceholder
  );
}

document.addEventListener('DOMContentLoaded', () => {
  syncMobilePlaceholder();
  window.addEventListener('resize', syncMobilePlaceholder);
  document.querySelector('.mobile-menu-toggle')?.addEventListener('click', openMobileDrawer);
  document.querySelector('.mobile-feature-toggle')?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMobileFeatures();
  });
  document.getElementById('mobileDrawerMask')?.addEventListener('click', closeMobileDrawer);
  document.querySelectorAll('.mobile-feature-menu a').forEach((item) => {
    item.addEventListener('click', closeMobileFeatures);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.mobile-feature-menu') && !event.target.closest('.mobile-feature-toggle')) {
      closeMobileFeatures();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileDrawer();
      closeMobileFeatures();
    }
  });
});


