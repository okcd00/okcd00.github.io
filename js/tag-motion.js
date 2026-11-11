/* Default to reduced motion; an explicit Play is an intentional opt-in. */
(()=>{
  const field=document.querySelector('.tag-cloud-container');
  if(!field)return;
  const button=field.querySelector('.tag-motion-toggle');
  if(!button)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused=reduced.matches, touching=false, keyboardFocus=false, hovered=false;
  function sync(){
    field.classList.toggle('tag-motion-running',!userPaused&&!touching&&!keyboardFocus&&!hovered&&!document.hidden);
    button.setAttribute('aria-pressed',String(userPaused));
    button.children[0].textContent=userPaused?'▷':'Ⅱ';
    button.children[1].textContent=userPaused?'播放漂浮':'暂停漂浮';
  }
  field.classList.add('tag-motion-ready');button.hidden=false;
  button.addEventListener('click',()=>{userPaused=!userPaused;sync()});
  field.querySelectorAll('.tag-cloud-link').forEach(link=>{
    link.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=true;sync()}});
    link.addEventListener('pointerleave',()=>{hovered=false;sync()});
    link.addEventListener('focus',()=>{keyboardFocus=link.matches(':focus-visible');sync()});
    link.addEventListener('blur',()=>{keyboardFocus=false;sync()});
  });
  field.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.pointerType==='pen'){touching=true;sync()}});
  function release(){touching=false;sync()}
  document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);
  window.addEventListener('blur',()=>{touching=false;hovered=false;sync()});
  window.addEventListener('pageshow',()=>{touching=false;hovered=false;keyboardFocus=false;sync()});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{userPaused=reduced.matches;sync()});
  sync();
})();
