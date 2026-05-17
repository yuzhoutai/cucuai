let isPlaying=false, progressInterval=null, progress=0;

function switchMode(btn,mode){
  document.querySelectorAll('.tab-sw-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('mode-text').style.display=mode==='text'?'block':'none';
  document.getElementById('mode-image').style.display=mode==='image'?'block':'none';
}

function chargeChuchuCoins(cost){
  if(!window.CucuAuth?.chargeCoins) return true;
  if(CucuAuth.chargeCoins(cost,{kind:'video',note:'视频生成'})) return true;
  alert(`积分余额不足，本次需要 ${cost} 积分`);
  return false;
}

function startVideoGen(){
  if(!chargeChuchuCoins(12)) return;
  document.getElementById('videoPlaceholder').style.display='none';
  document.getElementById('videoGenerating').style.display='flex';
  document.getElementById('videoResult').style.display='none';
  progress=0; clearInterval(progressInterval);
  const steps=document.querySelectorAll('#genSteps .gen-step');
  steps.forEach((s,i)=>{s.className='gen-step'+(i===0?' done':i===1?' active':'');});
  let stepIdx=1;
  const stepInterval=setInterval(()=>{
    if(stepIdx<steps.length){
      steps[stepIdx-1].className='gen-step done';
      steps[stepIdx-1].querySelector('.gen-step-dot').style.background='#4ade80';
      if(stepIdx<steps.length){ steps[stepIdx].className='gen-step active'; }
      stepIdx++;
    } else { clearInterval(stepInterval); }
  },2000);
  setTimeout(()=>{
    clearInterval(stepInterval);
    document.getElementById('videoGenerating').style.display='none';
    document.getElementById('videoResult').style.display='flex';
  },8000);
}

function togglePlay(btn){
  isPlaying=!isPlaying;
  btn.querySelector('svg').innerHTML=isPlaying
    ?'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
    :'<polygon points="5 3 19 12 5 21 5 3"/>';
  if(isPlaying){
    progressInterval=setInterval(()=>{
      progress=Math.min(100,progress+0.5);
      document.getElementById('progressFill').style.width=progress+'%';
      const total=8, cur=Math.floor(total*progress/100);
      document.getElementById('timeDisplay').textContent=`0:0${cur} / 0:0${total}`;
      if(progress>=100){clearInterval(progressInterval);isPlaying=false;progress=0;btn.querySelector('svg').innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>';}
    },80);
  } else { clearInterval(progressInterval); }
}

function seekVideo(e,bar){
  const rect=bar.getBoundingClientRect();
  progress=Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100));
  document.getElementById('progressFill').style.width=progress+'%';
}

function playHistory(){
  document.getElementById('videoPlaceholder').style.display='none';
  document.getElementById('videoGenerating').style.display='none';
  document.getElementById('videoResult').style.display='flex';
  progress=0;
  document.getElementById('progressFill').style.width='0%';
  document.getElementById('timeDisplay').textContent='0:00 / 0:08';
}

