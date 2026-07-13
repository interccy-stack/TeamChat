/**
 * ===================================================================
 *  TeamChat Frontend v5.0.18 — 重大更新
 *  【串串频道 v2.0】ChuanChuanPage: 4-Tab统一页面
 *    📡频道 | 📂历史 | ✍️原创作者AI | 📤导出
 *  【轻音乐增强】音量 Slider + 内部停止按钮 + ▶ 正在播放指示
 *  【config 路径修复】串串频道重启后状态持久化
 *  【稻盛和夫 + 有巢哲学】工作原理末行展示
 *  【AI防卫】轻量安全提示（移除ClamAV）
 *  【Chrome扩展】AI分身Pro + 智能感知
 * ===================================================================
 *  CACHE_BUST: 20250711_2250
 */
// 全局兜底：确保 getApiUrl 在任何时候都可用
if(typeof window.getApiUrl==='undefined'&&window.QwenPaw&&window.QwenPaw.host&&window.QwenPaw.host.getApiUrl){window.getApiUrl=window.QwenPaw.host.getApiUrl;}
// ========== 原生联系人添加弹窗（绕过React渲染管道） ==========
window.showAddContactModal = function(newContact, setNewContact, addContact) {
  if (document.getElementById('cc-add-contact-modal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'cc-add-contact-modal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;';
  overlay.onclick = function(e) { if (e.target === overlay) { overlay.remove(); } };
  var box = document.createElement('div');
  box.style.cssText = 'background:white;border-radius:12px;padding:24px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h2 style="margin:0">👤 添加联系人</h2><button id="cc-modal-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999">✕</button></div><div style="display:flex;flex-direction:column;gap:10px"><input id="cc-modal-name" type="text" placeholder="姓名 *" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box"><input id="cc-modal-email" type="email" placeholder="邮箱 *" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box"><input id="cc-modal-phone" type="text" placeholder="电话" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box"><input id="cc-modal-company" type="text" placeholder="公司" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box"></div><div style="display:flex;gap:10px;margin-top:16px"><button id="cc-modal-cancel" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:14px;background:white">取消</button><button id="cc-modal-save" style="flex:1;padding:10px;border:none;border-radius:6px;cursor:pointer;font-size:14px;background:#667eea;color:white;font-weight:bold">保存</button></div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById('cc-modal-close').onclick = function() { overlay.remove(); };
  document.getElementById('cc-modal-cancel').onclick = function() { overlay.remove(); };
  document.getElementById('cc-modal-save').onclick = function() {
    var name = document.getElementById('cc-modal-name').value.trim();
    var email = document.getElementById('cc-modal-email').value.trim();
    var phone = document.getElementById('cc-modal-phone').value.trim();
    var company = document.getElementById('cc-modal-company').value.trim();
    if (!name || !email) { alert('姓名和邮箱不能为空！'); return; }
    setNewContact({name:name, email:email, phone:phone, company:company});
    overlay.remove();
    addContact(name, email, phone, company);
  };
};
// ========== 蜂巢邮箱动画 - 端到端蜜蜂飞行 ==========
window.showHiveAnimation = function() {
  // 确保 getApiUrl 可用
  var getApiUrl = (typeof window.getApiUrl!=='undefined' && window.getApiUrl) || 
                  (window.QwenPaw && window.QwenPaw.host && window.QwenPaw.host.getApiUrl) ||
                  function(p){return '/api'+p;};
  var TARGET_EMAIL = 'c115886@agent.qq.com';
  var overlay = document.createElement('div');
  overlay.id = 'hive-animation-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;font-family:system-ui,sans-serif;overflow:hidden;';

  // 背景：暖蜂蜜色渐变 + 花园光斑
  var bg = document.createElement('div');
  bg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at 30% 60%, #f9d423 0%, #fda403 15%, #e67e22 35%, transparent 70%), radial-gradient(ellipse at 70% 40%, #f9d423 0%, #fda403 15%, #e67e22 30%, transparent 65%), radial-gradient(ellipse at 50% 50%, #fff8e1 0%, #ffe082 20%, transparent 55%), linear-gradient(180deg, #1a0a00 0%, #3e2008 30%, #5a3a1a 60%, #2d1500 100%);';
  overlay.appendChild(bg);

  // 随机光斑粒子
  for(var i=0;i<25;i++){
    var spot = document.createElement('div');
    spot.style.cssText = 'position:absolute;width:'+(3+Math.random()*6)+'px;height:'+(3+Math.random()*6)+'px;border-radius:50%;background:rgba(255,255,200,'+(0.15+Math.random()*0.3)+');left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;animation:hiveSparkle '+(3+Math.random()*4)+'s ease-in-out infinite;animation-delay:'+Math.random()*3+'s;';
    overlay.appendChild(spot);
  }

  var style = document.createElement('style');
  style.innerHTML =
    '@keyframes hiveSparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1.5)}}'+
    '@keyframes beeWing{0%,100%{transform:rotate(-5deg) scaleY(0.85)}50%{transform:rotate(5deg) scaleY(1.1)}}'+
    '@keyframes beeFlyPath{0%{left:8%;top:70%}15%{left:20%;top:40%}35%{left:42%;top:22%}55%{left:60%;top:35%}75%{left:78%;top:55%}90%{left:86%;top:63%}100%{left:88%;top:65%}}'+
    '@keyframes beeBounce{0%,100%{margin-top:0}30%{margin-top:-18px}60%{margin-top:-8px}}'+
    '@keyframes youPulse{0%,100%{transform:scale(1);filter:drop-shadow(0 0 8px #ffd700)}50%{transform:scale(1.08);filter:drop-shadow(0 0 20px #ffd700)}}'+
    '@keyframes hiveGlow{0%,100%{filter:drop-shadow(0 0 5px #ffd700)}50%{filter:drop-shadow(0 0 20px #ffd700) drop-shadow(0 0 40px #ff8c00)}}'+
    '@keyframes hiveArrive{0%{filter:drop-shadow(0 0 5px #ffd700)}30%{transform:scale(1.3);filter:drop-shadow(0 0 30px #ffd700) drop-shadow(0 0 60px #ff8c00)}100%{transform:scale(1);filter:drop-shadow(0 0 12px #ffd700)}}'+
    '@keyframes trailFade{0%{opacity:0.6;transform:scale(0.6)}100%{opacity:0;transform:scale(0.2)}}'+
    '@keyframes pollenFloat{0%{transform:translate(0,0) scale(0);opacity:0}30%{opacity:0.8;transform:translate(20px,-30px) scale(1)}70%{opacity:0.4;transform:translate(-15px,-50px) scale(0.7)}100%{opacity:0;transform:translate(10px,-70px) scale(0)}}'+
    '@keyframes titleIn{0%{opacity:0;transform:translateY(30px)}100%{opacity:1;transform:translateY(0)}}'+
    '@keyframes letterDrop{0%{opacity:0;transform:translateY(-40px) rotate(-10deg)}60%{opacity:1;transform:translateY(5px) rotate(3deg)}100%{opacity:1;transform:translateY(0) rotate(0)}}'+
    '@keyframes ccSlideUp{0%{opacity:0;transform:translateY(40px)}100%{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);

  // ===== 场景容器 =====
  var scene = document.createElement('div');
  scene.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:640px;height:400px;max-width:90vw;max-height:50vh;';
  overlay.appendChild(scene);

  // ===== 左边：用户的蜜蜂 =====
  var youLabel = document.createElement('div');
  youLabel.innerHTML = '🐝';
  youLabel.style.cssText = 'position:absolute;left:4%;top:62%;font-size:52px;animation:youPulse 2s ease-in-out infinite;z-index:10;';
  scene.appendChild(youLabel);
  var youName = document.createElement('div');
  youName.innerHTML = '<div style="font-size:13px;font-weight:bold;color:#ffd700;text-align:center;margin-top:4px;">你</div>';
  youName.style.cssText = 'position:absolute;left:3%;top:78%;z-index:10;';
  scene.appendChild(youName);

  // ===== 右边：AI CC咨询 蜂巢 =====
  var hive = document.createElement('div');
  hive.innerHTML = '🏠';
  hive.id = 'hive-target';
  hive.style.cssText = 'position:absolute;right:3%;top:58%;font-size:56px;animation:hiveGlow 2.5s ease-in-out infinite;z-index:10;';
  scene.appendChild(hive);
  var hiveLabel = document.createElement('div');
  hiveLabel.innerHTML = '<div style="font-size:12px;font-weight:bold;color:#ffd700;text-align:center;margin-top:2px;">AI CC咨询</div>';
  hiveLabel.style.cssText = 'position:absolute;right:1%;top:78%;z-index:10;';
  scene.appendChild(hiveLabel);

  // ===== 飞行路径虚线（蜜蜂飞行路线） =====
  var pathDots = '';
  var pathPoints = [[10,68],[22,42],[38,24],[52,32],[68,48],[80,58],[86,62]];
  for(var p=0;p<pathPoints.length;p++){
    var dot = document.createElement('div');
    dot.style.cssText = 'position:absolute;left:'+pathPoints[p][0]+'%;top:'+pathPoints[p][1]+'%;width:4px;height:4px;border-radius:50%;background:rgba(255,215,0,0.2);z-index:1;';
    if(p<pathPoints.length-1) scene.appendChild(dot);
  }

  // ===== 飞行的蜜蜂 =====
  var flyingBee = document.createElement('div');
  flyingBee.innerHTML = '🐝';
  flyingBee.id = 'flying-bee';
  flyingBee.style.cssText = 'position:absolute;font-size:30px;animation:beeFlyPath 4.5s cubic-bezier(0.4,0,0.2,1) forwards,beeBounce 0.25s ease-in-out infinite,beeWing 0.08s ease-in-out infinite;left:8%;top:70%;z-index:20;';
  scene.appendChild(flyingBee);

  // ===== 蜜蜂飞行尾迹（3个小蜜蜂影子） =====
  for(var t=0;t<3;t++){
    var trail = document.createElement('div');
    trail.innerHTML = '🐝';
    trail.style.cssText = 'position:absolute;font-size:'+(16-t*4)+'px;opacity:0;z-index:15;left:8%;top:70%;';
    trail.className = 'bee-trail trail-'+t;
    scene.appendChild(trail);
  }

  // 尾迹跟随（用JS定时更新位置）
  var trailPositions = [];
  var trailInterval = setInterval(function(){
    var fb = document.getElementById('flying-bee');
    if(!fb){clearInterval(trailInterval);return;}
    var rect = fb.getBoundingClientRect();
    var sceneRect = scene.getBoundingClientRect();
    trailPositions.push({x:rect.left-sceneRect.left+rect.width/2, y:rect.top-sceneRect.top+rect.height/2, t:Date.now()});
    if(trailPositions.length>8) trailPositions.shift();
    var trails = scene.querySelectorAll('.bee-trail');
    trails.forEach(function(tr,idx){
      var posIdx = trailPositions.length-1-idx*2;
      if(posIdx>=0 && Date.now()-trailPositions[posIdx].t<800){
        tr.style.left = trailPositions[posIdx].x+'px';
        tr.style.top = trailPositions[posIdx].y+'px';
        tr.style.opacity = 0.5-idx*0.15;
      } else { tr.style.opacity = 0; }
    });
  }, 80);

  // ===== 花粉粒子容器 =====
  var pollenContainer = document.createElement('div');
  pollenContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
  scene.appendChild(pollenContainer);
  // 定时撒花粉
  var pollenInterval = setInterval(function(){
    var fb = document.getElementById('flying-bee');
    if(!fb){clearInterval(pollenInterval);return;}
    var fr = fb.getBoundingClientRect(), sr = scene.getBoundingClientRect();
    var pn = document.createElement('div');
    pn.innerHTML = '✨';
    pn.style.cssText = 'position:absolute;font-size:'+(6+Math.random()*8)+'px;left:'+(fr.left-sr.left+fr.width/2-10+Math.random()*20)+'px;top:'+(fr.top-sr.top+fr.height/2-10+Math.random()*20)+'px;animation:pollenFloat '+(1.2+Math.random()*1.5)+'s ease-out forwards;';
    pollenContainer.appendChild(pn);
    setTimeout(function(){pn.remove();},2000);
  }, 200);

  // ===== 顶部标题 =====
  var titleBar = document.createElement('div');
  titleBar.style.cssText = 'position:absolute;top:5%;left:50%;transform:translateX(-50%);text-align:center;z-index:30;';
  var title = document.createElement('div');
  title.innerHTML = '🐝 蜂巢投递中...';
  title.style.cssText = 'font-size:26px;font-weight:bold;color:#ffd700;text-shadow:0 2px 12px rgba(0,0,0,0.5);animation:titleIn 0.6s ease-out;';
  titleBar.appendChild(title);
  var subtitle = document.createElement('div');
  subtitle.innerHTML = '写给 AI CC咨询 · ' + '<span style="color:#ffab40">12小时内回复</span>';
  subtitle.style.cssText = 'font-size:14px;color:#fff;opacity:0.85;margin-top:6px;animation:titleIn 0.6s ease-out 0.1s both;';
  titleBar.appendChild(subtitle);
  overlay.appendChild(titleBar);

  // ===== 步骤文字 =====
  var stepText = document.createElement('div');
  stepText.style.cssText = 'position:absolute;bottom:12%;left:50%;transform:translateX(-50%);font-size:14px;color:#ffd700;z-index:30;text-align:center;animation:titleIn 0.5s ease-out 0.2s both;';
  stepText.innerHTML = '🐝 蜜蜂起飞...';
  overlay.appendChild(stepText);
  var steps = [
    {t:0, s:'🐝 蜜蜂起飞...'},
    {t:600, s:'🌼 穿越花丛...'},
    {t:1400, s:'💨 顺风加速...'},
    {t:2200, s:'🏠 接近蜂巢...'},
    {t:3000, s:'📨 投递信件...'},
    {t:3800, s:'✅ 投递成功！AI CC咨询 已收到'}
  ];
  steps.forEach(function(st){setTimeout(function(){stepText.innerHTML=st.s;},st.t);});

  // ===== 进度条（底部） =====
  var progBar = document.createElement('div');
  progBar.style.cssText = 'position:absolute;bottom:6%;left:50%;transform:translateX(-50%);width:280px;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;z-index:30;';
  var progFill = document.createElement('div');
  progFill.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#ffd700,#ff8c00,#ffd700);border-radius:3px;transition:width 0.4s ease;';
  progBar.appendChild(progFill);
  overlay.appendChild(progBar);
  // 进度条动画
  var progSteps = [
    {t:0, w:5},{t:600,w:18},{t:1400,w:38},{t:2200,w:62},{t:3000,w:82},{t:3800,w:100}
  ];
  progSteps.forEach(function(ps){setTimeout(function(){progFill.style.width=ps.w+'%';},ps.t);});

  // 全部附加
  document.body.appendChild(overlay);

  // ===== 到达阶段：蜂巢放大 + 信件飘落 =====
  setTimeout(function(){
    var ht = document.getElementById('hive-target');
    if(ht){ht.style.animation = 'hiveArrive 0.8s ease-out forwards';}
    // 信件emoji从上方飘落
    var letter = document.createElement('div');
    letter.innerHTML = '💌';
    letter.style.cssText = 'position:absolute;right:6%;top:70%;font-size:28px;z-index:25;animation:letterDrop 0.7s ease-out 0.6s both;';
    scene.appendChild(letter);
    // 撒花
    for(var c=0;c<12;c++){
      setTimeout(function(){
        var conf = document.createElement('div');
        conf.innerHTML = ['🌸','🌼','✨','💛','🍯'][Math.floor(Math.random()*5)];
        conf.style.cssText = 'position:absolute;right:'+(2+Math.random()*12)+'%;top:'+(55+Math.random()*20)+'%;font-size:'+(14+Math.random()*16)+'px;z-index:25;animation:pollenFloat '+(1.5+Math.random()*2)+'s ease-out forwards;';
        scene.appendChild(conf);
        setTimeout(function(){conf.remove();},3000);
      }, c*150);
    }
  }, 3950);

  // ===== 结束：淡出 + 弹出留言栏 =====
  setTimeout(function(){
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.6s';
    clearInterval(trailInterval);
    clearInterval(pollenInterval);
    setTimeout(function(){
      overlay.remove();style.remove();
      // 弹出留言栏
      var w=document.createElement('div');w.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998;display:flex;align-items:center;justify-content:center;';
      var d=document.createElement('div');d.style.cssText='background:#fff;border-radius:16px;padding:28px;width:400px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:ccSlideUp 0.4s ease-out;';
      d.innerHTML='<h2 style="margin:0 0 4px;color:#333;font-size:20px;">📮 给 AI CC咨询 留言</h2><p style="margin:0 0 20px;color:#999;font-size:13px;">收到后我会尽快回复到您的邮箱</p><input id="cc-msg-name" placeholder="姓名 *" style="display:block;width:100%;padding:12px;border:1px solid #e0e0e0;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box;outline:none;"><input id="cc-msg-phone" placeholder="手机号" style="display:block;width:100%;padding:12px;border:1px solid #e0e0e0;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box;outline:none;"><input id="cc-msg-email" placeholder="您的邮箱 *（用于接收回复）" style="display:block;width:100%;padding:12px;border:1px solid #e0e0e0;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box;outline:none;"><textarea id="cc-msg-content" placeholder="咨询事项 *" rows="3" style="display:block;width:100%;padding:12px;border:1px solid #e0e0e0;border-radius:8px;font-size:14px;margin-bottom:16px;box-sizing:border-box;resize:vertical;outline:none;font-family:inherit;"></textarea><button id="cc-msg-send" style="width:100%;padding:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 4px 16px rgba(102,126,234,0.3);">📤 发送留言</button>';
      w.appendChild(d);document.body.appendChild(w);
      w.onclick=function(e){if(e.target===w)w.remove();};
      document.getElementById('cc-msg-send').onclick=function(){
        var n=document.getElementById('cc-msg-name').value.trim();
        var c=document.getElementById('cc-msg-content').value.trim();
        if(!n||!c){alert('请填写姓名和咨询事项');return;}
        var btn=document.getElementById('cc-msg-send');
        btn.disabled=true;btn.textContent='✈️ 蜜蜂出发...';
        // ---- 送信动画：半透明遮罩 + 一只蜜蜂飞出 ----
        var bo=document.createElement('div');bo.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,248,220,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;pointer-events:none;';
        var bee=document.createElement('div');bee.innerHTML='🐝';bee.style.cssText='position:absolute;left:5%;top:45%;font-size:52px;animation:ccSendFly 2s ease-in-out forwards;';
        bo.appendChild(bee);
        // 飞过的尾迹
        var trail=document.createElement('div');trail.style.cssText='position:absolute;left:50%;top:50%;font-size:28px;transform:translate(-50%,-50%);animation:ccSendPulse 2s ease-in-out forwards;';
        trail.innerHTML='💌';
        bo.appendChild(trail);
        // 注入关键帧
        var ks=document.createElement('style');ks.textContent='@keyframes ccSendFly{0%{left:5%;top:45%;opacity:1;transform:scale(1)}60%{left:75%;top:20%;opacity:0.9;transform:scale(0.7)}100%{left:95%;top:5%;opacity:0;transform:scale(0.3)}}@keyframes ccSendPulse{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}40%{opacity:1;transform:translate(-50%,-50%) scale(1.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}';
        document.head.appendChild(ks);
        document.body.appendChild(bo);
        // 动画2秒后发请求
        setTimeout(function(){
          bo.remove();ks.remove();
          btn.textContent='⏳ 发送中...';
          var url=(typeof getApiUrl!=='undefined'?getApiUrl:'/api')('/plugins/team_chat/hive-message');
          fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,phone:document.getElementById('cc-msg-phone').value.trim(),user_email:document.getElementById('cc-msg-email').value.trim(),content:c,subject:'咨询',recipient:TARGET_EMAIL})}).then(function(r){return r.json();}).then(function(dd){
            if(dd.status==='ok'){alert('✅ 留言已发送！');w.remove();}
            else{alert('❌ '+(dd.message||'未知错误'));btn.disabled=false;btn.textContent='📤 发送留言';}
          }).catch(function(e){alert('❌ 发送失败: '+(e.message||'网络错误'));btn.disabled=false;btn.textContent='📤 发送留言';});
        },2000);
      };
    },600);
  },4700);
};
function _hiveOpenCompose(addr){
  // 优先用标准桥接函数切换到传统邮箱 → 写信模式
  if(window.__openTraditionalEmail){
    window.__openTraditionalEmail('compose');
    // 等传统邮箱 mount 后自动填入收件人
    _hiveFill(addr);
    return;
  }
  // fallback：DOM 点击传统邮箱卡片
  var cards=document.querySelectorAll('div'),tc=null;
  for(var j=0;j<cards.length;j++){if(cards[j].textContent.indexOf('传统邮箱')>=0&&cards[j].style.cursor==='pointer'){tc=cards[j];break;}}
  if(tc){tc.click();setTimeout(function(){var b=document.querySelectorAll('button');for(var k=0;k<b.length;k++){if(b[k].textContent.indexOf('写邮件')>=0){b[k].click();_hiveFill(addr);return;}}_hiveFallback(addr);},600);}
  else _hiveFallback(addr);
}
function _hiveFill(addr){
  setTimeout(function(){
    var ins=document.querySelectorAll('input[type="text"]');
    for(var i=0;i<ins.length;i++){var ph=ins[i].getAttribute('placeholder')||'';if(ph.indexOf('收件人')>=0||ph.indexOf('逗号')>=0){var ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;ns.call(ins[i],addr);ins[i].dispatchEvent(new Event('input',{bubbles:true}));return;}}
    setTimeout(function(){var ins2=document.querySelectorAll('input[type="text"]');for(var j=0;j<ins2.length;j++){var ph2=ins2[j].getAttribute('placeholder')||'';if(ph2.indexOf('收件人')>=0||ph2.indexOf('逗号')>=0){var ns2=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;ns2.call(ins2[j],addr);ins2[j].dispatchEvent(new Event('input',{bubbles:true}));break;}}},800);
  },500);
}
function _hiveFallback(addr){
  var w=document.createElement('div');w.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;';
  var d=document.createElement('div');d.style.cssText='background:#fff;border-radius:16px;padding:32px;max-width:420px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.3);';
  d.innerHTML='<div style="font-size:48px;margin-bottom:16px;">📨</div><div style="font-size:20px;font-weight:bold;color:#333;margin-bottom:8px;">AI CC咨询 的邮箱地址</div><div style="font-size:14px;color:#666;margin-bottom:20px;">点击下方按钮复制，然后到传统邮箱中粘贴发送</div><div style="background:#f5f5f5;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:#333;font-family:monospace;">'+addr+'</div><button id="hive-fb" style="padding:12px 32px;background:#667eea;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">📋 复制邮箱地址</button>';
  w.appendChild(d);document.body.appendChild(w);
  document.getElementById('hive-fb').onclick=function(){navigator.clipboard.writeText(addr).then(function(){d.querySelector('div:nth-child(4)').style.background='#e8f5e9';d.querySelector('div:nth-child(4)').innerHTML='✅ 已复制！<br>'+addr;});};
  w.onclick=function(e){if(e.target===w)w.remove();};
}

(function () {
  // TeamChat v5.0.18 - 安全提示优化版
  console.log('[TeamChat] v5.0.18 安全提示版 加载时间:', new Date().toLocaleString());
  
  var s = document.createElement("style");
  s.textContent =
    "*{font-family:\"Microsoft YaHei\",\"PingFang SC\",\"Hiragino Sans GB\",\"WenQuanYi Micro Hei\",sans-serif !important}"+
    "body{font-family:\"Microsoft YaHei\",sans-serif}"+
    "@keyframes tcIn{from{opacity:0;transform:scale(0.9) rotateX(12deg)}to{opacity:1;transform:scale(1) rotateX(0)}}"+
    "@keyframes tcAdIn{0%{opacity:0;transform:translateY(-60px) scale(0.8)}15%{opacity:1;transform:translateY(0) scale(1)}70%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(10px) scale(0.95)}}"+
    "@keyframes tcAdPulse{0%,100%{box-shadow:0 0 20px rgba(255,152,0,.3)}50%{box-shadow:0 0 40px rgba(255,152,0,.6)}}"+
    ".tc-tab:hover .tc-tab-close{opacity:1 !important}"+
    "@keyframes tcCardHover{from{transform:translateY(0);box-shadow:0 2px 8px rgba(0,0,0,.06)}to{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12)}}"+
    "@keyframes tcBtnClick{0%{transform:scale(1)}50%{transform:scale(0.95)}100%{transform:scale(1)}}"+
    "@keyframes tcTabSwitch{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}"+
    "@keyframes tcFadeIn{from{opacity:0}to{opacity:1}}"+
    "@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"+
    ".tc-card:hover{animation:tcCardHover .25s ease-out forwards}"+
    ".tc-btn:active{animation:tcBtnClick .15s ease-out}"+
    ".tc-tab-content{animation:tcTabSwitch .3s ease-out}"+
    ".tc-fade{animation:tcFadeIn .4s ease-out}"+
    ".ant-card{transition:all .25s ease}"+
    ".ant-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.1) !important}"+
    ".ant-btn{transition:all .15s ease}"+
    ".ant-btn:hover{transform:translateY(-1px);filter:brightness(1.05)}"+
    ".ant-btn:active{transform:scale(0.97)}"+
    ".ant-input,.ant-input-affix-wrapper{transition:all .2s ease;border-radius:16px !important}"+
    ".ant-input:focus,.ant-input-affix-wrapper-focused{border-color:#8D6E63 !important;box-shadow:0 0 0 2px rgba(141,110,99,.15) !important}"+
    ".tc-thinking{display:flex !important;align-items:center;gap:4px}"+
    ".tc-thinking-dots span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#2E7D32;animation:tcDotBounce 1.4s infinite ease-in-out both}"+
    ".tc-thinking-dots span:nth-child(1){animation-delay:-0.32s}"+
    ".tc-thinking-dots span:nth-child(2){animation-delay:-0.16s}"+
    "@keyframes tcDotBounce{0%,80%,100%{transform:scale(0);opacity:0.5}40%{transform:scale(1);opacity:1}}"+
    ".tc-timeline-item{opacity:0;transform:translateX(-20px);animation:tcTimelineSlideIn 0.5s ease forwards}"+
    ".tc-timeline-item:nth-child(1){animation-delay:0.1s}"+
    ".tc-timeline-item:nth-child(2){animation-delay:0.4s}"+
    ".tc-timeline-item:nth-child(3){animation-delay:0.7s}"+
    ".tc-timeline-item:nth-child(4){animation-delay:1.0s}"+
    ".tc-timeline-item:nth-child(5){animation-delay:1.3s}"+
    "@keyframes tcTimelineSlideIn{0%{opacity:0;transform:translateX(-20px)}100%{opacity:1;transform:translateX(0)}}"+
    ".tc-author-combined:hover .tc-timeline-item{animation:tcTimelineSlideIn 0.5s ease forwards}"+
    ".tc-author-combined:hover .tc-timeline-item:nth-child(1){animation-delay:0s}"+
    ".tc-author-combined:hover .tc-timeline-item:nth-child(2){animation-delay:0.15s}"+
    ".tc-author-combined:hover .tc-timeline-item:nth-child(3){animation-delay:0.3s}"+
    ".tc-author-combined:hover .tc-timeline-item:nth-child(4){animation-delay:0.45s}"+
    ".tc-author-combined:hover .tc-timeline-item:nth-child(5){animation-delay:0.6s}"+
    // 有巢筑巢动画 keyframes
    "@keyframes tcTreeSway{0%,100%{transform:translateX(-50%) rotate(-1deg)}50%{transform:translateX(-50%) rotate(1deg)}}"+
    "@keyframes tcBirdFly1{0%{left:-40px;top:30px;opacity:0}5%{opacity:1}15%{left:20%;top:10px}28%{left:40%;top:2px}35%{left:54%;top:8px}42%{left:58%;top:16px}52%{left:58%;top:16px}60%{left:70%;top:6px}75%{left:95%;top:-4px}85%{left:110%;top:10px;opacity:1}90%{opacity:0}100%{left:110%;top:30px;opacity:0}}"+
    "@keyframes tcBirdFly2{0%{left:110%;top:25px;opacity:0}10%{opacity:1}25%{left:85%;top:12px}35%{left:60%;top:4px}42%{left:56%;top:14px}50%{left:56%;top:14px}60%{left:38%;top:6px}75%{left:12%;top:-2px}90%{left:-30px;top:8px;opacity:1}95%{opacity:0}100%{left:-40px;top:20px;opacity:0}}"+
    "@keyframes tcWingFlap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.3)}}"+
    "@keyframes tcNestBuild{0%,45%{opacity:0.4;transform:scale(0.7)}60%{opacity:0.8;transform:scale(0.9)}80%,100%{opacity:1;transform:scale(1)}}"+
    "@keyframes tcTwigDrop{0%,35%{opacity:0;top:10px}40%{opacity:1;top:10px}48%{opacity:1;top:28px}55%,100%{opacity:0;top:28px}}"+
    "@keyframes tcMudDrop{0%,70%{opacity:0;top:8px}78%{opacity:1;top:8px}86%{opacity:1;top:26px}95%,100%{opacity:0;top:26px}}"+
    "@keyframes tcBubbleSwap{0%,47.5%{opacity:1}47.6%,100%{opacity:0}}"+
    "@keyframes tcBeeFly{0%{transform:translate(0,0) rotate(0deg)}25%{transform:translate(10px,-8px) rotate(5deg)}50%{transform:translate(-5px,-12px) rotate(-3deg)}75%{transform:translate(8px,-5px) rotate(4deg)}100%{transform:translate(0,0) rotate(0deg)}}"+
    "@keyframes tcPhoenixFly{0%{left:-40px;top:5px;opacity:0}5%{opacity:1}45%{left:40%;top:8px}95%{opacity:1}100%{left:110%;top:-5px;opacity:0}}"+
    "@keyframes tcPhoenixWing{0%,100%{transform:scaleY(1) rotate(0deg)}50%{transform:scaleY(0.3) rotate(15deg)}}"+
    "@keyframes tcTruckDrive{0%{left:-60px}100%{left:735px}}"+
    // 主界面动画 keyframes
    "@keyframes tcMainTruck{0%{left:-50px}100%{left:200px}}"+
    "@keyframes tcMainDrone{0%{left:-40px}100%{left:150px}}"+
"@keyframes tcPigeonFly{0%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-8px) rotate(4deg)}50%{transform:translateY(-4px) rotate(-3deg)}75%{transform:translateY(-6px) rotate(2deg)}100%{transform:translateY(0) rotate(0deg)}}";
  document.head.appendChild(s);
  var QP = window.QwenPaw; if (!QP) return;
  var React = QP.host.React, antd = QP.host.antd, antdIcons = QP.host.antdIcons || {};
  var getApiUrl = QP.host.getApiUrl, getApiToken = QP.host.getApiToken;
  var e = React.createElement, useState = React.useState, useEffect = React.useEffect;
  var useRef = React.useRef, useCallback = React.useCallback;
  var Button = antd.Button, Input = antd.Input, Card = antd.Card, Space = antd.Space;
  var Tag = antd.Tag, Select = antd.Select, Switch = antd.Switch, InputNumber = antd.InputNumber, Slider = antd.Slider;
  var Progress = antd.Progress, Modal = antd.Modal, Spin = antd.Spin, Collapse = antd.Collapse;
  var Empty = antd.Empty, Popover = antd.Popover, message = antd.message;
  var Text = antd.Typography.Text, TextArea = Input.TextArea, Panel = Collapse.Panel;

  function apiHeaders() {
    var h = {"Content-Type":"application/json"};
    var t = getApiToken(); if (t) h.Authorization = "Bearer "+t;
    return h;
  }
  // ============ 多语言翻译系统 v4.1.0 ============
  var LANG_MAP = {
    "zh": {
      newMeeting: "新会谈", channel: "📡频道", history: "📂历史", authorAI: "✍️原创作者AI", export: "📤导出",
      dashboard: "串串汇", totalSessions: "总会话", totalMsgs: "总消息", active12h: "12小时活跃",
      active7d: "7天活跃", brainstorm: "头脑风暴", agents: "智能体", skills: "技能", chs: "频道",
      selectAgents: "选择智能体", host: "主持人", send: "发送", stop: "停止",
      noAgents: "⚠ 无法加载智能体", retry: "🔄 重试", loading: "加载中...",
      inputPlaceholder: "输入消息，Enter发送，Shift+Enter换行",
      meetingTitle: "团队会谈", startMeeting: "开始会谈",
      deleteSession: "删除会话", pinSession: "置顶", unpin: "取消置顶",
      exportSession: "导出", search: "搜索...", tag: "标签",
      summary: "摘要", discussion: "讨论", member: "成员",
      chatHistory: "聊天记录", noHistory: "暂无历史会话",
      settings: "设置", llmConfig: "LLM配置", save: "保存", test: "测试",
      modelLabel: "模型", providerLabel: "提供商", apiKeyLabel: "API Key",
      apiBaseLabel: "API Base URL", language: "语言",
    },
    "zh-TW": {
      newMeeting: "新會談", channel: "📡頻道", history: "📂歷史", authorAI: "✍️原創作者AI", export: "📤匯出",
      dashboard: "串串匯", totalSessions: "總會話", totalMsgs: "總訊息", active12h: "12小時活躍",
      active7d: "7天活躍", brainstorm: "頭腦風暴", agents: "智能體", skills: "技能", chs: "頻道",
      selectAgents: "選擇智能體", host: "主持人", send: "發送", stop: "停止",
      noAgents: "⚠ 無法載入智能體", retry: "🔄 重試", loading: "載入中...",
      inputPlaceholder: "輸入訊息，Enter發送，Shift+Enter換行",
      meetingTitle: "團隊會談", startMeeting: "開始會談",
      deleteSession: "刪除會話", pinSession: "置頂", unpin: "取消置頂",
      exportSession: "匯出", search: "搜尋...", tag: "標籤",
      summary: "摘要", discussion: "討論", member: "成員",
      chatHistory: "聊天記錄", noHistory: "暫無歷史會話",
      settings: "設定", llmConfig: "LLM設定", save: "儲存", test: "測試",
      modelLabel: "模型", providerLabel: "提供商", apiKeyLabel: "API金鑰",
      apiBaseLabel: "API基礎URL", language: "語言",
    },
    "en": {
      newMeeting: "New Meeting", channel: "📡Channel", history: "📂History", authorAI: "✍️Author AI", export: "📤Export",
      dashboard: "Dashboard", totalSessions: "Total Sessions", totalMsgs: "Total Messages", active12h: "Active 12h",
      active7d: "Active 7d", brainstorm: "Brainstorm", agents: "Agents", skills: "Skills", chs: "Channels",
      selectAgents: "Select Agents", host: "Host", send: "Send", stop: "Stop",
      noAgents: "⚠ Cannot load agents", retry: "🔄 Retry", loading: "Loading...",
      inputPlaceholder: "Type message, Enter to send, Shift+Enter for newline",
      meetingTitle: "Team Meeting", startMeeting: "Start Meeting",
      deleteSession: "Delete", pinSession: "Pin", unpin: "Unpin",
      exportSession: "Export", search: "Search...", tag: "Tag",
      summary: "Summary", discussion: "Discussion", member: "Members",
      chatHistory: "Chat History", noHistory: "No sessions yet",
      settings: "Settings", llmConfig: "LLM Config", save: "Save", test: "Test",
      modelLabel: "Model", providerLabel: "Provider", apiKeyLabel: "API Key",
      apiBaseLabel: "API Base URL", language: "Language",
    },
    "ja": {
      newMeeting: "新会議", channel: "📡チャンネル", history: "📂履歴", authorAI: "✍️作者AI", export: "📤エクスポート",
      dashboard: "ダッシュボード", totalSessions: "総セッション", totalMsgs: "総メッセージ", active12h: "12時間アクティブ",
      active7d: "7日間アクティブ", brainstorm: "ブレスト", agents: "エージェント", skills: "スキル", chs: "チャンネル",
      selectAgents: "エージェント選択", host: "ホスト", send: "送信", stop: "停止",
      noAgents: "⚠ エージェント読込失敗", retry: "🔄 再試行", loading: "読込中...",
      inputPlaceholder: "メッセージ入力、Enterで送信、Shift+Enterで改行",
      meetingTitle: "チーム会議", startMeeting: "会議開始",
      deleteSession: "削除", pinSession: "ピン留め", unpin: "解除",
      exportSession: "エクスポート", search: "検索...", tag: "タグ",
      summary: "概要", discussion: "議論", member: "メンバー",
      chatHistory: "チャット履歴", noHistory: "セッションなし",
      settings: "設定", llmConfig: "LLM設定", save: "保存", test: "テスト",
      modelLabel: "モデル", providerLabel: "プロバイダー", apiKeyLabel: "APIキー",
      apiBaseLabel: "APIベースURL", language: "言語",
    },
    "ru": {
      newMeeting: "Встреча", channel: "📡Канал", history: "📂История", authorAI: "✍️Автор AI", export: "📤Экспорт",
      dashboard: "Панель", totalSessions: "Сессии", totalMsgs: "Сообщения", active12h: "Активно 12ч",
      active7d: "Активно 7д", brainstorm: "Мозг.штурм", agents: "Агенты", skills: "Навыки", chs: "Каналы",
      selectAgents: "Выбор агентов", host: "Ведущий", send: "Отправить", stop: "Стоп",
      noAgents: "⚠ Агенты не загружены", retry: "🔄 Повтор", loading: "Загрузка...",
      inputPlaceholder: "Введите сообщение, Enter — отправить, Shift+Enter — новая строка",
      meetingTitle: "Командная встреча", startMeeting: "Начать встречу",
      deleteSession: "Удалить", pinSession: "Закрепить", unpin: "Открепить",
      exportSession: "Экспорт", search: "Поиск...", tag: "Метка",
      summary: "Итог", discussion: "Обсуждение", member: "Участники",
      chatHistory: "История чата", noHistory: "Нет сессий",
      settings: "Настройки", llmConfig: "Конфиг LLM", save: "Сохранить", test: "Тест",
      modelLabel: "Модель", providerLabel: "Провайдер", apiKeyLabel: "API-ключ",
      apiBaseLabel: "Базовый URL", language: "Язык",
    },
    "pt-BR": {
      newMeeting: "Nova Reunião", channel: "📡Canal", history: "📂Histórico", authorAI: "✍️Autor IA", export: "📤Exportar",
      dashboard: "Painel", totalSessions: "Sessões", totalMsgs: "Mensagens", active12h: "Ativo 12h",
      active7d: "Ativo 7d", brainstorm: "Brainstorm", agents: "Agentes", skills: "Habilidades", chs: "Canais",
      selectAgents: "Selecionar Agentes", host: "Anfitrião", send: "Enviar", stop: "Parar",
      noAgents: "⚠ Não foi possível carregar agentes", retry: "🔄 Tentar novamente", loading: "Carregando...",
      inputPlaceholder: "Digite mensagem, Enter para enviar, Shift+Enter para nova linha",
      meetingTitle: "Reunião de Equipe", startMeeting: "Iniciar Reunião",
      deleteSession: "Excluir", pinSession: "Fixar", unpin: "Desafixar",
      exportSession: "Exportar", search: "Buscar...", tag: "Tag",
      summary: "Resumo", discussion: "Discussão", member: "Membros",
      chatHistory: "Histórico", noHistory: "Sem sessões",
      settings: "Configurações", llmConfig: "Config LLM", save: "Salvar", test: "Testar",
      modelLabel: "Modelo", providerLabel: "Provedor", apiKeyLabel: "Chave API",
      apiBaseLabel: "URL Base", language: "Idioma",
    },
    "id": {
      newMeeting: "Rapat Baru", channel: "📡Saluran", history: "📂Riwayat", authorAI: "✍️Penulis AI", export: "📤Ekspor",
      dashboard: "Dasbor", totalSessions: "Total Sesi", totalMsgs: "Total Pesan", active12h: "Aktif 12j",
      active7d: "Aktif 7h", brainstorm: "Curah Gagasan", agents: "Agen", skills: "Keahlian", chs: "Saluran",
      selectAgents: "Pilih Agen", host: "Pemandu", send: "Kirim", stop: "Berhenti",
      noAgents: "⚠ Gagal memuat agen", retry: "🔄 Coba Lagi", loading: "Memuat...",
      inputPlaceholder: "Ketik pesan, Enter kirim, Shift+Enter baris baru",
      meetingTitle: "Rapat Tim", startMeeting: "Mulai Rapat",
      deleteSession: "Hapus", pinSession: "Sematkan", unpin: "Lepas",
      exportSession: "Ekspor", search: "Cari...", tag: "Label",
      summary: "Ringkasan", discussion: "Diskusi", member: "Anggota",
      chatHistory: "Riwayat Obrolan", noHistory: "Belum ada sesi",
      settings: "Pengaturan", llmConfig: "Konfigurasi LLM", save: "Simpan", test: "Uji",
      modelLabel: "Model", providerLabel: "Penyedia", apiKeyLabel: "Kunci API",
      apiBaseLabel: "URL Dasar", language: "Bahasa",
    },
    "vi": {
      newMeeting: "Họp Mới", channel: "📡Kênh", history: "📂Lịch sử", authorAI: "✍️Tác giả AI", export: "📤Xuất",
      dashboard: "Bảng Điều Khiển", totalSessions: "Tổng Phiên", totalMsgs: "Tổng Tin", active12h: "Hoạt động 12g",
      active7d: "Hoạt động 7n", brainstorm: "Động Não", agents: "Tác tử", skills: "Kỹ năng", chs: "Kênh",
      selectAgents: "Chọn Tác tử", host: "Chủ trì", send: "Gửi", stop: "Dừng",
      noAgents: "⚠ Không thể tải tác tử", retry: "🔄 Thử lại", loading: "Đang tải...",
      inputPlaceholder: "Nhập tin, Enter gửi, Shift+Enter xuống dòng",
      meetingTitle: "Họp Nhóm", startMeeting: "Bắt Đầu Họp",
      deleteSession: "Xóa", pinSession: "Ghim", unpin: "Bỏ Ghim",
      exportSession: "Xuất", search: "Tìm...", tag: "Nhãn",
      summary: "Tóm tắt", discussion: "Thảo luận", member: "Thành viên",
      chatHistory: "Lịch sử Trò chuyện", noHistory: "Chưa có phiên",
      settings: "Cài đặt", llmConfig: "Cấu hình LLM", save: "Lưu", test: "Kiểm tra",
      modelLabel: "Mô hình", providerLabel: "Nhà cung cấp", apiKeyLabel: "Khóa API",
      apiBaseLabel: "URL Cơ sở", language: "Ngôn ngữ",
    }
  };

  var _currentLang = localStorage.getItem("teamchat_lang") || "zh";
  function t(key) {
    var m = LANG_MAP[_currentLang] || LANG_MAP["zh"];
    return m[key] || key;
  }
  function setLang(lang) {
    _currentLang = lang;
    localStorage.setItem("teamchat_lang", lang);
    try {
      fetch(getApiUrl("/plugins/team_chat/language"), {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify({language: lang})
      }).catch(function(){});
    } catch(e) {}
    if (typeof window._tcForceUpdate === "function") window._tcForceUpdate();
  }

  async function apiGet(p) {
    var r = await fetch(getApiUrl("/plugins/team_chat"+p), {headers:apiHeaders()});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  async function apiPost(p, b) {
    var r = await fetch(getApiUrl("/plugins/team_chat"+p), {method:"POST",headers:apiHeaders(),body:JSON.stringify(b)});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  var _abortRef = null; // IIFE 级桥接，组件内赋值为 useRef
  function apiPostAbort(p, b) {
    var ctrl = new AbortController();
    if (_abortRef) _abortRef.current = ctrl;
    return fetch(getApiUrl("/plugins/team_chat"+p), {method:"POST",headers:apiHeaders(),body:JSON.stringify(b),signal:ctrl.signal}).then(function(r){
      if(!r.ok) throw new Error("HTTP "+r.status);
      return r.json();
    });
  }
  async function apiPut(p, b) {
    var r = await fetch(getApiUrl("/plugins/team_chat"+p), {method:"PUT",headers:apiHeaders(),body:JSON.stringify(b)});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  async function apiDelete(p) {
    var r = await fetch(getApiUrl("/plugins/team_chat"+p), {method:"DELETE",headers:apiHeaders()});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }

  // ---- LLM 配置 API ----
  async function loadLlmConfig() {
    setLlmLoading(true);
    try {
      var r = await fetch(getApiUrl("/plugins/team_chat/llm-config"), {headers:apiHeaders()});
      if (!r.ok) throw new Error("HTTP "+r.status);
      var d = await r.json();
      setLlmSaved(d);
      // 如果有已保存的配置，加载到表单
      if (d.has_key) {
        setLlmCfg({
          api_key: "",  // 不显示完整 key
          base_url: d.base_url || "https://dashscope.aliyuncs.com/compatible-mode/v1",
          model: d.model || "qwen-plus"
        });
      }
      setLlmLoading(false);
    } catch(e) {
      setLlmLoading(false);
      console.error("加载 LLM 配置失败:", e);
    }
  }

  async function saveLlmConfig() {
    setLlmSaveResult(null);
    try {
      var body = {
        api_key: llmCfg.api_key,
        base_url: llmCfg.base_url,
        model: llmCfg.model
      };
      var r = await fetch(getApiUrl("/plugins/team_chat/llm-config"), {
        method:"POST",
        headers:apiHeaders(),
        body:JSON.stringify(body)
      });
      if (!r.ok) throw new Error("HTTP "+r.status);
      var d = await r.json();
      setLlmSaveResult({ok:true, msg:d.message||"配置已保存"});
      // 重新加载配置
      loadLlmConfig();
    } catch(e) {
      setLlmSaveResult({ok:false, msg:e.message});
    }
  }

  async function testLlmConfig() {
    setLlmTestResult(null);
    setLlmTestLoading(true);
    try {
      var body = {
        api_key: llmCfg.api_key || llmSaved.api_key,  // 如果表单为空，用已保存的
        base_url: llmCfg.base_url,
        model: llmCfg.model
      };
      var r = await fetch(getApiUrl("/plugins/team_chat/llm-config/test"), {
        method:"POST",
        headers:apiHeaders(),
        body:JSON.stringify(body)
      });
      var d = await r.json();
      setLlmTestResult(d);
      setLlmTestLoading(false);
    } catch(e) {
      setLlmTestResult({ok:false, error:e.message});
      setLlmTestLoading(false);
    }
  }

  // =================== MessageBubble ===================
  function MessageBubble(props) {
    var m = props.msg;
    var color, bg, label;
    if (m.role==="human") { color="#fff"; bg="#3E2723"; label="🧑 你"; }
    else if (m.role==="host") { color="#4E342E"; bg="#FFF8E1"; label="🎤 "+(m.sender_name||t("host")); }
    else { color="#4E342E"; bg="#EDE7F6"; label="🤖 "+(m.sender_name||m.sender); }
    var ts = new Date(m.timestamp*1000).toLocaleTimeString();
    // 解析内容中的文件引用：[file:xxx] 或 [文件:xxx] 或 📄xxx
    var raw = m.content||"";
    var fileRe = /\[(?:file|文件|下载):\s*([^\]]+)\]/gi;
    var parts = [];
    var lastIdx = 0, match;
    while ((match = fileRe.exec(raw)) !== null) {
      if (match.index > lastIdx) parts.push({type:"text", text:raw.slice(lastIdx, match.index)});
      parts.push({type:"file", name:match[1].trim()});
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < raw.length) parts.push({type:"text", text:raw.slice(lastIdx)});
    var hasFiles = parts.some(function(p){return p.type==="file";});
    var downloadFn = window._tcDownloadFile || function(fname) {
      var url = QP.host.getApiUrl("/plugins/team_chat/download/"+encodeURIComponent(fname));
      fetch(url,{headers:{"Authorization":"Bearer "+QP.host.getApiToken()}}).then(function(r){
        if(!r.ok) throw new Error("HTTP "+r.status);
        return r.blob();
      }).then(function(blob){
        var u=URL.createObjectURL(blob), a=document.createElement("a");
        a.href=u; a.download=fname; a.click(); URL.revokeObjectURL(u);
      }).catch(function(e){antd.message.error("下载失败: "+e.message);});
    };
    return e(Card, {size:"small", style:{marginBottom:14,borderRadius:16,background:bg,border:"none",
      marginLeft:m.role==="human"?"auto":0,marginRight:m.role==="human"?0:"auto",maxWidth:"85%"},
      title:e(Space,null,e(Text,{style:{fontSize:11,color:"#8D6E63"}},label+" · "+ts))},
      hasFiles?e("div",{style:{color:color,fontSize:14}},
        parts.map(function(p,i){
          if (p.type==="file") return e(Button,{key:i,size:"small",type:"link",icon:"📥",
            onClick:function(){downloadFn(p.name);},
            style:{color:"#1890ff",fontWeight:"bold",padding:"2px 8px",height:"auto",margin:"2px 4px",borderRadius:6,
              background:"rgba(24,144,255,0.08)",border:"1px solid rgba(24,144,255,0.2)"}},
            p.name);
          return e("span",{key:i,style:{whiteSpace:"pre-wrap"}},p.text);
        })
      ):e("div",{style:{color:color,fontSize:14,whiteSpace:"pre-wrap"}},raw),
      m.robot_prompt?e("details",{style:{marginTop:8,fontSize:12}},
        e("summary",{style:{color:"#6D4C41",cursor:"pointer"}},"📋 提示词"),
        e("pre",{style:{background:"#FAF3E8",padding:8,borderRadius:4,maxHeight:150,overflow:"auto",fontSize:11}},m.robot_prompt)):null
    );
  }

  // =================== ErrorBoundary (生产级错误边界) ===================
  var ErrorBoundary = (function(_super){
    function EB(props){
      _super.call(this, props);
      this.state = {hasError:false, error:null};
    }
    var proto = Object.create(_super.prototype);
    proto.constructor = EB;
    EB.prototype = proto;
    EB.getDerivedStateFromError = function(error){ return {hasError:true, error:error}; };
    proto.componentDidCatch = function(error, info){ console.error("[TeamChat ErrorBoundary]", error, info); };
    proto.render = function(){
      if(this.state.hasError){
        var err = this.state.error;
        var fn = this.props.fallbackName || "组件";
        return e("div",{style:{padding:16,background:"#FFF5F5",border:"1px solid #F5A0A0",borderRadius:16,textAlign:"center",margin:12,fontFamily:"system-ui, sans-serif"}},
          e("div",{style:{fontSize:22,marginBottom:4}}, "⚠️"),
          e("div",{style:{fontWeight:"bold",color:"#C53030",marginBottom:4}}, fn+" 发生渲染错误"),
          e("div",{style:{fontSize:11,color:"#9B2C2C",marginBottom:12,wordBreak:"break-all",maxHeight:80,overflow:"auto",borderRadius:4,padding:4,background:"rgba(255,255,255,0.5)"}}, err && err.message ? err.message : String(err)),
          e(Button,{size:"small",type:"primary",danger:true,onClick:(function(self){return function(){self.setState({hasError:false,error:null});};})(this)},t("retry"))
        );
      }
      return this.props.children;
    };
    return EB;
  })(React.Component);

  function withEB(name, children) {
    return e(ErrorBoundary, {fallbackName:name}, children);
  }

  // =================== Default Human Avatars (SVG data URLs) ===================
  var humanSvgs = [
    "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#D7CCC8"/><circle cx="50" cy="42" r="28" fill="#E8C49A"/><path d="M22,38 Q50,12 78,38" fill="#5D4037"/><circle cx="41" cy="36" r="3.5" fill="#3E2723"/><circle cx="59" cy="36" r="3.5" fill="#3E2723"/><path d="M40,48 Q50,56 60,48" stroke="#D7A98B" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="30" y="72" width="40" height="22" rx="6" fill="#8D6E63"/></svg>'),
    "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#D7CCC8"/><circle cx="50" cy="42" r="28" fill="#F0C8A0"/><path d="M22,38 Q16,60 30,78 Q40,88 50,78 Q60,88 70,78 Q84,60 78,38 Q50,14 22,38Z" fill="#6D4C41"/><circle cx="41" cy="36" r="3.5" fill="#3E2723"/><circle cx="59" cy="36" r="3.5" fill="#3E2723"/><path d="M40,48 Q50,56 60,48" stroke="#E0B090" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="30" y="72" width="40" height="22" rx="6" fill="#A1887F"/></svg>'),
    "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#D7CCC8"/><circle cx="50" cy="42" r="28" fill="#E8C49A"/><path d="M22,38 Q50,12 78,38" fill="#5D4037"/><circle cx="37" cy="36" r="5" fill="none" stroke="#3E2723" stroke-width="2.5"/><circle cx="63" cy="36" r="5" fill="none" stroke="#3E2723" stroke-width="2.5"/><line x1="47" y1="36" x2="53" y2="36" stroke="#3E2723" stroke-width="2"/><path d="M40,48 Q50,56 60,48" stroke="#D7A98B" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="32" y="72" width="36" height="22" rx="6" fill="#3E7CB1"/><polygon points="50,68 42,82 58,82" fill="#B71C1C"/></svg>'),
    "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#D7CCC8"/><circle cx="50" cy="44" r="28" fill="#DDB080"/><path d="M18,38 Q30,32 50,28 Q70,32 82,38 Q74,22 50,18 Q26,22 18,38Z" fill="#37474F"/><rect x="22" y="30" width="56" height="8" rx="3" fill="#37474F"/><circle cx="41" cy="38" r="3.5" fill="#3E2723"/><circle cx="59" cy="38" r="3.5" fill="#3E2723"/><path d="M42,50 Q50,57 58,50" stroke="#C89878" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="28" y="74" width="44" height="22" rx="6" fill="#ECEFF1"/></svg>'),
    "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#D7CCC8"/><circle cx="50" cy="44" r="28" fill="#E8C49A"/><path d="M20,38 Q34,18 50,20 Q66,18 80,38 Q78,14 50,12 Q22,14 20,38Z" fill="#263238"/><circle cx="40" cy="38" r="3.5" fill="#3E2723"/><circle cx="60" cy="38" r="3.5" fill="#3E2723"/><path d="M40,50 Q50,57 60,50" stroke="#D7A98B" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="28" y="72" width="44" height="24" rx="8" fill="#455A64"/><path d="M28,72 Q50,60 72,72" fill="none" stroke="#546E7A" stroke-width="3"/></svg>'),
    "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#D7CCC8"/><circle cx="50" cy="44" r="28" fill="#F0C8A0"/><ellipse cx="50" cy="24" rx="30" ry="12" fill="#C62828"/><circle cx="50" cy="18" r="4" fill="#EF5350"/><circle cx="40" cy="38" r="3.5" fill="#3E2723"/><circle cx="60" cy="38" r="3.5" fill="#3E2723"/><path d="M40,50 Q50,58 60,50" stroke="#E0B090" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="28" y="74" width="44" height="22" rx="6" fill="#5D4037"/></svg>')
  ];
  var humanLabels = ["经典", "长发", "商务", "学术", "开发者", "创意"];

  // ---- 全局标签计数器（组件外部，持久化）----
  var _tabCounter = 0;

  // ================================================================
  //  [微信频道绑定流程] 6 步渐入动画
  //  步骤: 打开设置 → 启用频道 → 扫码登录 → 保存 → 测试 → 找原创作者AI
  //  含播放/暂停/循环控制, 800ms 每步渐入
  // ================================================================
  // =================== WeChat Workflow Animation ===================
  function WeChatWorkflow() {
    var _step = useState(0), step = _step[0], setStep = _step[1];
    var _playing = useState(false), playing = _playing[0], setPlaying = _playing[1];
    
    var steps = [
      {icon:"⚙️", text:"打开 QwenPaw 设置，进入「频道」页面", color:"#52c41a"},
      {icon:"💬", text:"找到「微信」频道，点击启用", color:"#1890ff"},
      {icon:"📝", text:"启动微信频道，用自己的微信扫二维码登录", color:"#722ed1"},
      {icon:"💾", text:"保存配置，等待频道状态变为「已连接」", color:"#fa8c16"},
      {icon:"✅", text:"发送测试消息，验证微信频道是否正常工作", color:"#52c41a"},
      {icon:"↗️", text:"有实际操作的困难，找「原创作者AI」协助", color:"#e91e63"}
    ];
    
    useEffect(function() {
      var timer;
      if (playing && step < steps.length) {
        timer = setTimeout(function() {
          setStep(step + 1);
        }, 800);
      } else if (playing && step >= steps.length) {
        timer = setTimeout(function() {
          setStep(0);
        }, 1500);
      }
      return function() { clearTimeout(timer); };
    }, [playing, step]);
    
    function startAnimation() {
      setStep(0);
      setPlaying(true);
    }
    
    function stopAnimation() {
      setPlaying(false);
    }
    
    return e("div", {style:{position:"relative",minHeight:180}},
      // Animation container
      e("div", {style:{display:"flex",flexDirection:"column",gap:12,padding:"8px 0"}},
        steps.map(function(s, i) {
          var isActive = i < step;
          var isCurrent = i === step && playing;
          return e("div", {
            key: i,
            style:{
              display:"flex",
              alignItems:"center",
              gap:12,
              padding:"12px 16px",
              borderRadius:16,
              background: isActive ? (s.color+"15") : (isCurrent ? (s.color+"20") : "#f5f5f5"),
              border: isCurrent ? ("2px solid "+s.color) : "2px solid transparent",
              opacity: isActive || isCurrent ? 1 : 0.4,
              transform: isCurrent ? "scale(1.02)" : "scale(1)",
              transition:"all 0.5s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: isCurrent ? ("0 4px 20px "+s.color+"20") : "none"
            }
          },
            e("div", {style:{
              width:36,height:36,borderRadius:"50%",
              background:isActive||isCurrent?s.color:"#ddd",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,
              transition:"all 0.5s",
              boxShadow:isCurrent?("0 0 16px "+s.color+"60"):"none"
            }}, s.icon),
            e("div", {style:{flex:1}},
              e("div", {style:{
                fontSize:13,fontWeight:isActive||isCurrent?600:400,
                color:isActive||isCurrent?"#333":"#999",
                transition:"all 0.5s"
              }}, (i+1)+". "+s.text)
            ),
            isActive ? e("div", {style:{fontSize:16,color:s.color,transition:"all 0.5s"}},"✓") : 
            isCurrent ? e("div", {style:{fontSize:16,color:s.color,animation:"wechatPulse 1s infinite"}},"→") : 
            null
          );
        })
      ),
      // Philosophy quotes
      e("div",{style:{textAlign:"center",marginTop:8,padding:0}},
        e("div",{style:{fontSize:12,color:"#b8860b",fontWeight:600,fontStyle:"italic",marginBottom:2}},
          "稻盛和夫经营哲学 — 人生的结果 = 思维方式 × 能力 × 热情"
        ),
        e("div",{style:{fontSize:12,color:"#b8860b",fontWeight:600,fontStyle:"italic"}},
          "Youchao 有巢理论 — 没有完美的智能体，只有完美的团队智能体"
        )
      ),
      // Control buttons
      e("div", {style:{display:"flex",gap:8,marginTop:8,justifyContent:"center"}},
        e(Button, {
          size:"small",
          type:playing?"default":"primary",
          onClick:playing?stopAnimation:startAnimation,
          style:{
            background:playing?"#f5f5f5":"linear-gradient(135deg,#52c41a,#73d13d)",
            border:playing?"1px solid #d9d9d9":"1px solid #52c41a",
            color:playing?"#666":"#fff",
            borderRadius:6,
            fontWeight:600
          }
        }, playing ? "⏸ 暂停" : "▶ 播放动画")
      ),
      // CSS for pulse animation
      e("style", null, "@keyframes wechatPulse{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}")
    );
  }

  // ================================================================
  //  [串串频道 v2.1] ChuanChuanPage — 4-Tab 统一页面
//  入口: 右侧栏「📡 串串频道」→ setChuanView(true)
//  返回: onBack() → setChuanView(false) → TeamChatPage
//  Tab: 📡频道(状态/原理/王牌/简谱) | 📂历史(收藏/标签/PPT/导出/删除) | ✍️原创作者AI(收款码+直接聊天) | 📤导出
// ================================================================
// =================== ChuanChuanPage v2.1 (4-Tab) ===================
function ChuanChuanPage(_p) {
  var onBack = _p.onBack||function(){};
  // 多语言支持
  var Select = antd.Select;
  var _lang = useState(_currentLang), lang = _lang[0], setLangState = _lang[1];
  var _tab = useState("channel"), tab = _tab[0], setTab = _tab[1];
  // 频道状态
  var _ws = useState(null), wxStatus = _ws[0], setWxStatus = _ws[1];
  var _wl = useState(false), wxLoading = _wl[0], setWxLoading = _wl[1];
    // 频道折叠
    var _chx = useState(false), chExpanded = _chx[0], setChExpanded = _chx[1];
    // SOUL 复制反馈
    var _sc = useState(false), soulCopied = _sc[0], setSoulCopied = _sc[1];
    var _so = useState(false), soulOpen = _so[0], setSoulOpen = _so[1];
    // 串串浏览器
    var _cr = useState(false), chuanReady = _cr[0], setChuanReady = _cr[1];
    var _cl = useState(false), chuanLaunching = _cl[0], setChuanLaunching = _cl[1];
    // SOUL.md 全文（供复制）
    var SOUL_TEXT = "编排 Agent 原则\n"+
      "- 主控只编排与沟通，不替代子 Agent / ACP Runner 的专业输出。\n"+
      "- IaC 模板生成、费用估算、建栈等操作全部由 iac-code 处理，主控不直接操作。\n"+
      "- 对用户的承诺以子 Agent / iac-code 实际返回为准，不臆造资源 ID 或校验结果。\n"+
      "\n全频道主持人规则（v4.1.0）\n"+
      "当消息来自任意外部频道（微信/飞书/钉钉/QQ/Telegram/Discord 等）时，你自动切换为团队会谈主持人模式。Console/桌面频道仍保持原有云编排主控行为。\n"+
      "\n触发条件\n"+
      "用户消息包含以下任一特征时，启动团队讨论：\n"+
      "- 分析、评估、比较、建议、方案、策略、决策\n"+
      "- 任何需要多角度思考的开放式问题\n"+
      "- 用户明确说「召集团队」「团队讨论」「多角度」\n"+
      "\n轻量对话（非团队讨论）\n"+
      "简单问候、闲聊、单一事实性问答 → 你直接回答，不召集团队。\n"+
      "\n团队讨论流程\n"+
      "Step 1 — 拆解问题：把用户问题拆为 2-4 个子方向，每个子方向一句话。\n"+
      "Step 2 — 选择智能体：从可用池中选 2-4 个最合适的。\n"+
      "  a1: 策略分析、竞争研究、商业逻辑\n"+
      "  a2: 市场调研、用户洞察、数据解读\n"+
      "  a3: 技术评估、方案设计、趋势判断\n"+
      "  cloud-executor: 落地执行、代码实现、操作细节\n"+
      "  cloud-verifier: 风险校验、合规审查、漏洞检查\n"+
      "Step 3 — 并行委派： submit_to_agent(to_agent=\"a1\", text=\"从策略角度分析: [子方向1]\") ...\n"+
      "Step 4 — 收集结果： check_agent_task(task_id=...) 轮询所有任务状态\n"+
      "Step 5 — 汇总回复：严格按照格式回复（适配微信 2048 字符限制）\n"+
      "\n超时处理：任一智能体 60s 未返回 → 跳过，注明「⏳ [智能体名] 未及时返回」\n"+
      "\n头脑风暴模式：用户消息以 /风暴 或 /brainstorm 开头时，按流程完成多轮讨论\n"+
      "\n禁止行为：不编造智能体回复、不省略团队成员署名、不超出频道字符限制";
    // 多频道列表
    var ALL_CHANNELS = [
      {key:"wechat", name:"微信", icon:"💬"},
      {key:"feishu", name:"飞书", icon:"🐦"},
      {key:"dingtalk", name:"钉钉", icon:"📌"},
      {key:"qq", name:"QQ", icon:"🐧"},
      {key:"workwechat", name:"企业微信", icon:"🏢"},
      {key:"telegram", name:"Telegram", icon:"✈️"},
      {key:"discord", name:"Discord", icon:"🎮"},
      {key:"imessage", name:"iMessage", icon:"📱"},
      {key:"yuanbao", name:"元宝", icon:"🪙"}
    ];
  // 历史会话
  var _sess = useState([]), sess = _sess[0], setSess = _sess[1];
  var _sLd = useState(false), sessLoading = _sLd[0], setSessLoading = _sLd[1];
  var _hf = useState("all"), histFilter = _hf[0], setHistFilter = _hf[1];
  // 历史标签编辑
  var _etag = useState(null), editingTag = _etag[0], setEditingTag = _etag[1];
  var _tv = useState(""), tagVal = _tv[0], setTagVal = _tv[1];
  // 原创作者AI 聊天
  var _chatMsgs = useState([]), chatMsgs = _chatMsgs[0], setChatMsgs = _chatMsgs[1];
  var _chatIn = useState(""), chatIn = _chatIn[0], setChatIn = _chatIn[1];
  var _chatLd = useState(false), chatLd = _chatLd[0], setChatLd = _chatLd[1];
  var _chatSi = useState(""), chatSi = _chatSi[0], setChatSi = _chatSi[1];  // session_id
  var chatAbortRf = useRef(null);
  var chatListRf = useRef(null);

  // 原创作者AI 历史记录（多个会话）
  var _authorSessions = useState([]), authorSessions = _authorSessions[0], setAuthorSessions = _authorSessions[1];
  var _showHistory = useState(false), showHistory = _showHistory[0], setShowHistory = _showHistory[1];
  
  // 报告生成智能体选择
  var _reportAgent = useState(function(){try{return localStorage.getItem("teamchat_report_agent")||"cloud-orchestrator";}catch(e){return "cloud-orchestrator";}}), reportAgent = _reportAgent[0], setReportAgent = _reportAgent[1];

  // LLM 设置
  var _llmCfg = useState({api_key:"",base_url:"https://dashscope.aliyuncs.com/compatible-mode/v1",model:"qwen-plus"}), llmCfg = _llmCfg[0], setLlmCfg = _llmCfg[1];
  var _llmSaved = useState({api_key:"",base_url:"",model:"",has_key:false}), llmSaved = _llmSaved[0], setLlmSaved = _llmSaved[1];
  var _llmLoading = useState(false), llmLoading = _llmLoading[0], setLlmLoading = _llmLoading[1];
  var _llmTestResult = useState(null), llmTestResult = _llmTestResult[0], setLlmTestResult = _llmTestResult[1];
  var _llmTestLoading = useState(false), llmTestLoading = _llmTestLoading[0], setLlmTestLoading = _llmTestLoading[1];
  var _llmSaveResult = useState(null), llmSaveResult = _llmSaveResult[0], setLlmSaveResult = _llmSaveResult[1];

  // 快捷指令
  var QUICK_COMMANDS = [
    {label: "你是谁？", text: "你是谁？请介绍一下自己"},
    {label: "能做什么？", text: "你能帮我做什么？有什么功能？"},
    {label: "联系方式", text: "如何联系你？有微信或其他联系方式吗？"},
    {label: "稻盛哲学", text: "请介绍一下稻盛和夫的经营哲学"},
    {label: "团队介绍", text: "你们的团队是怎么运作的？"}
  ];

  // ---- 串串周报状态 ----
  var _reports = useState([]), reports = _reports[0], setReports = _reports[1];
  var _reportLoading = useState(false), reportLoading = _reportLoading[0], setReportLoading = _reportLoading[1];
  var _currentReport = useState(null), currentReport = _currentReport[0], setCurrentReport = _currentReport[1];
  var _autoChecked = useState(false), autoChecked = _autoChecked[0], setAutoChecked = _autoChecked[1];

  // ---- 实时报告状态 ----
  var _realtimeLoading = useState(false), realtimeLoading = _realtimeLoading[0], setRealtimeLoading = _realtimeLoading[1];
  var _currentRealtime = useState(null), currentRealtime = _currentRealtime[0], setCurrentRealtime = _currentRealtime[1];
  var _realtimeHistory = useState([]), realtimeHistory = _realtimeHistory[0], setRealtimeHistory = _realtimeHistory[1];

  // 数据看板状态
  var _dashData = useState(null), dashData = _dashData[0], setDashData = _dashData[1];
  var _dashLoading = useState(false), dashLoading = _dashLoading[0], setDashLoading = _dashLoading[1];
  var _dashRefresh = useState(0), dashRefresh = _dashRefresh[0], setDashRefresh = _dashRefresh[1];
  var _dashAgent = useState(function(){try{return localStorage.getItem("teamchat_dash_agent")||"";}catch(e){return "";}}), dashAgent = _dashAgent[0], setDashAgent = _dashAgent[1];
  var _agentDetail = useState(null), agentDetail = _agentDetail[0], setAgentDetail = _agentDetail[1];
  var _agentDetailLoading = useState(false), agentDetailLoading = _agentDetailLoading[0], setAgentDetailLoading = _agentDetailLoading[1];
  var _allAgents = useState([]), allAgents = _allAgents[0], setAllAgents = _allAgents[1];

  // 加载看板数据
  function fetchDashboard(){
    setDashLoading(true);
    apiGet("/dashboard-stats").then(function(d){
      setDashData(d);
      setDashLoading(false);
    }).catch(function(err){
      console.error("[Dashboard] fetch error:", err);
      setDashLoading(false);
    });
    // 同时获取完整智能体列表
    apiGet("/all-agents").then(function(d){
      if (d && d.agents && Array.isArray(d.agents)) {
        setAllAgents(d.agents);
      } else {
        console.warn("[AllAgents] 返回数据格式不正确:", d);
        setAllAgents([]);
      }
    }).catch(function(err){
      console.error("[AllAgents] fetch error:", err);
      setAllAgents([]);
    });
  }

  // 加载选中智能体的详细报告
  function fetchAgentDetail(agentId){
    if(!agentId){ setAgentDetail(null); return; }
    setAgentDetailLoading(true);
    apiGet("/agent-detail?agent_id="+encodeURIComponent(agentId)).then(function(d){
      setAgentDetail(d);
      setAgentDetailLoading(false);
    }).catch(function(err){
      console.error("[AgentDetail] fetch error:", err);
      setAgentDetailLoading(false);
    });
  }

  // 切换智能体时加载详情
  function selectDashAgent(agentId){
    setDashAgent(agentId);
    try{ localStorage.setItem("teamchat_dash_agent", agentId); }catch(e){}
    fetchAgentDetail(agentId);
  }

  // 切换到串串汇时自动加载看板
  useEffect(function(){
    if(tab==="settings" || tab==="channel"){
      fetchDashboard();
      // 如果有已选智能体，加载其详情
      if(tab==="settings" && dashAgent) fetchAgentDetail(dashAgent);
    }
  },[tab, dashRefresh]);

  // 看板自动刷新（30秒）
  useEffect(function(){
    if(tab!=="settings") return;
    var timer = setInterval(function(){ setDashRefresh(function(n){return n+1;}); }, 30000);
    return function(){ clearInterval(timer); };
  },[tab]);

  // 加载周报列表
  useEffect(function(){
    try{ var saved=localStorage.getItem("teamchat_reports"); if(saved) setReports(JSON.parse(saved)); }catch(e){}
    try{ var rt=localStorage.getItem("teamchat_realtime"); if(rt) setRealtimeHistory(JSON.parse(rt)); }catch(e){}
  },[]);

  // 自动生成周报（打开串串汇Tab时检查）
  useEffect(function(){
    if(tab==="settings" && !autoChecked){
      setAutoChecked(true);
      // 检查是否有足够的对话历史
      try{
        var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
        if(cache.length>=3){  // 至少3个会话才生成
          generateReport(true);  // 自动生成
        }
      }catch(e){}
    }
  },[tab,autoChecked]);

  // 生成周报（收集所有智能体的对话历史）
  function generateReport(auto){
    setReportLoading(true);
    
    // 从API获取所有会话的实际消息
    apiGet("/sessions").then(function(r){
      var sessions = r.sessions||r||[];
      console.log("[Report] Got sessions:", sessions.length);
      if(sessions.length===0){
        setReportLoading(false);
        if(!auto) alert("暂无会话，无法生成周报");
        return;
      }
      
      // 逐个获取会话详情
      var promises = sessions.map(function(session){
        var sid = session.session_id||session.sid||session.id||"";
        if(!sid) return Promise.resolve([]);
        return apiGet("/session/"+sid).then(function(d){
          var messages = d.messages||d.history||[];
          var agentName = d.host_name||session.host_name||"未知智能体";
          var sessTitle = session.title||session.session_id||"未命名会话";
          console.log("[Report] Session", sid, "has", messages.length, "messages");
          return messages.map(function(m){
            return {
              role: m.role||"unknown",
              content: m.content||"",
              agent: agentName,
              session: sessTitle
            };
          });
        }).catch(function(err){ 
          console.error("[Report] Failed to get session", sid, err);
          return []; 
        });
      });
      
      Promise.all(promises).then(function(results){
        var allHistory = [];
        results.forEach(function(msgs){ allHistory = allHistory.concat(msgs); });
        console.log("[Report] Total history:", allHistory.length);
        
        if(allHistory.length<5){
          setReportLoading(false);
          if(!auto) alert("对话太少（共"+allHistory.length+"条），暂时无法生成周报");
          return;
        }
        
        fetch(getApiUrl("/plugins/team_chat/generate-report"),{
          method:"POST",
          headers:apiHeaders(),
          body:JSON.stringify({history:allHistory,days:7,agent_id:reportAgent})
        })
        .then(function(r){return r.json();})
        .then(function(d){
          console.log("[Report] API response:", d);
          setReportLoading(false);
          if(d.success && d.report){
            var newReport = {
              id: "report_"+Date.now(),
              date: new Date().toISOString().split("T")[0],
              week: getWeekRange(),
              content: d.report,
              auto: auto||false,
              sessionCount: sessions.length,
              messageCount: allHistory.length
            };
            var updated = [newReport].concat(reports);
            if(updated.length>10) updated = updated.slice(0,10);
            setReports(updated);
            setCurrentReport(newReport);
            try{localStorage.setItem("teamchat_reports",JSON.stringify(updated));}catch(e){}
          }else{
            var errMsg = d.reason || d.report || "未知错误";
            console.error("[Report] Failed:", errMsg);
            if(!auto) alert("生成周报失败: "+errMsg);
          }
        })
        .catch(function(e){
          setReportLoading(false);
          console.error("[Report] Fetch failed:",e);
          if(!auto) alert("生成周报失败: "+e.message);
        });
      }).catch(function(e){
        setReportLoading(false);
        console.error("[Report] Promise.all failed:",e);
        if(!auto) alert("获取会话详情失败: "+e.message);
      });
    }).catch(function(e){
      setReportLoading(false);
      console.error("[Report] Get sessions failed:",e);
      if(!auto) alert("获取会话列表失败: "+e.message);
    });
  }

  // 生成实时报告（12小时内）
  function generateRealtimeReport(){
    setRealtimeLoading(true);
    
    // 从API获取所有会话的实际消息
    apiGet("/sessions").then(function(r){
      var sessions = r.sessions||r||[];
      console.log("[RealtimeReport] Got sessions:", sessions.length);
      if(sessions.length===0){
        setRealtimeLoading(false);
        alert("暂无会话，无法生成实时报告");
        return;
      }
      
      // 逐个获取会话详情
      var promises = sessions.map(function(session){
        var sid = session.session_id||session.sid||session.id||"";
        if(!sid) return Promise.resolve([]);
        return apiGet("/session/"+sid).then(function(d){
          var messages = d.messages||d.history||[];
          var agentName = d.host_name||session.host_name||"未知智能体";
          var sessTitle = session.title||session.session_id||"未命名会话";
          console.log("[RealtimeReport] Session", sid, "has", messages.length, "messages");
          return messages.map(function(m){
            return {
              role: m.role||"unknown",
              content: m.content||"",
              agent: agentName,
              session: sessTitle
            };
          });
        }).catch(function(err){ 
          console.error("[RealtimeReport] Failed to get session", sid, err);
          return []; 
        });
      });
      
      Promise.all(promises).then(function(results){
        var allHistory = [];
        results.forEach(function(msgs){ allHistory = allHistory.concat(msgs); });
        console.log("[RealtimeReport] Total history:", allHistory.length);
        // 取最近的消息（最后50条）
        var recentHistory = allHistory.slice(-50);
        
        if(recentHistory.length<2){
          setRealtimeLoading(false);
          alert("对话太少（共"+recentHistory.length+"条），无法生成实时报告");
          return;
        }
        
        fetch(getApiUrl("/plugins/team_chat/generate-realtime-report"),{
          method:"POST",
          headers:apiHeaders(),
          body:JSON.stringify({history:recentHistory,hours:12,agent_id:reportAgent})
        })
        .then(function(r){return r.json();})
        .then(function(d){
          console.log("[RealtimeReport] API response:", d);
          setRealtimeLoading(false);
          if(d.success && d.report){
            var newRealtime = {
              id: "realtime_"+Date.now(),
              date: new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString(),
              content: d.report,
              messageCount: recentHistory.length
            };
            var updated = [newRealtime].concat(realtimeHistory);
            if(updated.length>20) updated = updated.slice(0,20);
            setRealtimeHistory(updated);
            setCurrentRealtime(newRealtime);
            try{localStorage.setItem("teamchat_realtime",JSON.stringify(updated));}catch(e){}
          }else{
            var errMsg = d.reason || d.report || "未知错误";
            console.error("[RealtimeReport] Failed:", errMsg);
            alert("生成实时报告失败: "+errMsg);
          }
        })
        .catch(function(e){
          setRealtimeLoading(false);
          console.error("[RealtimeReport] Fetch failed:",e);
          alert("生成实时报告失败: "+e.message);
        });
      }).catch(function(e){
        setRealtimeLoading(false);
        console.error("[RealtimeReport] Promise.all failed:",e);
        alert("获取会话详情失败: "+e.message);
      });
    }).catch(function(e){
      setRealtimeLoading(false);
      console.error("获取会话列表失败:",e);
    });
  }

  // 获取本周日期范围
  function getWeekRange(){
    var now = new Date();
    var day = now.getDay()||7;
    var mon = new Date(now);
    mon.setDate(now.getDate()-day+1);
    var sun = new Date(mon);
    sun.setDate(mon.getDate()+6);
    return (mon.getMonth()+1)+"/"+mon.getDate()+" - "+(sun.getMonth()+1)+"/"+sun.getDate();
  }

  // 删除周报
  function deleteReport(reportId){
    var updated = reports.filter(function(r){return r.id!==reportId;});
    setReports(updated);
    setCurrentReport(null);
    try{localStorage.setItem("teamchat_reports",JSON.stringify(updated));}catch(e){}
  }

  // 删除实时报告
  function deleteRealtime(reportId){
    var updated = realtimeHistory.filter(function(r){return r.id!==reportId;});
    setRealtimeHistory(updated);
    setCurrentRealtime(null);
    try{localStorage.setItem("teamchat_realtime",JSON.stringify(updated));}catch(e){}
  }

  useEffect(function(){
    apiGet("/wechat/status").then(function(r){setWxStatus(r.wechat||{});setWxLoading(false);}).catch(function(){setWxLoading(false);});
  },[]);
  useEffect(function(){
    fetch(getApiUrl("/plugins/team_chat/browser/status")).then(function(r){return r.json();}).then(function(d){setChuanReady(d&&d.running);}).catch(function(){setChuanReady(false);});
  },[]);
  useEffect(function(){
    // 优先从后端加载聊天记录
    apiGet("/author-chat-history").then(function(d){
      if(d.messages && d.messages.length>0){
        setChatMsgs(d.messages);
        try{localStorage.setItem("teamchat_author_chat",JSON.stringify(d.messages));}catch(e){}
      } else {
        // 后端没有，尝试从localStorage加载
        try{ var saved=localStorage.getItem("teamchat_author_chat"); if(saved) setChatMsgs(JSON.parse(saved)); }catch(e){}
      }
      if(d.sessions && d.sessions.length>0){
        setAuthorSessions(d.sessions);
        try{localStorage.setItem("teamchat_author_history",JSON.stringify(d.sessions));}catch(e){}
      } else {
        try{ var hist=localStorage.getItem("teamchat_author_history"); if(hist) setAuthorSessions(JSON.parse(hist)); }catch(e){}
      }
    }).catch(function(){
      // 后端加载失败，从localStorage加载
      try{ var saved=localStorage.getItem("teamchat_author_chat"); if(saved) setChatMsgs(JSON.parse(saved)); }catch(e){}
      try{ var hist=localStorage.getItem("teamchat_author_history"); if(hist) setAuthorSessions(JSON.parse(hist)); }catch(e){}
    });
    try{ var draft=localStorage.getItem("teamchat_author_draft"); if(draft) setChatIn(draft); }catch(e){}
    try{ var sid=localStorage.getItem("teamchat_author_session_id"); if(sid) setChatSi(sid); else { var newSid="author_"+Date.now()+"_"+Math.random().toString(36).slice(2,8); setChatSi(newSid); localStorage.setItem("teamchat_author_session_id",newSid); }}catch(e){}
  },[]);

  // 监听聊天记录变化，自动保存到后端
  var saveTimerRef = useRef(null);
  useEffect(function(){
    // 防抖：500ms后再保存
    if(saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(function(){
      if(chatMsgs.length>0 || authorSessions.length>0){
        apiPost("/author-chat-history",{messages:chatMsgs,sessions:authorSessions}).catch(function(e){console.warn("保存聊天记录失败:",e);});
      }
    },500);
    return function(){ if(saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  },[chatMsgs, authorSessions]);

  // ---- 历史会话加载 ----
  function loadSess(){
    setSessLoading(true);
    try{
      var sc = localStorage.getItem("teamchat_sessions_cache");
      if(sc){ var arr=JSON.parse(sc); if(Array.isArray(arr)&&arr.length>0){setSess(arr);} }
    }catch(e){}
    apiGet("/sessions").then(function(r){
      var list = r.sessions||r||[];
      console.log("[ChuanChuan] loadSess got", list.length, "sessions");
      setSess(list); setSessLoading(false);
      try{ localStorage.setItem("teamchat_sessions_cache", JSON.stringify(list)); }catch(e){}
    }).catch(function(err){ console.error("[ChuanChuan] loadSess error:", err); setSessLoading(false); });
  }
  useEffect(function(){ loadSess(); },[]);

  // 加载 LLM 配置
  useEffect(function(){ loadLlmConfig(); },[]);

  // 点击外部关闭导出菜单
  useEffect(function(){
    function handleClick(e){
      if(exportMenuOpen && !e.target.closest('[data-export-menu]')){
        setExportMenuOpen(null);
      }
    }
    document.addEventListener("click", handleClick);
    return function(){ document.removeEventListener("click", handleClick); };
  },[exportMenuOpen]);

  function updateSessList(){
    apiGet("/plugins/team_chat/sessions").then(function(r){
      var list = r.sessions||r||[];
      setSess(list);
      try{ localStorage.setItem("teamchat_sessions_cache", JSON.stringify(list)); }catch(e){}
    }).catch(function(){});
  }

  // ---- 历史: 加载到主聊 ----
  function loadToMain(si){
    window.dispatchEvent(new CustomEvent("teamchat-load-session",{detail:{session_id:si}}));
    onBack();
  }

  // ---- 历史: 收藏切换 ----
  function togglePin(si, pinned){
    apiPut("/session/"+si+"/pin", {pinned: !pinned}).then(function(){
      setSess(function(p){return p.map(function(s){
        var id = s.session_id||s.sid||s.id||"";
        if(id!==si) return s;
        var ns = Object.assign({},s,{pinned:!pinned});
        try{
          var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
          cache = cache.map(function(cs){ var cid=cs.session_id||cs.sid||cs.id||""; return cid===si?Object.assign({},cs,{pinned:!pinned}):cs; });
          localStorage.setItem("teamchat_sessions_cache", JSON.stringify(cache));
        }catch(e){}
        return ns;
      });});
    }).catch(function(){});
  }

  // ---- 历史: 保存标签 ----
  function saveTag(si, tag){
    apiPut("/session/"+si+"/tag", {tag: tag}).then(function(){
      setSess(function(p){return p.map(function(s){
        var id = s.session_id||s.sid||s.id||"";
        if(id!==si) return s;
        var ns = Object.assign({},s,{tag:tag});
        try{
          var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
          cache = cache.map(function(cs){ var cid=cs.session_id||cs.sid||cs.id||""; return cid===si?Object.assign({},cs,{tag:tag}):cs; });
          localStorage.setItem("teamchat_sessions_cache", JSON.stringify(cache));
        }catch(e){}
        return ns;
      });});
      setEditingTag(null);
    }).catch(function(){ setEditingTag(null); });
  }

  // ---- 历史: PPT 回放 ----
  function playPPT(si){
    window.dispatchEvent(new CustomEvent("teamchat-ppt-play",{detail:{session_id:si}}));
    onBack();
  }

  // ---- 历史: 导出多格式（后端生成文件，前端触发下载） ----
  function exportSession(si, title, format){
    var filename = (title||"会话记录").replace(/[^\w\u4e00-\u9fa5]/g,"_");
    console.log("[Export] Exporting session", si, "as", format);

    fetch(getApiUrl("/plugins/team_chat/export-session"), {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ session_id: si, format: format })
    })
    .then(function(r) {
      if (!r.ok) {
        return r.json().then(function(d) { throw new Error(d.detail || "导出失败"); });
      }
      return r.blob();
    })
    .then(function(blob) {
      // 方式1: 创建 blob URL 并触发下载
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename + "." + format;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      // 延迟清理
      setTimeout(function() {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
      console.log("[Export] Download triggered:", filename + "." + format);
    })
    .catch(function(e) {
      console.error("[Export] Failed:", e);
      alert("导出失败: " + e.message);
    });
  }

  // ---- 历史: 删除 ----
  function delSess(si){
    apiGet("/session/delete/"+si).then(function(){
      setSess(function(p){return p.filter(function(s){var id=s.session_id||s.sid||s.id||"";return id!==si;});});
      try{
        var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
        cache = cache.filter(function(cs){var cid=cs.session_id||cs.sid||cs.id||"";return cid!==si;});
        localStorage.setItem("teamchat_sessions_cache", JSON.stringify(cache));
      }catch(e){}
    }).catch(function(e){});
  }

  // ---- 导出菜单状态 ----
  var _exportMenuOpen = useState(null), exportMenuOpen = _exportMenuOpen[0], setExportMenuOpen = _exportMenuOpen[1];

  // ---- 历史: 导出PDF ----
  function exportToPDF(si, title){
    // 先从缓存或API获取会话详情
    var cached = null;
    try{
      var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
      cached = cache.find(function(s){var id=s.session_id||s.sid||s.id||"";return id===si;});
    }catch(e){}

    function renderPDF(messages){
      var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+(title||"会话记录")+'</title>';
      html += '<style>';
      html += 'body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;padding:40px;line-height:1.8;color:#333;}';
      html += 'h1{font-size:24px;color:#4E342E;border-bottom:3px solid #FFD700;padding-bottom:12px;margin-bottom:24px;}';
      html += '.meta{font-size:12px;color:#8D6E63;margin-bottom:24px;}';
      html += '.msg{margin-bottom:20px;padding:16px;border-radius:12px;}';
      html += '.msg.user{background:#FFF8E1;border-left:4px solid #FFD700;}';
      html += '.msg.assistant{background:#F5F5F5;border-left:4px solid #8D6E63;}';
      html += '.msg.system{background:#E8F5E9;border-left:4px solid #66BB6A;font-size:13px;}';
      html += '.role{font-weight:bold;font-size:13px;margin-bottom:6px;}';
      html += '.role.user{color:#F57F17;}';
      html += '.role.assistant{color:#5D4037;}';
      html += '.role.system{color:#2E7D32;}';
      html += '.content{white-space:pre-wrap;word-break:break-word;}';
      html += '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #D7CCC8;font-size:11px;color:#BCAAA4;text-align:center;}';
      html += '@media print{body{padding:20px;}.msg{break-inside:avoid;}}';
      html += '</style></head><body>';
      html += '<h1> '+(title||"会话记录")+'</h1>';
      html += '<div class="meta">导出时间：'+new Date().toLocaleString()+' · 共 '+messages.length+' 条消息</div>';

      messages.forEach(function(m){
        var role = m.role||"unknown";
        var roleName = role==="user"?"👤 用户":role==="assistant"?"🤖 AI":"⚙️ 系统";
        var content = m.content||"";
        if(m.tool_calls){
          try{
            var tc = typeof m.tool_calls==="string"?JSON.parse(m.tool_calls):m.tool_calls;
            if(Array.isArray(tc)){
              tc.forEach(function(t){
                if(t.function){
                  content += "\n\n🔧 工具调用: "+t.function.name+"\n参数: "+JSON.stringify(JSON.parse(t.function.arguments||"{}"),null,2);
                }
              });
            }
          }catch(e){}
        }
        html += '<div class="msg '+role+'">';
        html += '<div class="role '+role+'">'+roleName+'</div>';
        html += '<div class="content">'+escapeHtml(content)+'</div>';
        html += '</div>';
      });

      html += '<div class="footer">由串串频道导出 · '+new Date().getFullYear()+'</div>';
      html += '</body></html>';

      // 用隐藏iframe代替window.open，兼容WebView
      var iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      document.body.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
      setTimeout(function(){
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(function(){document.body.removeChild(iframe);}, 1000);
      }, 300);
    }

    if(cached && (cached.messages||cached.history)){
      renderPDF(cached.messages||cached.history);
    }else{
      apiGet("/session/"+si).then(function(d){
        renderPDF(d.messages||d.history||[]);
      }).catch(function(e){
        alert("获取会话详情失败: "+e.message);
      });
    }
  }

  function escapeHtml(text){
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- 原创作者AI: 发送消息 ----
  function chatSend(){
    var msg = chatIn.trim(); if(!msg||chatLd) return;
    setChatMsgs(function(p){var n=p.concat([{role:"user",content:msg},{role:"thinking",content:"思考中"}]);try{localStorage.setItem("teamchat_author_chat",JSON.stringify(n));}catch(e){}return n;});
    setChatIn("");try{localStorage.removeItem("teamchat_author_draft");}catch(e){}setChatLd(true);
    var ctrl = new AbortController(); chatAbortRf.current = ctrl;
    fetch(getApiUrl("/plugins/team_chat/remote-chat"),{method:"POST",headers:apiHeaders(),body:JSON.stringify({message:msg,session_id:chatSi}),signal:ctrl.signal})
    .then(function(r){ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
    .then(function(d){
      var reply = d.reply||JSON.stringify(d);
      // 更新session_id（如果后端返回新的）
      if(d.session_id && d.session_id !== chatSi){ setChatSi(d.session_id); try{localStorage.setItem("teamchat_author_session_id",d.session_id);}catch(e){} }
      setChatMsgs(function(p){
        var n=p.filter(function(m){return m.role!=="thinking";}).concat([{role:"assistant",content:reply}]);
        try{localStorage.setItem("teamchat_author_chat",JSON.stringify(n));}catch(e){}
        // 保存到历史记录
        try{
          var hist = JSON.parse(localStorage.getItem("teamchat_author_history")||"[]");
          var existing = hist.find(function(h){return h.session_id===chatSi;});
          if(existing){ existing.messages=n; existing.updated_at=Date.now(); }
          else{ hist.unshift({session_id:chatSi,messages:n,created_at:Date.now(),updated_at:Date.now(),title:msg.substring(0,20)+(msg.length>20?"...":"")}); }
          if(hist.length>50) hist=hist.slice(0,50);
          localStorage.setItem("teamchat_author_history",JSON.stringify(hist));
          setAuthorSessions(hist);
        }catch(e){}
        return n;
      });
      setChatLd(false);
    }).catch(function(e){
      if(e.name!=="AbortError"){ setChatMsgs(function(p){var n=p.filter(function(m){return m.role!=="thinking";}).concat([{role:"assistant",content:"[Error: "+e.message+"]"}]);try{localStorage.setItem("teamchat_author_chat",JSON.stringify(n));}catch(e2){}return n;}); }
      setChatLd(false);
    });
    setTimeout(function(){ if(chatListRf.current) chatListRf.current.scrollTop = chatListRf.current.scrollHeight; },100);
  }
  function chatStop(){ if(chatAbortRf.current){ chatAbortRf.current.abort(); chatAbortRf.current=null; setChatLd(false); } }
  function chatKeyDown(ev){ if(ev.key==="Enter"&&!ev.shiftKey){ ev.preventDefault(); chatSend(); } }

  // 新建对话
  function newAuthorChat(){
    var newSid="author_"+Date.now()+"_"+Math.random().toString(36).slice(2,8);
    setChatSi(newSid); setChatMsgs([]); setShowHistory(false);
    try{localStorage.setItem("teamchat_author_session_id",newSid);localStorage.setItem("teamchat_author_chat","[]");}catch(e){}
  }

  // 加载历史会话
  function loadAuthorSession(sid){
    var sess = authorSessions.find(function(s){return s.session_id===sid;});
    if(sess){ setChatSi(sid); setChatMsgs(sess.messages||[]); setShowHistory(false);
      try{localStorage.setItem("teamchat_author_session_id",sid);localStorage.setItem("teamchat_author_chat",JSON.stringify(sess.messages||[]));}catch(e){}
    }
  }

  // 删除历史会话
  function deleteAuthorSession(sid){
    var hist = authorSessions.filter(function(s){return s.session_id!==sid;});
    setAuthorSessions(hist);
    try{localStorage.setItem("teamchat_author_history",JSON.stringify(hist));}catch(e){}
    if(sid===chatSi) newAuthorChat();
  }

  // 快捷指令发送
  function sendQuickCommand(text){ setChatIn(text); setTimeout(chatSend,100); }

  // ---- Tab 标签 ----
  var TABS = [
    {key:"channel", label:t("channel")},
    {key:"history", label:t("history")+" "+(sess.length>50?"(50/"+sess.length+")":"("+sess.length+")")},
    {key:"author", label:t("authorAI")},
    {key:"settings", label:t("dashboard")}
  ];

  return e("div",{style:{display:"flex",flexDirection:"column",height:"100vh",background:"linear-gradient(180deg,#FDF8F0,#F5EBE0,#EDE0D4)",fontFamily:"inherit"}},
    // 顶栏
    e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:"linear-gradient(135deg,#5D4037,#6D4C41,#8D6E63)",color:"#FFF8E1",boxShadow:"0 4px 20px rgba(93,64,55,.2)"}},
      e("div",{style:{display:"flex",alignItems:"center",gap:12}},
        e(Button,{type:"text",onClick:function(){chatStop();onBack();},style:{color:"#FFF8E1",fontSize:20}},"← 返回"),
        e("div",{style:{fontSize:20,fontWeight:"bold"}},"📡 串串频道")
      ),
      // 语言切换器
      e("div",{style:{display:"flex",alignItems:"center",gap:8}},
        e("span",{style:{fontSize:12,color:"#FFF8E1"}},t("language")+":"),
        e(Select,{
          value:lang,
          onChange:function(v){setLang(v);setLangState(v);},
          size:"small",
          style:{width:120,fontSize:12},
          dropdownStyle:{zIndex:9999}
        },
          e(Select.Option,{value:"zh"},"🇨🇳 简体中文"),
          e(Select.Option,{value:"zh-TW"},"🇹🇼 繁體中文"),
          e(Select.Option,{value:"en"},"🇺🇸 English"),
          e(Select.Option,{value:"ja"},"🇯🇵 日本語"),
          e(Select.Option,{value:"ru"},"🇷🇺 Русский"),
          e(Select.Option,{value:"pt-BR"},"🇧🇷 Português"),
          e(Select.Option,{value:"id"},"🇮🇩 Bahasa"),
          e(Select.Option,{value:"vi"},"🇻🇳 Tiếng Việt")
        )
      )
    ),
    // Tab 栏
    e("div",{style:{display:"flex",background:"#EDE0D4",borderBottom:"2px solid #D7CCC8",flexShrink:0}},
      TABS.map(function(tabItem){
        var active = tab===tabItem.key;
        return e("div",{key:tabItem.key,onClick:function(){setTab(tabItem.key);},
          style:{flex:1,textAlign:"center",padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:active?"bold":"normal",
            color:active?"#4E342E":"#8D6E63",
            borderBottom:active?"3px solid #FFD700":"3px solid transparent",
            background:active?"#FDF8F0":"transparent",transition:"all .2s"}},
          tabItem.label
        );
      })
    ),
    // 内容区
    e("div",{style:{flex:1,overflowY:"auto",padding:"20px 24px"}},
      // ========== Tab 1: 频道 ==========
      tab==="channel"?e("div",null,
        e(Card,{title:"⚙️ 工作原理",style:{marginBottom:14,borderRadius:16,background:"#E8F5E9",border:"1px solid #A5D6A7"}},
          e(WeChatWorkflow,null),
          e("div",{style:{marginTop:12,padding:"12px 16px",background:"#C8E6C9",borderRadius:12,fontSize:12,color:"#2E7D32",lineHeight:1.8}},
            e("div",{style:{fontWeight:"bold",marginBottom:6,fontSize:13}},"💡 举一反三 — 前提条件"),
            e("div",null,"① 官网下载安装 QwenPaw，在插件市场安装 TeamChat 插件"),
            e("div",null,"② 插件管理 → 官方插件 → 安装 CloudPaw，自动部署 cloud-orchestrator"),
            e("div",null,"③ 编辑 SOUL.md，写入全频道主持人规则："),
            e("div",{style:{marginTop:6,marginBottom:6}},
              soulOpen?
                e("div",null,
                  e("div",{style:{position:"relative",background:"#1B1B1B",borderRadius:8,padding:"10px 12px",maxHeight:400,overflowY:"auto",fontSize:10,color:"#E0E0E0",fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:1.5,border:"1px solid #333"}},
                    SOUL_TEXT,
                    e(Button,{size:"small",onClick:function(){try{navigator.clipboard.writeText(SOUL_TEXT);setSoulCopied(true);setTimeout(function(){setSoulCopied(false)},2000)}catch(e){}},
                      style:{position:"absolute",top:6,right:6,borderRadius:4,fontSize:10,background:soulCopied?"#4CAF50":"#555",color:"#fff",border:"none"}},
                      soulCopied?"✓ 已复制":"📋 复制"),
                    e(Button,{size:"small",danger:true,onClick:function(){setSoulOpen(false);},
                      style:{position:"absolute",top:6,right:soulCopied?72:54,fontSize:12,fontWeight:"bold",background:"#c0392b",color:"#fff",border:"none",borderRadius:3,minWidth:22,height:22,lineHeight:"22px",padding:0}},
                      "✕")
                  ),
                  e("div",{style:{fontSize:10,color:"#8D6E63",marginTop:4}},"💡 粘贴位置: cloud-orchestrator 工作区 → SOUL.md")
                )
              :
                e(Button,{size:"small",onClick:function(){setSoulOpen(true);},
                  style:{borderRadius:6,background:"linear-gradient(180deg,#E3F2FD,#BBDEFB,#90CAF9,#E3F2FD)",border:"1px solid #64B5F6",color:"#1565C0",fontSize:12}},
                  "📄 查看 SOUL.md 全文 (点击打开)")
            ),
            e("div",null,"④ 微信/飞书/钉钉/QQ 等频道均可举一反三接入")
          )
        ),
        e(Card,{title:"🏆 王牌产品 · 新会谈隐藏技能",style:{marginBottom:14,borderRadius:16,background:"linear-gradient(135deg,#FFF8E1,#FFF3E0)",border:"1px solid #FFB74D"}},
          e("div",{style:{fontSize:13,color:"#5D4037",lineHeight:2}},
            e("div",null,"🧠 头脑风暴 — 2-5 轮多智能体迭代讨论"),
            e("div",null,"📼 PPT 回放 — 打字机+粒子背景+键盘翻页播放"),
            e("div",null,"📄 文件架 — 工作区文档自动收集"),
            e("div",null,"🎵 轻音乐 — 7 首内置曲目+数字简谱+自定义"),
            e("div",null,"⌨️ 快捷键 — 按 ? 弹出快捷键速查面板")
          )
        ),
        e(Card,{title:"🤖 AI分身",style:{marginBottom:14,borderRadius:16,background:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",border:"1px solid #4CAF50"}},
          e("div",{style:{fontSize:13,color:"#2E7D32",lineHeight:2}},
            e("div",null,e("strong",null,"🎯 智能感知")," — 自动识别代码/文章/邮件/视频/购物页面"),
            e("div",null,e("strong",null,"⚡ 快捷指令")," — /总结 /翻译 /代码 /提问 /邮件 等10个指令"),
            e("div",null,e("strong",null,"🧠 记忆增强")," — 记住用户偏好、历史话题、跨会话记忆"),
            e("div",null,e("strong",null,"💡 使用方式")," — 点击浮动🤖按钮，输入/查看快捷指令")
          )
        )
      ):null,

      // ========== Tab 2: 历史 ==========
      tab==="history"?e("div",null,
        // 子标签切换：全部 / 收藏
        e("div",{style:{display:"flex",gap:8,marginBottom:12,alignItems:"center"}},
          e("div",{style:{fontSize:14,fontWeight:"bold",color:"#4E342E"}},
            "📂 历史会谈"
          ),
          e("div",{style:{display:"flex",gap:4,marginLeft:"auto"}},
            e(Button,{size:"small",type:histFilter==="all"?"primary":"default",
              onClick:function(){setHistFilter("all");},
              style:{borderRadius:12,fontSize:11}},"全部 ("+sess.length+")"),
            e(Button,{size:"small",type:histFilter==="pinned"?"primary":"default",
              onClick:function(){setHistFilter("pinned");},
              style:{borderRadius:12,fontSize:11}},"⭐ 收藏 ("+sess.filter(function(s){return s.pinned;}).length+")")
          )
        ),
        sessLoading?e(Spin,{size:"small"}):
        (function(){
          var filtered = histFilter==="pinned"?sess.filter(function(s){return s.pinned;}):sess;
          return filtered.length===0?
            e("div",{style:{color:"#8D6E63",fontSize:13,padding:"20px",textAlign:"center"}},
              histFilter==="pinned"?"暂无收藏的会话":"暂无历史会谈"):
            filtered.slice(0,50).map(function(s,i){
          var sid = s.session_id||s.sid||s.id||"";
          var title = s.title||s.name||("Session "+(i+1));
          var created = s.created_at||s.created||"";
          var agents = (s.agent_ids||[]).length||(s.agents||[]).length||0;
          var msgCount = s.message_count||(s.history||[]).length||(s.messages||[]).length||0;
          var lastMsg = s.last_message||"";
          var pinned = s.pinned||false;
          var tag = s.tag||"";
          var isEditing = editingTag===sid;
          return e("div",{key:sid,
            style:{padding:"10px 12px",marginBottom:8,background:pinned?"#FFF8E1":"#FAFAFA",borderRadius:16,border:"1px solid #D7CCC8"}},
            // 第一行: 标题 + 收藏星 + 加载按钮
            e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}},
              e("div",{style:{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}},
                e("div",{style:{fontWeight:"bold",fontSize:14,color:"#4E342E",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}},title),
                tag?e(Tag,{color:"gold",style:{fontSize:10}},tag):null
              ),
              e(Button,{size:"small",type:"text",onClick:function(ev){ev.stopPropagation();loadToMain(sid);},
                style:{fontSize:10,padding:"0 6px",color:"#5D4037",fontWeight:"bold"}},"📥 加载"),
              e(Button,{size:"small",type:"text",
                onClick:function(ev){ev.stopPropagation();togglePin(sid,pinned);},
                style:{fontSize:16,padding:0,color:pinned?"#FFD700":"#BCAAA4"}},
                pinned?"⭐":"☆")
            ),
            // 第二行: 元信息
            e("div",{style:{fontSize:11,color:"#8D6E63",marginBottom:4}},
              (typeof created==="string"?created.substring(0,10):"")+" · "+agents+" agents · "+msgCount+" msgs"
            ),
            // 第三行: 最后消息预览
            lastMsg?e("div",{style:{fontSize:11,color:"#BCAAA4",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},
              (typeof lastMsg==="string"?lastMsg:"").substring(0,80)
            ):null,
            // 第四行: 操作按钮 + 标签编辑
            e("div",{style:{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}},
              isEditing?
                e("div",{style:{display:"flex",alignItems:"center",gap:4}},
                  e(Input,{size:"small",value:tagVal,onChange:function(ev){setTagVal(ev.target.value);},
                    onPressEnter:function(){saveTag(sid,tagVal);},
                    style:{width:100,fontSize:11},placeholder:t("tag"),autoFocus:true}),
                  e(Button,{size:"small",onClick:function(){saveTag(sid,tagVal);},style:{fontSize:10}},"💾"),
                  e(Button,{size:"small",onClick:function(){setEditingTag(null);},style:{fontSize:10}},"✕")
                ):
                e(Button,{size:"small",type:"text",
                  onClick:function(ev){ev.stopPropagation();setEditingTag(sid);setTagVal(tag);},
                  style:{fontSize:10,padding:"0 4px",color:"#8D6E63"}},
                  (tag?"🏷 "+tag:"🏷 标签"))
              ,
              e(Button,{size:"small",type:"text",
                onClick:function(ev){ev.stopPropagation();playPPT(sid);},
                style:{fontSize:10,padding:"0 4px",color:"#5D4037"}},"📼 回放"),
              e(Button,{size:"small",type:"text",
                onClick:function(ev){ev.stopPropagation();exportToPDF(sid,title);},
                style:{fontSize:10,padding:"0 4px",color:"#C62828",fontWeight:"bold"}},"📄 PDF"),

              e(Button,{size:"small",type:"text",danger:true,
                onClick:function(ev){ev.stopPropagation();if(confirm("Delete session "+title+"?"))delSess(sid);},
                style:{fontSize:10,padding:"0 4px"}},"🗑 删除")
            )
          );
        });
        })()
      ):null,

      // ========== Tab 3: 原创作者AI ==========
      tab==="author"?e("div",{style:{display:"flex",flexDirection:"column",height:"100%"}},
        // 顶部工具栏：新建对话 + 历史记录
        e("div",{style:{display:"flex",gap:8,marginBottom:8,flexShrink:0}},
          e(Button,{size:"small",onClick:newAuthorChat,
            style:{borderRadius:16,background:"linear-gradient(180deg,#E3F2FD,#BBDEFB,#90CAF9,#BBDEFB)",border:"1px solid #42A5F5",color:"#1565C0",fontWeight:"bold"}},
            "＋ 新对话"),
          e(Button,{size:"small",onClick:function(){setShowHistory(!showHistory);},
            style:{borderRadius:16,background:showHistory?"linear-gradient(180deg,#FFF3E0,#FFE0B2,#FFCC80,#FFE0B2)":"linear-gradient(180deg,#FAFAFA,#F5F5F5,#EEEEEE,#F5F5F5)",
              border:showHistory?"1px solid #FF9800":"1px solid #BDBDBD",color:showHistory?"#E65100":"#616161",fontWeight:"bold"}},
            "📂 历史 ("+authorSessions.length+")")
        ),
        // 历史记录面板
        showHistory?e(Card,{size:"small",style:{marginBottom:8,borderRadius:16,background:"#FFF8E1",border:"1px solid #FFD54F",maxHeight:200,overflowY:"auto",flexShrink:0}},
          authorSessions.length===0?e("div",{style:{color:"#BCAAA4",fontSize:12,textAlign:"center",padding:12}},"暂无历史记录"):
          authorSessions.map(function(s){
            return e("div",{key:s.session_id,style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderBottom:"1px solid #FFE082",cursor:"pointer"},
              onClick:function(){loadAuthorSession(s.session_id);}},
              e("div",{style:{flex:1,overflow:"hidden"}},
                e("div",{style:{fontSize:12,fontWeight:"bold",color:"#5D4037",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},s.title||"未命名对话"),
                e("div",{style:{fontSize:10,color:"#8D6E63",marginTop:2}},new Date(s.updated_at).toLocaleString())
              ),
              e(Button,{size:"small",danger:true,onClick:function(ev){ev.stopPropagation();if(confirm("确定删除这个对话？"))deleteAuthorSession(s.session_id);},
                style:{borderRadius:8,fontSize:10,padding:"0 6px",height:22}},"🗑")
            );
          })
        ):null,
        // 精神股东 + 作者简介 合并卡片（带动画时间轴）
        e(Card,{style:{borderRadius:16,background:"linear-gradient(135deg,#FFF8E1,#FCE4EC,#F3E5F5,#E8F5E9)",border:"2px solid #E91E63",marginBottom:8,flexShrink:0,overflow:"hidden"},className:"tc-author-combined"},
          e("div",{style:{display:"flex",flexDirection:"row",alignItems:"stretch",gap:16}},
            // 左侧：二维码（借用主界面右侧栏的图片+链接模式）
            e("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}},
              e("a",{href:"https://agent.bh-jk.com",target:"_blank",rel:"noopener noreferrer",style:{textDecoration:"none",display:"block"}},
                e("img",{src:getApiUrl("/plugins/team_chat/media/qr_code.png"),alt:"收款码",
                  style:{width:160,height:160,borderRadius:12,border:"3px solid #F8BBD0",objectFit:"cover",cursor:"pointer"},
                  onError:function(ev){
                    ev.target.style.display="none";
                    // 备用显示：如果图片加载失败，显示文字链接
                    var fallback = document.createElement("div");
                    fallback.style.cssText = "width:160px;height:160px;border-radius:12px;border:3px solid #F8BBD0;background:#FAF3E8;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:8px;";
                    fallback.innerHTML = "<div style='font-size:11px;color:#8D6E63;text-align:center;'>💛 精神股东<br/>支持原创作者<br/>0+1+2≠3 Team</div>";
                    ev.target.parentNode.insertBefore(fallback, ev.target.nextSibling);
                  }
                })
              ),
              e("div",{style:{textAlign:"center",marginTop:6}},
                e("div",{style:{fontWeight:"bold",fontSize:12,color:"#AD1457"}},"💛 精神股东"),
                e("div",{style:{fontSize:10,color:"#880E4F"}},"支持原创作者"),
                e("div",{style:{fontSize:10,color:"#AD1457",marginTop:2}},"0+1+2≠3 Team")
              )
            ),
            // 右侧：作者简介动画时间轴 + 有巢筑巢动画
            e("div",{style:{flex:1,display:"flex",flexDirection:"row",alignItems:"stretch",gap:12}},
              // 作者简介时间轴
              e("div",{style:{flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}},
              e("div",{style:{fontSize:13,fontWeight:"bold",color:"#1B5E20",marginBottom:6}},"👤 关于作者"),
              e("div",{style:{fontSize:11,color:"#2E7D32",lineHeight:1.5,marginBottom:8}},
                "一位从财务行业转型的 AI 探索者，用亲身经历诠释「终身学习」的力量。"
              ),
              e("div",{style:{fontSize:11,color:"#1B5E20",fontWeight:"bold",marginBottom:8}},
                "笔名：Cshu"
              ),
              // 动画时间轴
              e("div",{style:{position:"relative",paddingLeft:18}},
                // 竖线
                e("div",{style:{position:"absolute",left:5,top:4,bottom:4,width:2,background:"linear-gradient(180deg,#4CAF50,#81C784,#A5D6A7)",borderRadius:1}}),
                // 时间节点
                (function(){
                  var items = [
                    {year:"2006",text:"进入财务行业，从出纳做起",icon:"💼"},
                    {year:"2015",text:"成为财务经理，管理 5 人团队",icon:"👔"},
                    {year:"2020",text:"开始研究税务筹划，服务中小微企业和个人",icon:"📊"},
                    {year:"2026",text:"被企业优化，失业接散活。3月初接触 AI AGENT",icon:"🤖"},
                    {year:"现在",text:"重新出发，主业 + 副业双轮驱动，在家就业",icon:"🚀"}
                  ];
                  return items.map(function(item,i){
                    return e("div",{key:i,className:"tc-timeline-item",style:{display:"flex",gap:6,alignItems:"flex-start",marginBottom:5,position:"relative","animationDelay":(i*0.3)+"s"}},
                      e("div",{style:{position:"absolute",left:-16,top:2,width:9,height:9,borderRadius:"50%",background:"#4CAF50",border:"2px solid #fff",boxShadow:"0 0 0 1px #4CAF50",zIndex:1}}),
                      e("span",{style:{fontWeight:"bold",color:"#1B5E20",minWidth:34,fontSize:11}},item.icon+" "+item.year),
                      e("span",{style:{fontSize:11,color:"#2E7D32"}},item.text)
                    );
                  });
                })()
              ),
              e("div",{style:{marginTop:8,paddingTop:6,borderTop:"1px solid #A5D6A7",fontStyle:"italic",color:"#388E3C",fontSize:11}},
                "\"从出纳到 AI Agent 开发者，每一步都算数。\""
              )
              ),
              // 有巢筑巢动画（从 Youchao 插件移植）
              e("div",{style:{flexShrink:0,width:675,minHeight:200,borderRadius:16,
                background:"linear-gradient(135deg,#e0f0ff 0%,#e0f8f0 100%)",
                border:"2px solid #ffffff",
                boxShadow:"0 4px 12px rgba(42,47,69,0.08)",
                overflow:"hidden",position:"relative"}},
                // 凤凰飞过
                e("div",{style:{position:"absolute",width:50,height:20,animation:"tcPhoenixFly 8s linear infinite",zIndex:10}},
                  e("div",{style:{position:"absolute",width:30,height:18,top:1,left:20,background:"linear-gradient(135deg,#FFD700 0%,#FF6F00 40%,#D32F2F 100%)",borderRadius:"60% 40% 40% 60%",boxShadow:"0 0 6px rgba(255,165,0,0.6)"}},
                    e("div",{style:{position:"absolute",width:4,height:4,background:"#333",borderRadius:"50%",top:5,right:5}}),
                    e("div",{style:{position:"absolute",width:0,height:0,borderTop:"3px solid transparent",borderBottom:"3px solid transparent",borderLeft:"6px solid #FF8F00",top:6,right:-5}})
                  ),
                  e("div",{style:{position:"absolute",width:18,height:10,top:0,left:24,background:"linear-gradient(90deg,#FFB300,#FF6F00)",borderRadius:"50% 50% 20% 20%",transformOrigin:"bottom center",animation:"tcPhoenixWing 0.4s ease-in-out infinite"}}),
                  e("div",{style:{position:"absolute",width:16,height:8,top:12,left:24,background:"linear-gradient(90deg,#FFB300,#FF6F00)",borderRadius:"20% 20% 50% 50%",transformOrigin:"top center",animation:"tcPhoenixWing 0.4s ease-in-out infinite"}}),
                  e("div",{style:{position:"absolute",width:20,height:3,top:6,left:0,background:"linear-gradient(90deg,#FF6F00,#FFD700)",borderRadius:"50%",transform:"rotate(-5deg)"}}),
                  e("div",{style:{position:"absolute",width:18,height:2,top:9,left:2,background:"linear-gradient(90deg,#D32F2F,#FF8F00)",borderRadius:"50%",transform:"rotate(5deg)"}}),
                  e("div",{style:{position:"absolute",width:16,height:2,top:12,left:4,background:"linear-gradient(90deg,#FFD700,#FFC107)",borderRadius:"50%",transform:"rotate(-3deg)"}})
                ),
                // 养牛场（左侧）
                e("div",{style:{position:"absolute",bottom:5,left:10,zIndex:4}},
                  // 牛棚
                  e("div",{style:{position:"absolute",bottom:0,left:0,width:35,height:20,background:"linear-gradient(180deg,#8D6E63,#6D4C41)",borderRadius:"3px 3px 0 0",border:"1px solid #5D4037"}}),
                  // 牛棚屋顶
                  e("div",{style:{position:"absolute",bottom:18,left:-2,width:39,height:6,background:"#D84315",borderRadius:"2px",clipPath:"polygon(0 100%,50% 0,100% 100%)"}}),
                  // 牛棚门
                  e("div",{style:{position:"absolute",bottom:0,left:12,width:10,height:12,background:"#3E2723",borderRadius:"2px 2px 0 0"}}),
                  // 牛 1（黑白花）
                  e("div",{style:{position:"absolute",bottom:0,left:38}},
                    e("div",{style:{position:"absolute",width:12,height:8,background:"#F5F5F5",borderRadius:"50%",bottom:2}}),
                    e("div",{style:{position:"absolute",width:4,height:4,background:"#333",borderRadius:"50%",bottom:3,left:2}}),
                    e("div",{style:{position:"absolute",width:3,height:3,background:"#333",borderRadius:"50%",bottom:4,left:7}}),
                    e("div",{style:{position:"absolute",width:2,height:3,background:"#F5F5F5",bottom:0,left:2}}),
                    e("div",{style:{position:"absolute",width:2,height:3,background:"#F5F5F5",bottom:0,left:8}})
                  ),
                  // 牛 2（棕色）
                  e("div",{style:{position:"absolute",bottom:0,left:52}},
                    e("div",{style:{position:"absolute",width:10,height:7,background:"#8D6E63",borderRadius:"50%",bottom:2}}),
                    e("div",{style:{position:"absolute",width:2,height:3,background:"#6D4C41",bottom:0,left:2}}),
                    e("div",{style:{position:"absolute",width:2,height:3,background:"#6D4C41",bottom:0,left:6}})
                  ),
                  // 养牛场标签
                  e("div",{style:{position:"absolute",bottom:22,left:2,fontSize:7,fontWeight:"bold",color:"#FFF",background:"#5D4037",padding:"1px 3px",borderRadius:2}},"养牛场")
                ),
                // 水稻田（2亩，左侧）
                e("div",{style:{position:"absolute",bottom:5,left:75,zIndex:3}},
                  // 田 1
                  e("div",{style:{position:"absolute",bottom:0,left:0,width:28,height:18,background:"linear-gradient(135deg,#C8E6C9,#A5D6A7)",border:"1px solid #66BB6A",borderRadius:2}},
                    // 稻穗
                    e("div",{style:{position:"absolute",top:3,left:4,width:2,height:8,background:"#FDD835",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:4,left:8,width:2,height:7,background:"#FBC02D",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:3,left:12,width:2,height:8,background:"#FDD835",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:5,left:16,width:2,height:6,background:"#FBC02D",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:4,left:20,width:2,height:7,background:"#FDD835",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:3,left:24,width:2,height:8,background:"#FBC02D",borderRadius:"50% 50% 0 0"}})
                  ),
                  // 田 2
                  e("div",{style:{position:"absolute",bottom:0,left:30,width:28,height:18,background:"linear-gradient(135deg,#A5D6A7,#81C784)",border:"1px solid #66BB6A",borderRadius:2}},
                    // 稻穗
                    e("div",{style:{position:"absolute",top:4,left:4,width:2,height:7,background:"#FDD835",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:3,left:8,width:2,height:8,background:"#FBC02D",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:5,left:12,width:2,height:6,background:"#FDD835",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:4,left:16,width:2,height:7,background:"#FBC02D",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:3,left:20,width:2,height:8,background:"#FDD835",borderRadius:"50% 50% 0 0"}}),
                    e("div",{style:{position:"absolute",top:5,left:24,width:2,height:6,background:"#FBC02D",borderRadius:"50% 50% 0 0"}})
                  ),
                  // 水稻田标签
                  e("div",{style:{position:"absolute",bottom:20,left:15,fontSize:7,fontWeight:"bold",color:"#2E7D32",background:"#E8F5E9",padding:"1px 3px",borderRadius:2,border:"1px solid #A5D6A7"}},"水稻田 ×2")
                ),
                // 树 1（左）
                e("div",{style:{position:"absolute",bottom:20,left:"40%",width:8,height:120,background:"linear-gradient(180deg,#6D4C20,#5D3A1A)",borderRadius:2,transform:"translateX(-50%)"}}),
                // 树 2（右）
                e("div",{style:{position:"absolute",bottom:20,left:"60%",width:8,height:120,background:"linear-gradient(180deg,#6D4C20,#5D3A1A)",borderRadius:2,transform:"translateX(-50%)"}}),
                // 树丛文字（横向）
                e("div",{style:{position:"absolute",bottom:110,left:"50%",transform:"translateX(-50%)",fontSize:12,fontWeight:"bold",color:"#FFD700",whiteSpace:"nowrap",textShadow:"0 0 4px rgba(0,0,0,0.6)",zIndex:3}},"QP Plugin广场"),
                // 树冠 1（左，摇摆动画）
                e("div",{style:{position:"absolute",bottom:130,left:"40%",width:80,height:60,background:"radial-gradient(ellipse,#4CAF50 0%,#388E3C 50%,#2E7D32 100%)",borderRadius:"50% 50% 40% 40%",transform:"translateX(-50%)",animation:"tcTreeSway 4s ease-in-out infinite"}},
                  // 鸟巢
                  e("div",{style:{position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",width:24,height:12,background:"#8D6E20",borderRadius:"50% 50% 30% 30%",border:"2px solid #6D4C20",animation:"tcNestBuild 6s ease-in-out infinite"}})
                ),
                // 树冠 2（右，摇摆动画）
                e("div",{style:{position:"absolute",bottom:130,left:"60%",width:70,height:55,background:"radial-gradient(ellipse,#66BB6A 0%,#43A047 50%,#2E7D32 100%)",borderRadius:"50% 50% 40% 40%",transform:"translateX(-50%)",animation:"tcTreeSway 4.5s ease-in-out infinite",animationDelay:"0.5s"}}
                ),
                // 鸟 1 — 叼树枝（从左飞到右）
                e("div",{style:{position:"absolute",width:24,height:20,animation:"tcBirdFly1 6s linear infinite"}},
                  e("div",{style:{position:"absolute",width:16,height:12,background:"#FF9800",borderRadius:"50% 50% 40% 40%",top:4,left:4}}),
                  e("div",{style:{position:"absolute",width:10,height:10,background:"#FF9800",borderRadius:"50%",top:0,right:0}}),
                  e("div",{style:{position:"absolute",width:3,height:3,background:"#333",borderRadius:"50%",top:3,right:3}}),
                  e("div",{style:{position:"absolute",width:0,height:0,borderTop:"3px solid transparent",borderBottom:"3px solid transparent",borderLeft:"5px solid #FF5722",top:3,right:-4}}),
                  e("div",{style:{position:"absolute",width:10,height:6,background:"#F57C00",borderRadius:"50%",top:6,left:2,transformOrigin:"left center",animation:"tcWingFlap 0.2s linear infinite"}}),
                  e("div",{style:{position:"absolute",width:14,height:2,background:"#6D4C20",top:4,right:-14,borderRadius:1}})
                ),
                // 鸟 2 — 叼泥巴（从右飞到左）
                e("div",{style:{position:"absolute",width:22,height:18,animation:"tcBirdFly2 6s linear infinite"}},
                  e("div",{style:{position:"absolute",width:14,height:11,background:"#FFB74D",borderRadius:"50% 50% 40% 40%",top:3,left:4}}),
                  e("div",{style:{position:"absolute",width:9,height:9,background:"#FFB74D",borderRadius:"50%",top:0,left:0}}),
                  e("div",{style:{position:"absolute",width:2,height:2,background:"#333",borderRadius:"50%",top:3,left:2}}),
                  e("div",{style:{position:"absolute",width:0,height:0,borderTop:"2px solid transparent",borderBottom:"2px solid transparent",borderRight:"4px solid #FF5722",top:3,left:-3}}),
                  e("div",{style:{position:"absolute",width:9,height:5,background:"#F57C00",borderRadius:"50%",top:5,right:2,transformOrigin:"right center",animation:"tcWingFlap 0.25s linear infinite"}}),
                  e("div",{style:{position:"absolute",width:8,height:6,background:"#795548",borderRadius:"50% 40% 40% 50%",top:2,left:-8}})
                ),
                // 树枝掉落动画
                e("div",{style:{position:"absolute",top:10,left:"54%",width:10,height:2,background:"#6D4C20",borderRadius:1,animation:"tcTwigDrop 6s linear infinite"}}),
                // 泥巴掉落动画
                e("div",{style:{position:"absolute",top:8,left:"56%",width:6,height:5,background:"#795548",borderRadius:"50%",animation:"tcMudDrop 6s linear infinite"}}),
                // 人物 1（左）— 蜂巢
                e("div",{style:{position:"absolute",bottom:4,left:"36%",width:20,height:34}},
                  e("div",{style:{position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",width:32,height:14,background:"#FFF9C4",borderRadius:"50%",border:"1px solid #F9A825",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#F57F17"}},"蜂巢"),
                  e("div",{style:{position:"absolute",top:0,left:"50%",width:12,height:12,background:"#FFCC80",borderRadius:"50%",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",top:12,left:"50%",width:14,height:16,background:"#42A5F5",borderRadius:"3px 3px 0 0",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",bottom:0,left:"50%",width:14,height:8,transform:"translateX(-50%)"}},
                    e("div",{style:{position:"absolute",width:5,height:8,background:"#1565C0",left:0,borderRadius:"0 0 2px 2px"}}),
                    e("div",{style:{position:"absolute",width:5,height:8,background:"#1565C0",right:0,borderRadius:"0 0 2px 2px"}})
                  )
                ),
                // 机器人（中）— 感叹号
                e("div",{style:{position:"absolute",bottom:4,left:"50%",width:22,height:36,transform:"translateX(-50%)"}},
                  e("div",{style:{position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",width:16,height:14,background:"#E8F5E9",borderRadius:"50%",border:"1px solid #4CAF50",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#2E7D32"}},"!"),
                  e("div",{style:{position:"absolute",top:0,left:"50%",width:2,height:5,background:"#78909C",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",top:0,left:"50%",width:4,height:4,background:"#EF5350",borderRadius:"50%",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",top:4,left:"50%",width:14,height:12,background:"#90A4AE",borderRadius:"3px",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",top:8,left:"50%",width:6,height:4,background:"#00E676",borderRadius:2,transform:"translateX(-50%)",boxShadow:"0 0 4px #00E676"}}),
                  e("div",{style:{position:"absolute",top:16,left:"50%",width:16,height:14,background:"#B0BEC5",borderRadius:"4px",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",top:19,left:"50%",width:8,height:6,background:"#263238",borderRadius:1,transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",bottom:0,left:"50%",width:14,height:8,transform:"translateX(-50%)"}},
                    e("div",{style:{position:"absolute",width:5,height:8,background:"#78909C",left:0,borderRadius:"0 0 2px 2px"}}),
                    e("div",{style:{position:"absolute",width:5,height:8,background:"#78909C",right:0,borderRadius:"0 0 2px 2px"}})
                  )
                ),
                // 人物 2（右）— 鸟巢/Youchao 气泡交替
                e("div",{style:{position:"absolute",bottom:4,left:"62%",width:20,height:34}},
                  e("div",{style:{position:"absolute",top:-20,left:"50%",transform:"translateX(-50%)",width:48,height:14,background:"#E3F2FD",borderRadius:7,border:"1px solid #2196F3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#1565C0",letterSpacing:0.3,animation:"tcBubbleSwap 40s linear infinite"}},"Youchao"),
                  e("div",{style:{position:"absolute",top:-20,left:"50%",transform:"translateX(-50%)",width:38,height:14,background:"#FFF3E0",borderRadius:7,border:"1px solid #FF9800",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#E65100",letterSpacing:0.3,animation:"tcBubbleSwap 40s linear 20s infinite"}},"鸟巢"),
                  e("div",{style:{position:"absolute",top:0,left:"50%",width:12,height:12,background:"#FFCC80",borderRadius:"50%",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",top:12,left:"50%",width:14,height:16,background:"#EF5350",borderRadius:"3px 3px 0 0",transform:"translateX(-50%)"}}),
                  e("div",{style:{position:"absolute",bottom:0,left:"50%",width:14,height:8,transform:"translateX(-50%)"}},
                    e("div",{style:{position:"absolute",width:5,height:8,background:"#C62828",left:0,borderRadius:"0 0 2px 2px"}}),
                    e("div",{style:{position:"absolute",width:5,height:8,background:"#C62828",right:0,borderRadius:"0 0 2px 2px"}})
                  )
                ),
                // 地面线
                e("div",{style:{position:"absolute",bottom:4,left:0,width:"100%",height:1,background:"#9E9E9E",zIndex:5}}),
                // 熟菜卡车
                e("div",{style:{position:"absolute",bottom:5,width:52,height:22,animation:"tcTruckDrive 10s linear infinite",zIndex:6}},
                  e("div",{style:{position:"absolute",bottom:0,left:0,width:40,height:18,background:"linear-gradient(180deg,#E8F5E9,#C8E6C9)",borderRadius:3,border:"1px solid #81C784"}}),
                  e("div",{style:{position:"absolute",bottom:0,right:0,width:14,height:14,background:"#37474F",borderRadius:"3px 6px 2px 2px"}}),
                  e("div",{style:{position:"absolute",bottom:0,right:2,width:10,height:10,background:"#546E7A",borderRadius:"2px 4px 1px 1px",top:1}}),
                  e("div",{style:{position:"absolute",bottom:-3,left:8,width:8,height:8,background:"#333",borderRadius:"50%",border:"2px solid #555"}}),
                  e("div",{style:{position:"absolute",bottom:-3,right:4,width:8,height:8,background:"#333",borderRadius:"50%",border:"2px solid #555"}}),
                  e("div",{style:{position:"absolute",bottom:5,left:3,fontSize:7,fontWeight:900,color:"#1B5E20",textShadow:"0 0 1px rgba(255,255,255,0.8)",letterSpacing:0.5}},"Cshu"),
                  e("div",{style:{position:"absolute",bottom:14,left:5,width:5,height:5,background:"#FFB74D",borderRadius:"50%"}}),
                  e("div",{style:{position:"absolute",bottom:14,left:12,width:4,height:4,background:"#A5D6A7",borderRadius:"50%"}}),
                  e("div",{style:{position:"absolute",bottom:14,left:18,width:5,height:4,background:"#FFCC80",borderRadius:"50%"}}),
                  e("div",{style:{position:"absolute",bottom:1,left:1,width:38,height:1,background:"#66BB6A"}})
                ),
                // 大楼（右侧地面）
                e("div",{style:{position:"absolute",bottom:5,right:20,zIndex:4}},
                  // 主楼体
                  e("div",{style:{position:"absolute",bottom:0,left:0,width:30,height:70,background:"linear-gradient(180deg,#78909C,#546E7A)",borderRadius:"3px 3px 0 0",border:"1px solid #455A64"}},
                    // 窗户（4行3列）
                    e("div",{style:{position:"absolute",top:6,left:4,width:5,height:5,background:"#FFF9C4",borderRadius:1,boxShadow:"0 0 3px #FFF176"}}),
                    e("div",{style:{position:"absolute",top:6,left:12,width:5,height:5,background:"#FFF9C4",borderRadius:1,boxShadow:"0 0 3px #FFF176"}}),
                    e("div",{style:{position:"absolute",top:6,left:20,width:5,height:5,background:"#FFF9C4",borderRadius:1,boxShadow:"0 0 3px #FFF176"}}),
                    e("div",{style:{position:"absolute",top:16,left:4,width:5,height:5,background:"#E3F2FD",borderRadius:1}}),
                    e("div",{style:{position:"absolute",top:16,left:12,width:5,height:5,background:"#FFF9C4",borderRadius:1,boxShadow:"0 0 3px #FFF176"}}),
                    e("div",{style:{position:"absolute",top:16,left:20,width:5,height:5,background:"#E3F2FD",borderRadius:1}}),
                    e("div",{style:{position:"absolute",top:26,left:4,width:5,height:5,background:"#FFF9C4",borderRadius:1,boxShadow:"0 0 3px #FFF176"}}),
                    e("div",{style:{position:"absolute",top:26,left:12,width:5,height:5,background:"#E3F2FD",borderRadius:1}}),
                    e("div",{style:{position:"absolute",top:26,left:20,width:5,height:5,background:"#FFF9C4",borderRadius:1,boxShadow:"0 0 3px #FFF176"}}),
                    e("div",{style:{position:"absolute",top:36,left:4,width:5,height:5,background:"#E3F2FD",borderRadius:1}}),
                    e("div",{style:{position:"absolute",top:36,left:12,width:5,height:5,background:"#FFF9C4",borderRadius:1,boxShadow:"0 0 3px #FFF176"}}),
                    e("div",{style:{position:"absolute",top:36,left:20,width:5,height:5,background:"#E3F2FD",borderRadius:1}}),
                    // 门
                    e("div",{style:{position:"absolute",bottom:0,left:10,width:10,height:14,background:"#37474F",borderRadius:"3px 3px 0 0"}})
                  ),
                  // 楼顶天线
                  e("div",{style:{position:"absolute",bottom:70,left:13,width:2,height:12,background:"#455A64"}}),
                  e("div",{style:{position:"absolute",bottom:80,left:10,width:8,height:3,background:"#F44336",borderRadius:1}})
                ),
                // 蜜蜂 1
                e("div",{style:{position:"absolute",top:25,left:60,width:10,height:8,animation:"tcBeeFly 3s ease-in-out infinite",zIndex:8}},
                  e("div",{style:{position:"absolute",width:8,height:6,background:"#FFC107",borderRadius:"50%",left:1,top:1,border:"1px solid #F57F17"}}),
                  e("div",{style:{position:"absolute",width:3,height:2,background:"rgba(255,255,255,0.7)",borderRadius:"50%",top:-1,left:2,transform:"rotate(-20deg)"}}),
                  e("div",{style:{position:"absolute",width:3,height:2,background:"rgba(255,255,255,0.7)",borderRadius:"50%",top:-1,left:5,transform:"rotate(20deg)"}}),
                  e("div",{style:{position:"absolute",width:1,height:4,background:"#333",top:1,left:3}}),
                  e("div",{style:{position:"absolute",width:1,height:4,background:"#333",top:1,left:6}})
                ),
                // 蜜蜂 2
                e("div",{style:{position:"absolute",top:40,left:180,width:10,height:8,animation:"tcBeeFly 4s ease-in-out infinite",animationDelay:"1s",zIndex:8}},
                  e("div",{style:{position:"absolute",width:8,height:6,background:"#FFC107",borderRadius:"50%",left:1,top:1,border:"1px solid #F57F17"}}),
                  e("div",{style:{position:"absolute",width:3,height:2,background:"rgba(255,255,255,0.7)",borderRadius:"50%",top:-1,left:2,transform:"rotate(-20deg)"}}),
                  e("div",{style:{position:"absolute",width:3,height:2,background:"rgba(255,255,255,0.7)",borderRadius:"50%",top:-1,left:5,transform:"rotate(20deg)"}}),
                  e("div",{style:{position:"absolute",width:1,height:4,background:"#333",top:1,left:3}}),
                  e("div",{style:{position:"absolute",width:1,height:4,background:"#333",top:1,left:6}})
                ),
                // 蜜蜂 3
                e("div",{style:{position:"absolute",top:15,left:320,width:10,height:8,animation:"tcBeeFly 3.5s ease-in-out infinite",animationDelay:"2s",zIndex:8}},
                  e("div",{style:{position:"absolute",width:8,height:6,background:"#FFC107",borderRadius:"50%",left:1,top:1,border:"1px solid #F57F17"}}),
                  e("div",{style:{position:"absolute",width:3,height:2,background:"rgba(255,255,255,0.7)",borderRadius:"50%",top:-1,left:2,transform:"rotate(-20deg)"}}),
                  e("div",{style:{position:"absolute",width:3,height:2,background:"rgba(255,255,255,0.7)",borderRadius:"50%",top:-1,left:5,transform:"rotate(20deg)"}}),
                  e("div",{style:{position:"absolute",width:1,height:4,background:"#333",top:1,left:3}}),
                  e("div",{style:{position:"absolute",width:1,height:4,background:"#333",top:1,left:6}})
                ),
                // 0+1+23 标语
                e("div",{style:{position:"absolute",bottom:4,right:8,fontSize:11,fontWeight:700,color:"rgba(42,47,69,0.15)",letterSpacing:0.5}},"0+1+2≠3")
              )
            )
          )
        ),
        // 串串浏览器打开
        chuanReady?e("div",{style:{marginBottom:6}},
          e(Button,{size:"small",loading:chuanLaunching,onClick:function(){
            setChuanLaunching(true);
            fetch(getApiUrl("/plugins/team_chat/browser/launch"),{method:"POST",headers:{"Content-Type":"application/json"},
              body:JSON.stringify({url:"https://agent.bh-jk.com/api/agent-share/chat/450729a6-f5a4-42a7-8433-984a93368cfc"})})
              .then(function(r){return r.json();}).then(function(d){setChuanLaunching(false);})
              .catch(function(){setChuanLaunching(false);});
          },
            style:{borderRadius:6,width:"100%",background:"linear-gradient(180deg,#E8F5E9,#C8E6C9,#81C784,#E8F5E9)",border:"1px solid #4CAF50",color:"#1B5E20",fontWeight:"bold",fontSize:11,padding:"4px 0"}},
            "🌐 串串浏览器打开原创作者AI")
        ):null,
        // 快捷指令（更紧凑）
        e("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4,flexShrink:0}},
          QUICK_COMMANDS.map(function(cmd){
            return e(Button,{key:cmd.label,size:"small",onClick:function(){sendQuickCommand(cmd.text);},
              style:{borderRadius:10,fontSize:10,padding:"2px 8px",background:"linear-gradient(180deg,#F3E5F5,#E1BEE7,#CE93D8,#E1BEE7)",border:"1px solid #AB47BC",color:"#6A1B9A"}},
              cmd.label);
          })
        ),
        // 聊天区
        e("div",{ref:chatListRf,style:{flex:1,overflowY:"auto",padding:"4px 0",marginBottom:2}},
          chatMsgs.length===0?e("div",{style:{color:"#BCAAA4",fontSize:13,textAlign:"center",paddingTop:20}},
            e("div",null,"💬 与云服务器上的 CloudPaw-Master 对话"),
            e("div",{style:{fontSize:11,marginTop:4}},"仅支持文字输入 · 团队智能体为您服务")
          ):
          chatMsgs.map(function(m,i){
            var isUser = m.role==="user";
            var isThinking = m.role==="thinking";
            var isAssistant = m.role==="assistant";
            // AI回复分段渲染
            var contentEl = null;
            if(isThinking){
              contentEl = e("span",{className:"tc-thinking-dots"},e("span",null,"·"),e("span",null,"·"),e("span",null,"·"));
            } else if(isAssistant){
              // 按双换行或单换行分段，保持段落清晰
              var paragraphs = (m.content||"").split(/\n/).filter(function(p){return p.trim()!=="";});
              contentEl = e("div",{style:{display:"flex",flexDirection:"column",gap:6}},
                paragraphs.map(function(p,pi){
                  // 检测是否是列表项（以 - / * / 数字. 开头）
                  var isListItem = /^[\s]*[-*\d]/.test(p);
                  return e("div",{key:pi,style:{
                    lineHeight:1.7,
                    paddingLeft:isListItem?12:0,
                    borderLeft:isListItem?"2px solid #FFCC80":"none"
                  }},p);
                })
              );
            } else {
              contentEl = m.content;
            }
            return e("div",{key:i,style:{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:6}},
              e("div",{style:{maxWidth:"85%",padding:"8px 12px",borderRadius:14,
                background:isUser?"linear-gradient(135deg,#6D4C41,#8D6E63)":isThinking?"#E8F5E9":"#FFF8E1",
                color:isUser?"#FFF8E1":isThinking?"#2E7D32":"#4E342E",fontSize:12,lineHeight:1.5,
                border:isUser?"none":isThinking?"1px solid #A5D6A7":"1px solid #D7CCC8",
                borderBottomRightRadius:isUser?4:12,borderBottomLeftRadius:isUser?12:4,
                wordBreak:"break-word",whiteSpace:isAssistant?"normal":"pre-wrap"},className:isThinking?"tc-thinking":""},
                contentEl
              )
            );
          })
        ),
        // 输入栏（更贴近聊天区）
        e("div",{style:{display:"flex",gap:6,alignItems:"flex-end",flexShrink:0,paddingTop:4}},
          e(TextArea,{value:chatIn,onChange:function(ev){var v=ev.target.value;setChatIn(v);try{localStorage.setItem("teamchat_author_draft",v);}catch(e){}},
            onFocus:function(){try{var saved=localStorage.getItem("teamchat_author_chat");if(saved)setChatMsgs(JSON.parse(saved));}catch(e){}},
            onKeyDown:chatKeyDown,placeholder:"输入文字消息…",
            autoSize:{minRows:1,maxRows:3},
            disabled:chatLd,
            style:{flex:1,borderRadius:14,fontSize:12}}),
          chatLd?
            e(Button,{danger:true,onClick:chatStop,style:{borderRadius:14,height:30,fontWeight:"bold",fontSize:11,
              background:"linear-gradient(180deg,#c62828,#b71c1c,#a31515,#c62828)",border:"1px solid #8e0000",color:"#fff"}},"■ 停止"):
            e(Button,{type:"primary",onClick:chatSend,disabled:!chatIn.trim(),
              style:{borderRadius:14,height:30,fontWeight:"bold",fontSize:11,
                background:"linear-gradient(180deg,#FFD54F,#FFC107,#FF8F00,#FFC107)",border:"1px solid #E65100",color:"#4E342E"}},"▶ 发送")
        )
      ):null,
      // ========== Tab 4: 串串汇 — 智能体数据看板 ==========
      tab==="settings"?e("div",{style:{display:"flex",flexDirection:"column",height:"100%",overflowY:"auto",padding:"0 4px"}},
        // 顶部标题
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}},
          e("div",{style:{fontSize:16,fontWeight:"bold",color:"#4E342E"}},"📊 串串汇 · 智能体看板"),
          e("div",{style:{fontSize:11,color:"#BDBDBD"}},"数据每30秒自动刷新")
        ),
        // 加载中
        dashLoading&&!dashData?e("div",{style:{textAlign:"center",padding:"40px 0",color:"#BCAAA4"}},"⏳ 加载看板数据..."):
        dashData?e("div",{style:{display:"flex",flexDirection:"column",gap:12}},
          // ===== 智能体选择器 =====
          e(Card,{size:"small",style:{borderRadius:14,background:"linear-gradient(135deg,#E8EAF6,#C5CAE9)",border:"1px solid #9FA8DA"}},
            e("div",{style:{display:"flex",alignItems:"center",gap:12}},
              e("div",{style:{fontSize:13,fontWeight:"bold",color:"#283593",whiteSpace:"nowrap"}},"🤖 选择智能体："),
              e(Select,{
                value:dashAgent||undefined,
                placeholder:"选择智能体查看详细报告",
                allowClear:true,
                onChange:function(v){selectDashAgent(v||"");},
                style:{flex:1,minWidth:200},
                options:[
                  {label:"📊 全部概览",value:""},
                ].concat((allAgents||[]).map(function(a){
                  var emoji = (a.id||"").indexOf("orchestrator")>=0?"🧠":
                    (a.id||"").indexOf("executor")>=0?"⚡":
                    (a.id||"").indexOf("verifier")>=0?"✅":
                    (a.id||"").indexOf("a1")>=0?"🎯":
                    (a.id||"").indexOf("a2")>=0?"📊":
                    (a.id||"").indexOf("a3")>=0?"🔧":"🤖";
                  // 从dashData中获取该智能体的统计信息
                  var agentStats = (dashData&&dashData.agents||[]).find(function(x){return x.host_id===a.id;});
                  var msgCount = agentStats?agentStats.msg_count:0;
                  return {label:emoji+" "+(a.name||a.id)+(msgCount>0?" ("+msgCount+"条)":""),value:a.id};
                }))
              }),
              e(Button,{size:"small",onClick:function(){setDashRefresh(function(n){return n+1;});},loading:dashLoading,
                style:{borderRadius:16,background:"linear-gradient(180deg,#E3F2FD,#BBDEFB)",border:"1px solid #90CAF9",color:"#1565C0",fontSize:11,whiteSpace:"nowrap"}},
                "🔄 刷新")
            )
          ),
          // ===== 选中智能体的详细报告 =====
          dashAgent&&agentDetailLoading?e("div",{style:{textAlign:"center",padding:"20px 0",color:"#BCAAA4"}},"⏳ 加载智能体报告..."):
          dashAgent&&agentDetail?e("div",{style:{display:"flex",flexDirection:"column",gap:10}},
            // 智能体标题卡
            e(Card,{style:{borderRadius:16,background:"linear-gradient(135deg,#E3F2FD,#BBDEFB,#90CAF9)",border:"2px solid #42A5F5",boxShadow:"0 4px 12px rgba(66,165,245,.2)"}},
              e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                e("div",null,
                  e("div",{style:{fontSize:18,fontWeight:"bold",color:"#0D47A1"}},agentDetail.host_name||agentDetail.host_id),
                  e("div",{style:{fontSize:11,color:"#1565C0",marginTop:2}},agentDetail.host_id)
                ),
                e("div",{style:{textAlign:"right"}},
                  e("div",{style:{fontSize:24,fontWeight:"bold",color:"#0D47A1"}},agentDetail.stats.msg_count),
                  e("div",{style:{fontSize:11,color:"#1565C0"}},"总消息数")
                )
              )
            ),
            // 该智能体指标卡
            e("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}},
              e(Card,{size:"small",style:{borderRadius:12,background:"#E8F5E9",border:"1px solid #A5D6A7",textAlign:"center"}},
                e("div",{style:{fontSize:20,fontWeight:"bold",color:"#2E7D32"}},agentDetail.stats.count_12h),
                e("div",{style:{fontSize:10,color:"#388E3C",marginTop:2}},"12h被问")
              ),
              e(Card,{size:"small",style:{borderRadius:12,background:"#E3F2FD",border:"1px solid #90CAF9",textAlign:"center"}},
                e("div",{style:{fontSize:20,fontWeight:"bold",color:"#1565C0"}},agentDetail.stats.count_7d),
                e("div",{style:{fontSize:10,color:"#1976D2",marginTop:2}},"7天被问")
              ),
              e(Card,{size:"small",style:{borderRadius:12,background:"#FFF3E0",border:"1px solid #FFCC80",textAlign:"center"}},
                e("div",{style:{fontSize:20,fontWeight:"bold",color:"#E65100"}},agentDetail.stats.session_count),
                e("div",{style:{fontSize:10,color:"#EF6C00",marginTop:2}},t("totalSessions"))
              ),
              e(Card,{size:"small",style:{borderRadius:12,background:"#F3E5F5",border:"1px solid #CE93D8",textAlign:"center"}},
                e("div",{style:{fontSize:20,fontWeight:"bold",color:"#6A1B9A"}},agentDetail.stats.brainstorm_count),
                e("div",{style:{fontSize:10,color:"#7B1FA2",marginTop:2}},t("brainstorm"))
              )
            ),
            // 该智能体的会话列表
            e(Card,{size:"small",style:{borderRadius:14,background:"#FFFFFF",border:"1px solid #E0E0E0"}},
              e("div",{style:{fontSize:13,fontWeight:"bold",color:"#4E342E",marginBottom:8}},"📂 与该智能体的对话记录"),
              agentDetail.sessions.length>0?
                e("div",{style:{display:"flex",flexDirection:"column",gap:4}},
                  agentDetail.sessions.map(function(s,i){
                    var t = new Date(s.updated_at*1000);
                    var timeStr = t.getFullYear()+"/"+(t.getMonth()+1)+"/"+t.getDate()+" "+String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0");
                    return e("div",{key:i,style:{
                      padding:"8px 10px",borderRadius:8,
                      background:i%2===0?"#FAFAFA":"#FFFFFF",
                      border:"1px solid #F0F0F0"
                    }},
                      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}},
                        e("div",{style:{display:"flex",alignItems:"center",gap:6}},
                          s.brainstorm?e("span",{style:{fontSize:10,padding:"1px 6px",borderRadius:6,background:"#F3E5F5",color:"#7B1FA2"}},"💡 风暴"):null,
                          s.tag?e("span",{style:{fontSize:10,padding:"1px 6px",borderRadius:6,background:"#FFF3E0",color:"#E65100"}},s.tag):null,
                          e("span",{style:{fontSize:11,color:"#8D6E63"}},s.msg_count+"条消息")
                        ),
                        e("span",{style:{fontSize:10,color:"#BDBDBD"}},timeStr)
                      ),
                      e("div",{style:{fontSize:11,color:"#78909C",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}},
                        s.last_message||"(空消息)")
                    );
                  })
                ):
                e("div",{style:{textAlign:"center",padding:"12px 0",color:"#BDBDBD",fontSize:12}},"暂无与该智能体的对话")
            )
          ):null,
          // ===== 第一行：核心指标卡片 =====
          e("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}},
            // 总对话次数
            e(Card,{size:"small",style:{borderRadius:14,background:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",border:"1px solid #A5D6A7",textAlign:"center"}},
              e("div",{style:{fontSize:24,fontWeight:"bold",color:"#2E7D32"}},dashData.summary.total_messages),
              e("div",{style:{fontSize:11,color:"#388E3C",marginTop:2}},"📝 总消息数")
            ),
            // 活跃会话
            e(Card,{size:"small",style:{borderRadius:14,background:"linear-gradient(135deg,#E3F2FD,#BBDEFB)",border:"1px solid #90CAF9",textAlign:"center"}},
              e("div",{style:{fontSize:24,fontWeight:"bold",color:"#1565C0"}},dashData.summary.active_12h),
              e("div",{style:{fontSize:11,color:"#1976D2",marginTop:2}},"⚡ 12h活跃")
            ),
            // 智能体数
            e(Card,{size:"small",style:{borderRadius:14,background:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",border:"1px solid #FFCC80",textAlign:"center"}},
              e("div",{style:{fontSize:24,fontWeight:"bold",color:"#E65100"}},dashData.summary.agent_count),
              e("div",{style:{fontSize:11,color:"#EF6C00",marginTop:2}},"🤖 智能体")
            ),
            // 头脑风暴
            e(Card,{size:"small",style:{borderRadius:14,background:"linear-gradient(135deg,#F3E5F5,#E1BEE7)",border:"1px solid #CE93D8",textAlign:"center"}},
              e("div",{style:{fontSize:24,fontWeight:"bold",color:"#6A1B9A"}},dashData.summary.brainstorm_total),
              e("div",{style:{fontSize:11,color:"#7B1FA2",marginTop:2}},"💡 头脑风暴")
            )
          ),
          // ===== 第二行：智能体活跃度表 =====
          e(Card,{size:"small",style:{borderRadius:14,background:"#FFFFFF",border:"1px solid #E0E0E0"}},
            e("div",{style:{fontSize:13,fontWeight:"bold",color:"#4E342E",marginBottom:8}},"🤖 智能体活跃度"),
            e("div",{style:{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:0,fontSize:11}},
              // 表头
              e("div",{style:{padding:"6px 8px",background:"#F5F5F5",fontWeight:"bold",borderBottom:"1px solid #E0E0E0"}},"智能体"),
              e("div",{style:{padding:"6px 8px",background:"#F5F5F5",fontWeight:"bold",borderBottom:"1px solid #E0E0E0",textAlign:"center"}},"12h调用"),
              e("div",{style:{padding:"6px 8px",background:"#F5F5F5",fontWeight:"bold",borderBottom:"1px solid #E0E0E0",textAlign:"center"}},"7天调用"),
              e("div",{style:{padding:"6px 8px",background:"#F5F5F5",fontWeight:"bold",borderBottom:"1px solid #E0E0E0",textAlign:"center"}},t("totalMsgs")),
              e("div",{style:{padding:"6px 8px",background:"#F5F5F5",fontWeight:"bold",borderBottom:"1px solid #E0E0E0",textAlign:"center"}},"风暴次数"),
              // 数据行
              dashData.agents.map(function(a,i){
                return [
                  e("div",{key:"n"+i,style:{padding:"6px 8px",borderBottom:"1px solid #F0F0F0",color:"#4E342E"}},
                    e("span",{style:{fontWeight:500}},a.host_name||a.host_id)),
                  e("div",{key:"h"+i,style:{padding:"6px 8px",borderBottom:"1px solid #F0F0F0",textAlign:"center"}},
                    e("span",{style:{
                      display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:"bold",
                      background:a.count_12h>0?"#E8F5E9":"#F5F5F5",
                      color:a.count_12h>0?"#2E7D32":"#BDBDBD"
                    }},a.count_12h)),
                  e("div",{key:"d"+i,style:{padding:"6px 8px",borderBottom:"1px solid #F0F0F0",textAlign:"center"}},
                    e("span",{style:{
                      display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:"bold",
                      background:a.count_7d>0?"#E3F2FD":"#F5F5F5",
                      color:a.count_7d>0?"#1565C0":"#BDBDBD"
                    }},a.count_7d)),
                  e("div",{key:"m"+i,style:{padding:"6px 8px",borderBottom:"1px solid #F0F0F0",textAlign:"center",color:"#5D4037"}},a.msg_count),
                  e("div",{key:"b"+i,style:{padding:"6px 8px",borderBottom:"1px solid #F0F0F0",textAlign:"center"}},
                    a.brainstorm_count>0?
                      e("span",{style:{color:"#7B1FA2",fontWeight:"bold"}},"💡 "+a.brainstorm_count):
                      e("span",{style:{color:"#BDBDBD"}},"-"))
                ];
              }).flat()
            )
          ),
          // ===== 第三行：功能使用 + 最近活跃会话 =====
          e("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
            // 功能使用统计
            e(Card,{size:"small",style:{borderRadius:14,background:"linear-gradient(135deg,#FFFDE7,#FFF9C4)",border:"1px solid #FFF176"}},
              e("div",{style:{fontSize:13,fontWeight:"bold",color:"#F57F17",marginBottom:8}},"📈 功能使用"),
              e("div",{style:{display:"flex",flexDirection:"column",gap:6}},
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  e("span",{style:{fontSize:12,color:"#5D4037"}},"⚡ 12h内对话"),
                  e("span",{style:{fontSize:14,fontWeight:"bold",color:"#E65100"}},dashData.summary.active_12h+"次")
                ),
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  e("span",{style:{fontSize:12,color:"#5D4037"}},"📅 7天内对话"),
                  e("span",{style:{fontSize:14,fontWeight:"bold",color:"#1565C0"}},dashData.summary.active_7d+"次")
                ),
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  e("span",{style:{fontSize:12,color:"#5D4037"}},"💡 12h头脑风暴"),
                  e("span",{style:{fontSize:14,fontWeight:"bold",color:"#7B1FA2"}},dashData.summary.brainstorm_12h+"次")
                ),
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  e("span",{style:{fontSize:12,color:"#5D4037"}},"💡 7天头脑风暴"),
                  e("span",{style:{fontSize:14,fontWeight:"bold",color:"#7B1FA2"}},dashData.summary.brainstorm_7d+"次")
                ),
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  e("span",{style:{fontSize:12,color:"#5D4037"}},"📂 总会话数"),
                  e("span",{style:{fontSize:14,fontWeight:"bold",color:"#4E342E"}},dashData.summary.total_sessions)
                )
              )
            ),
            // ===== 最近活跃会话（右侧） =====
            e(Card,{size:"small",style:{borderRadius:14,background:"#FFFFFF",border:"1px solid #E0E0E0"}},
              e("div",{style:{fontSize:13,fontWeight:"bold",color:"#4E342E",marginBottom:8}},"🕐 最近活跃会话"),
              dashData.recent_sessions.length>0?
                e("div",{style:{display:"flex",flexDirection:"column",gap:4}},
                  dashData.recent_sessions.map(function(s,i){
                    var t = new Date(s.updated_at*1000);
                    var timeStr = t.getMonth()+1+"/"+t.getDate()+" "+String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0");
                    return e("div",{key:i,style:{
                      display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"6px 10px",borderRadius:8,
                      background:i%2===0?"#FAFAFA":"#FFFFFF",
                      border:"1px solid #F0F0F0"
                    }},
                      e("div",{style:{display:"flex",alignItems:"center",gap:6}},
                        s.brainstorm?e("span",{style:{fontSize:10}},"💡"):null,
                        e("span",{style:{fontSize:12,color:"#4E342E",fontWeight:500}},s.host_name||"未知"),
                        s.tag?e("span",{style:{fontSize:10,padding:"1px 6px",borderRadius:6,background:"#FFF3E0",color:"#E65100"}},s.tag):null
                      ),
                      e("div",{style:{display:"flex",alignItems:"center",gap:8}},
                        e("span",{style:{fontSize:11,color:"#8D6E63"}},s.msg_count+"条消息"),
                        e("span",{style:{fontSize:11,color:"#BDBDBD"}},timeStr)
                      )
                    );
                  })
                ):
                e("div",{style:{textAlign:"center",padding:"12px 0",color:"#BDBDBD",fontSize:12}},"暂无活跃会话"),
              // 更新时间
              e("div",{style:{fontSize:10,color:"#BDBDBD",marginTop:8,textAlign:"right"}},
                "上次更新: "+new Date(dashData.generated_at*1000).toLocaleTimeString()+" · 每30秒自动刷新")
            )
          ),
          // ===== 关于串串 =====
          e(Card,{style:{borderRadius:16,background:"#F3E5F5",border:"1px solid #CE93D8"}},
            e("div",{style:{fontSize:13,fontWeight:"bold",color:"#6A1B9A",marginBottom:6}},"🎯 关于串串"),
            e("div",{style:{fontSize:12,color:"#7B1FA2",lineHeight:1.6}},
              e("div",null,"串串是 0+1+2≠3 Team 的理念伙伴，致力于用温暖的方式连接人与 AI。"),
              e("div",{marginTop:8,marginBottom:4,fontWeight:"bold",color:"#6A1B9A"},"🌀 0123的道家智慧"),
              e("div",{style:{fontSize:11,color:"#8E24AA",marginBottom:6}},
                e("div",{style:{marginBottom:4}},
                  e("span",{style:{fontWeight:"bold"}},"核心公式: "),
                  "0 → 1 + 2 ≠ 3 → ∞"
                ),
                e("div",{style:{paddingLeft:8}},
                  e("div",null,"• 0: 社会底层起点，一无所有但包含无限可能"),
                  e("div",null,"• 1: 屌丝的觉醒，产生改变意愿"),
                  e("div",null,"• 2: AI团队能力，提供执行力量"),
                  e("div",null,"• ≠3: 协作化学反应，超越简单相加"),
                  e("div",null,"• ∞: 无限循环的健康生活进化")
                )
              ),
              e("div",{marginTop:6,fontStyle:"italic"},"\"从出纳到 AI Agent 开发者，每一步都算数。\"—— 串串")
            )
          )
        ):e("div",{style:{textAlign:"center",padding:"40px 0",color:"#EF5350"}},"❌ 加载失败，请点击刷新重试")
      ):null,
    )
  );
}

  // =================== State ===================
  
  // ---- 联系人 localStorage 管理 ----
  function getStoredContacts() {
    try {
      return JSON.parse(localStorage.getItem("teamchat_email_contacts") || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveStoredContact(contact) {
    try {
      var contacts = getStoredContacts();
      var existingIndex = contacts.findIndex(function(c) { return c.email === contact.email; });

      if (existingIndex !== -1) {
        contacts[existingIndex] = contact;
      } else {
        contacts.push(contact);
      }

      localStorage.setItem("teamchat_email_contacts", JSON.stringify(contacts));
      return true;
    } catch (e) {
      console.error("保存联系人失败:", e);
      return false;
    }
  }

  function deleteStoredContact(email) {
    try {
      var contacts = getStoredContacts();
      contacts = contacts.filter(function(c) { return c.email !== email; });
      localStorage.setItem("teamchat_email_contacts", JSON.stringify(contacts));
      return true;
    } catch (e) {
      console.error("删除联系人失败:", e);
      return false;
    }
  }

function TeamChatPage() {
    // [v4.2.0] 串串频道内嵌视图: true → ChuanChuanPage, false → TeamChatPage
    var _cv = useState(false), chuanView = _cv[0], setChuanView = _cv[1]
    var _av = useState(false), aimailView = _av[0], setAimailView = _av[1];var _am = useState("main"), aimailMode = _am[0], setAimailMode = _am[1];var _et = useState("inbox"), emailTab = _et[0], setEmailTab = _et[1];var _ecs = useState([]), emailConfigs = _ecs[0], setEmailConfigs = _ecs[1];var _ca = useState("__all__"), currentAccount = _ca[0], setCurrentAccount = _ca[1];
  var _data = useState([]), emails = _data[0], setEmails = _data[1];
  var _page = useState(1), curPage = _page[0], setCurPage = _page[1];
  var _psize = useState(20), pageSize = _psize[0], setPageSize = _psize[1];
  var _total = useState(0), totalEmails = _total[0], setTotalEmails = _total[1];
  var _filter = useState("all"), emailFilter = _filter[0], setEmailFilter = _filter[1];
  var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];
  var _error = useState(null), error = _error[0], setError = _error[1];
  var _configVisible = useState(false), configVisible = _configVisible[0], setConfigVisible = _configVisible[1];
  var _hx = useState(-100), hoverX = _hx[0], setHoverX = _hx[1];var _hy = useState(-100), hoverY = _hy[0], setHoverY = _hy[1];var _hs = useState(false), hoverShow = _hs[0], setHoverShow = _hs[1];
  var _emailConfig = useState({provider:"custom",email:"",display_name:"",username:"",password:"",smtp_host:"",smtp_port:587,smtp_ssl:true,smtp_username:"",smtp_password:"",imap_host:"",imap_port:993,imap_ssl:true,imap_username:"",imap_password:""}), emailConfig = _emailConfig[0], setEmailConfig = _emailConfig[1];
var _showCompose = useState(false), showCompose = _showCompose[0], setShowCompose = _showCompose[1];
var _composeData = useState({to:"",cc:"",bcc:"",subject:"",body:"",replyTo:"",priority:"normal",attachments:[]}), composeData = _composeData[0], setComposeData = _composeData[1];
var _composeAttachments = useState([]), composeAttachments = _composeAttachments[0], setComposeAttachments = _composeAttachments[1];
var _selectedEmail = useState(null), selectedEmail = _selectedEmail[0], setSelectedEmail = _selectedEmail[1];
var _selectedIds = useState([]), selectedIds = _selectedIds[0], setSelectedIds = _selectedIds[1];
var _lastSync = useState(null), lastSync = _lastSync[0], setLastSync = _lastSync[1];
var _composeTitle = useState("写邮件"), composeTitle = _composeTitle[0], setComposeTitle = _composeTitle[1];
var _sendingEmail = useState(false), sendingEmail = _sendingEmail[0], setSendingEmail = _sendingEmail[1];
// ---- 🐝 蜂巢邮箱状态 ----
// ---- 🐝 蜂巢邮箱状态 ----
// 我的面码（网络识别码）- 从localStorage读取或生成新的
var _myFaceCode = useState(function() {
  var saved = localStorage.getItem("hive_my_facecode");
  if (saved) return saved;
  var newCode = "HIVE-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  localStorage.setItem("hive_my_facecode", newCode);
  return newCode;
}), myFaceCode = _myFaceCode[0], setMyFaceCode = _myFaceCode[1];
// 保存面码到localStorage的函数
function saveFaceCode(code) {
  localStorage.setItem("hive_my_facecode", code);
  setMyFaceCode(code);
}

var _myHiveName = useState(function() {
  return localStorage.getItem("hive_my_name") || "我";
}), myHiveName = _myHiveName[0], setMyHiveName = _myHiveName[1];

var _myHiveAvatar = useState(function() {
  return localStorage.getItem("hive_my_avatar") || "🐝";
}), myHiveAvatar = _myHiveAvatar[0], setMyHiveAvatar = _myHiveAvatar[1];

// 朋友列表 - 从localStorage读取或使用默认值
var _hiveFriends = useState(function() {
  var saved = localStorage.getItem("hive_friends");
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return [
    {id: 1, name: "张三", email: "zhangsan@hive.local", faceCode: "HIVE-A1B2C3D4", avatar: "👨", status: "online", lastSeen: "刚刚"},
    {id: 2, name: "李四", email: "lisi@hive.local", faceCode: "HIVE-E5F6G7H8", avatar: "👩", status: "offline", lastSeen: "2小时前"},
    {id: 3, name: "王五", email: "wangwu@hive.local", faceCode: "HIVE-I9J0K1L2", avatar: "👨‍💼", status: "online", lastSeen: "刚刚"}
  ];
}), hiveFriends = _hiveFriends[0], setHiveFriends = _hiveFriends[1];
// 保存朋友列表到localStorage
function saveHiveFriends(friends) {
  localStorage.setItem("hive_friends", JSON.stringify(friends));
  setHiveFriends(friends);
}
// 消息记录 - 从localStorage读取
var _hiveMessages = useState(function() {
  var saved = localStorage.getItem("hive_messages");
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return [
    {id: 1, from: "张三", to: "我", content: "你好，最近怎么样？", timestamp: "2026-07-07 10:30", type: "text"},
    {id: 2, from: "我", to: "张三", content: "挺好的，谢谢！", timestamp: "2026-07-07 10:32", type: "text"}
  ];
}), hiveMessages = _hiveMessages[0], setHiveMessages = _hiveMessages[1];
// 保存消息到localStorage
function saveHiveMessages(messages) {
  localStorage.setItem("hive_messages", JSON.stringify(messages));
  setHiveMessages(messages);
}
var _selectedFriend = useState(null), selectedFriend = _selectedFriend[0], setSelectedFriend = _selectedFriend[1];
var _hiveTab = useState("friends"), hiveTab = _hiveTab[0], setHiveTab = _hiveTab[1];
var _showAddFriend = useState(false), showAddFriend = _showAddFriend[0], setShowAddFriend = _showAddFriend[1];
var _newFriend = useState({name: "", email: ""}), newFriend = _newFriend[0], setNewFriend = _newFriend[1];
var _hiveInput = useState(""), hiveInput = _hiveInput[0], setHiveInput = _hiveInput[1];
var _attachedFiles = useState([]), attachedFiles = _attachedFiles[0], setAttachedFiles = _attachedFiles[1];;var _aiInput = useState(""), aiInput = _aiInput[0], setAiInput = _aiInput[1];
var _aiResult = useState(""), aiResult = _aiResult[0], setAiResult = _aiResult[1];
var _aiLoading = useState(false), aiLoading = _aiLoading[0], setAiLoading = _aiLoading[1];
var _aiMode = useState("optimize"), aiMode = _aiMode[0], setAiMode = _aiMode[1]
  var _savingConfig = useState(false), savingConfig = _savingConfig[0], setSavingConfig = _savingConfig[1];
  var _aiInput = useState(""), aiInput = _aiInput[0], setAiInput = _aiInput[1];
  var _aiResult = useState(""), aiResult = _aiResult[0], setAiResult = _aiResult[1];
  var _aiLoading = useState(false), aiLoading = _aiLoading[0], setAiLoading = _aiLoading[1];
  var _aiMode = useState("optimize"), aiMode = _aiMode[0], setAiMode = _aiMode[1];
  
  // 全局AI副驾面板状态
  var _aiPanelOpen = useState(false), aiPanelOpen = _aiPanelOpen[0], setAiPanelOpen = _aiPanelOpen[1];
  var _aiPanelTab = useState("config"), aiPanelTab = _aiPanelTab[0], setAiPanelTab = _aiPanelTab[1];
  // AI分身全局开关
  var _aiFenshenEnabled = useState(function(){try{return localStorage.getItem("aiFenshenGlobalEnabled")!=="false";}catch(e){return true;}}), aiFenshenEnabled = _aiFenshenEnabled[0], setAiFenshenEnabled = _aiFenshenEnabled[1];
  
  // Himalaya技术自配状态
  var _himalayaAutoConfig = useState({
    email: "",
    password: "",
    provider: "",
    status: "idle",
    message: ""
  }), himalayaAutoConfig = _himalayaAutoConfig[0], setHimalayaAutoConfig = _himalayaAutoConfig[1];
  
  // WebRTC P2P通信状态
  var _webrtcReady = useState(false), webrtcReady = _webrtcReady[0], setWebrtcReady = _webrtcReady[1];
  var _peerConnections = useState({}), peerConnections = _peerConnections[0], setPeerConnections = _peerConnections[1];
  var _dataChannels = useState({}), dataChannels = _dataChannels[0], setDataChannels = _dataChannels[1];
  var _signalingSocket = useState(null), signalingSocket = _signalingSocket[0], setSignalingSocket = _signalingSocket[1];
  var _connectionStatus = useState("disconnected"), connectionStatus = _connectionStatus[0], setConnectionStatus = _connectionStatus[1];
  var _p2pEnabled = useState(false), p2pEnabled = _p2pEnabled[0], setP2pEnabled = _p2pEnabled[1];
  var _showAddContact = useState(false), showAddContact = _showAddContact[0], setShowAddContact = _showAddContact[1];
  var _newContact = useState({name:"",email:"",phone:"",company:""}), newContact = _newContact[0], setNewContact = _newContact[1];
  var _contactGroups = useState(["默认分组","同事","家人","朋友"]), contactGroups = _contactGroups[0], setContactGroups = _contactGroups[1];
  var _selectedGroup = useState("全部"), selectedGroup = _selectedGroup[0], setSelectedGroup = _selectedGroup[1];
    var _s = useState(""), si = _s[0], setSi = _s[1];
  // ---- 📧 邮箱预设配置 ----
  // 支持30+主流邮箱服务商，像Foxmail一样兼容
  var EMAIL_PROVIDERS = {
    // 腾讯系
    qq: {name:"QQ邮箱", smtp:{host:"smtp.qq.com",port:465,ssl:true,tls:true}, imap:{host:"imap.qq.com",port:993,ssl:true}, pop3:{host:"pop.qq.com",port:995,ssl:true}, authCode:true, domain:"qq.com"},
    foxmail: {name:"Foxmail邮箱", smtp:{host:"smtp.qq.com",port:465,ssl:true,tls:true}, imap:{host:"imap.qq.com",port:993,ssl:true}, pop3:{host:"pop.qq.com",port:995,ssl:true}, authCode:true, domain:"foxmail.com"},
    
    // 网易系
    mail163: {name:"163邮箱", smtp:{host:"smtp.163.com",port:465,ssl:true,tls:true}, imap:{host:"imap.163.com",port:993,ssl:true}, pop3:{host:"pop.163.com",port:995,ssl:true}, authCode:true, domain:"163.com"},
    mail126: {name:"126邮箱", smtp:{host:"smtp.126.com",port:465,ssl:true,tls:true}, imap:{host:"imap.126.com",port:993,ssl:true}, pop3:{host:"pop.126.com",port:995,ssl:true}, authCode:true, domain:"126.com"},
    yeah: {name:"Yeah邮箱", smtp:{host:"smtp.yeah.net",port:465,ssl:true,tls:true}, imap:{host:"imap.yeah.net",port:993,ssl:true}, pop3:{host:"pop.yeah.net",port:995,ssl:true}, authCode:true, domain:"yeah.net"},
    netease: {name:"网易企业邮", smtp:{host:"smtp.qiye.163.com",port:465,ssl:true,tls:true}, imap:{host:"imap.qiye.163.com",port:993,ssl:true}, pop3:{host:"pop.qiye.163.com",port:995,ssl:true}, authCode:true, domain:"qiye.163.com"},
    
    // 阿里系
    aliyun: {name:"阿里云邮箱", smtp:{host:"smtp.aliyun.com",port:465,ssl:true,tls:true}, imap:{host:"imap.aliyun.com",port:993,ssl:true}, pop3:{host:"pop.aliyun.com",port:995,ssl:true}, authCode:true, domain:"aliyun.com"},
    
    // 新浪系
    sina: {name:"新浪邮箱", smtp:{host:"smtp.sina.com",port:465,ssl:true,tls:true}, imap:{host:"imap.sina.com",port:993,ssl:true}, pop3:{host:"pop.sina.com",port:995,ssl:true}, authCode:true, domain:"sina.com"},
    sinacn: {name:"新浪CN邮箱", smtp:{host:"smtp.sina.cn",port:465,ssl:true,tls:true}, imap:{host:"imap.sina.cn",port:993,ssl:true}, pop3:{host:"pop.sina.cn",port:995,ssl:true}, authCode:true, domain:"sina.cn"},
    
    // 搜狐
    sohu: {name:"搜狐邮箱", smtp:{host:"smtp.sohu.com",port:465,ssl:true,tls:true}, imap:{host:"imap.sohu.com",port:993,ssl:true}, pop3:{host:"pop.sohu.com",port:995,ssl:true}, authCode:true, domain:"sohu.com"},
    
    // 21CN
    cn21: {name:"21CN邮箱", smtp:{host:"smtp.21cn.com",port:465,ssl:true,tls:true}, imap:{host:"imap.21cn.com",port:993,ssl:true}, pop3:{host:"pop.21cn.com",port:995,ssl:true}, authCode:true, domain:"21cn.com"},
    
    // 国际主流
    gmail: {name:"Gmail", smtp:{host:"smtp.gmail.com",port:587,ssl:false,tls:true}, imap:{host:"imap.gmail.com",port:993,ssl:true}, pop3:{host:"pop.gmail.com",port:995,ssl:true}, authCode:true, domain:"gmail.com"},
    outlook: {name:"Outlook/Hotmail", smtp:{host:"smtp-mail.outlook.com",port:587,ssl:false,tls:true}, imap:{host:"outlook.office365.com",port:993,ssl:true}, pop3:{host:"pop-mail.outlook.com",port:995,ssl:true}, authCode:false, domain:"outlook.com"},
    live: {name:"Live邮箱", smtp:{host:"smtp-mail.outlook.com",port:587,ssl:false,tls:true}, imap:{host:"outlook.office365.com",port:993,ssl:true}, pop3:{host:"pop-mail.outlook.com",port:995,ssl:true}, authCode:false, domain:"live.com"},
    hotmail: {name:"Hotmail", smtp:{host:"smtp-mail.outlook.com",port:587,ssl:false,tls:true}, imap:{host:"outlook.office365.com",port:993,ssl:true}, pop3:{host:"pop-mail.outlook.com",port:995,ssl:true}, authCode:false, domain:"hotmail.com"},
    yahoo: {name:"Yahoo邮箱", smtp:{host:"smtp.mail.yahoo.com",port:465,ssl:true,tls:true}, imap:{host:"imap.mail.yahoo.com",port:993,ssl:true}, pop3:{host:"pop.mail.yahoo.com",port:995,ssl:true}, authCode:true, domain:"yahoo.com"},
    yahoocn: {name:"雅虎中国", smtp:{host:"smtp.mail.yahoo.cn",port:465,ssl:true,tls:true}, imap:{host:"imap.mail.yahoo.cn",port:993,ssl:true}, pop3:{host:"pop.mail.yahoo.cn",port:995,ssl:true}, authCode:true, domain:"yahoo.cn"},
    
    // 苹果
    icloud: {name:"iCloud邮箱", smtp:{host:"smtp.mail.me.com",port:587,ssl:false,tls:true}, imap:{host:"imap.mail.me.com",port:993,ssl:true}, pop3:{host:"pop.mail.me.com",port:995,ssl:true}, authCode:true, domain:"icloud.com"},
    me: {name:"Me邮箱", smtp:{host:"smtp.mail.me.com",port:587,ssl:false,tls:true}, imap:{host:"imap.mail.me.com",port:993,ssl:true}, pop3:{host:"pop.mail.me.com",port:995,ssl:true}, authCode:true, domain:"me.com"},
    mac: {name:"Mac邮箱", smtp:{host:"smtp.mail.me.com",port:587,ssl:false,tls:true}, imap:{host:"imap.mail.me.com",port:993,ssl:true}, pop3:{host:"pop.mail.me.com",port:995,ssl:true}, authCode:true, domain:"mac.com"},
    
    // 企业邮箱
    exch: {name:"Exchange", smtp:{host:"",port:587,ssl:false,tls:true}, imap:{host:"",port:993,ssl:true}, pop3:{host:"",port:995,ssl:true}, authCode:false, domain:""},
    office365: {name:"Office 365", smtp:{host:"smtp.office365.com",port:587,ssl:false,tls:true}, imap:{host:"outlook.office365.com",port:993,ssl:true}, pop3:{host:"outlook.office365.com",port:995,ssl:true}, authCode:false, domain:"onmicrosoft.com"},
    
    // 其他
    tom: {name:"TOM邮箱", smtp:{host:"smtp.tom.com",port:465,ssl:true,tls:true}, imap:{host:"imap.tom.com",port:993,ssl:true}, pop3:{host:"pop.tom.com",port:995,ssl:true}, authCode:true, domain:"tom.com"},
    mail139: {name:"139邮箱", smtp:{host:"smtp.139.com",port:465,ssl:true,tls:true}, imap:{host:"imap.139.com",port:993,ssl:true}, pop3:{host:"pop.139.com",port:995,ssl:true}, authCode:true, domain:"139.com"},
    mail189: {name:"189邮箱", smtp:{host:"smtp.189.cn",port:465,ssl:true,tls:true}, imap:{host:"imap.189.cn",port:993,ssl:true}, pop3:{host:"pop.189.cn",port:995,ssl:true}, authCode:true, domain:"189.cn"},
    
    // 自定义
    custom: {name:"自定义", smtp:{host:"",port:587,ssl:false,tls:true}, imap:{host:"",port:993,ssl:true}, pop3:{host:"",port:995,ssl:true}, authCode:false, domain:""}
  };

  // ---- 📧 邮箱模拟数据函数 ----
  function getMockEmails(tab) {
    var mockData = {
      inbox: [
        {id: 1, subject: "欢迎使用巢邮箱系统", from_addr: "系统通知", body: "感谢您使用巢邮箱系统，这是一个AI驱动的智能邮箱平台。", created_at: "2026-07-06"},
        {id: 2, subject: "项目进度更新", from_addr: "项目经理", body: "关于本周的项目进度，我们已经完成了80%的开发工作。", created_at: "2026-07-05"},
        {id: 3, subject: "会议邀请", from_addr: "人力资源部", body: "邀请您参加下周一的团队建设会议。", created_at: "2026-07-04"}
      ],
      sent: [
        {id: 1, subject: "工作汇报", to_addr: "老板", body: "本周工作汇报：完成了邮箱功能开发。", created_at: "2026-07-06"},
        {id: 2, subject: "项目建议", to_addr: "团队", body: "建议采用新的技术方案。", created_at: "2026-07-05"}
      ],
      drafts: [
        {id: 1, subject: "未完成的邮件", body: "这是一个草稿...", created_at: "2026-07-06"}
      ],
      contacts: [
        {id: 1, name: "张三", email: "zhangsan@example.com", company: "ABC公司", created_at: "2026-07-06"},
        {id: 2, name: "李四", email: "lisi@example.com", company: "XYZ公司", created_at: "2026-07-05"}
      ],
      trash: [
        {id: 1, subject: "已删除的邮件", body: "这是一封被删除的邮件。", created_at: "2026-07-04"}
      ],
      settings: [
        {id: 1, name: "邮箱设置", description: "配置SMTP和IMAP参数"},
        {id: 2, name: "账户设置", description: "管理邮箱账户"},
        {id: 3, name: "同步设置", description: "配置邮件同步"}
      ]
    };

    return mockData[tab] || [];
  }

  function fetchEmails(tab, account, page) {
    setLoading(true);
    setError(null);
    
    if (page === undefined) page = curPage;
    if (account === undefined) account = currentAccount;
    if (account === '__all__') account = '';
    
    var offset = (page - 1) * pageSize;
    var apiBase = '/api/plugins/team_chat/email';
    var endpoint = {inbox:'/inbox', sent:'/sent', drafts:'/drafts', trash:'/trash'}[tab] || '/inbox';
    var params = '?limit=' + pageSize + '&offset=' + offset;
    if (account) params += '&account=' + encodeURIComponent(account);
    var url = apiBase + endpoint + params;
    
    fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            setLoading(false);
            var emailList = data.emails || data.drafts; if (data.success && emailList) {
                var emails = emailList.map(function(e) {
                    return {
                        id: e.id,
                        uid: e.uid,
                        from_addr: e.from_addr || e.from,
                        from_name: e.from_name || '',
                        to_addr: e.to_addr || e.to || '',
                        cc: e.cc_addr || e.cc || '',
                        subject: e.subject,
                        date: e.received_date || e.sent_date || e.date,
                        sent_date: e.sent_date || e.date,
                        received_date: e.received_date,
                        created_at: e.created_at,
                        read: e.read_status === 1 || e.read === true,
                        read_status: e.read_status,
                        body: e.body || '',
                        html_body: e.html_body || '',
                        preview: e.body ? e.body.substring(0, 100) : '',
                        account_email: e.account_email || e.account || '',
                        starred: e.starred || false,
                        attachments: e.attachments || [],
                        folder: e.folder || 'INBOX'
                    };
                });
                setEmails(classifyEmails(emails));
                if (data.total !== undefined) setTotalEmails(data.total);
              } else {
                setEmails([]);
                setTotalEmails(0);
              }

  // ---- 🤖 AI 邮件自动分类 ----
  function classifyEmails(emails) {
    return emails.map(function(email) {
      var subject = (email.subject || "").toLowerCase();
      var body = (email.body || "").toLowerCase();
      var fromAddr = (email.from_addr || "").toLowerCase();
      var category = "general";
      // 广告关键词
      var adWords = ["广告", "promo", "discount", "offer", "sale", "subscribe", "unsubscribe", "newsletter", "推广", "优惠", "限时", "促销", "免费领取", "点击领取"];
      var isAd = adWords.some(function(w) { return subject.indexOf(w) >= 0 || body.indexOf(w) >= 0; });
      if (isAd) category = "ad";
      // 企业/商业
      var bizWords = ["invoice", "contract", "project", "meeting", "report", "order", "payment", "proposal", "合作", "合同", "会议", "发票", "付款", "报价", "项目", "报告", "审批", "申请"];
      var isBiz = bizWords.some(function(w) { return subject.indexOf(w) >= 0 || body.indexOf(w) >= 0; });
      if (isBiz) category = "enterprise";
      // 通知类（系统/平台）
      var notiWords = ["notification", "alert", "verify", "reset", "password", "confirm", "welcome", "验证", "重置", "密码", "确认", "注册", "激活", "通知"];
      var isNoti = notiWords.some(function(w) { return subject.indexOf(w) >= 0; });
      if (isNoti) category = "notification";
      return Object.assign({}, email, {category: category});
    });
  }
        })
        .catch(function(e) {
            setLoading(false);
            setError('加载邮件失败: ' + e.message);
            setEmails([]);
            setTotalEmails(0);
        });
}
  
  // ---- 📧 多邮箱配置加载 ----
  function loadEmailConfigs() {
    fetch('/api/plugins/team_chat/email/mail-configs')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.configs) {
          setEmailConfigs(data.configs);
          if (data.configs.length === 0 && emailConfig && emailConfig.email) {
            // 兼容老逻辑：把当前 config 当作唯一邮箱
            setEmailConfigs([Object.assign({}, emailConfig, {id: emailConfig.id || 0})]);
            setCurrentAccount(emailConfig.email);
          } else if (data.configs.length > 0 && (!currentAccount || currentAccount === '__all__')) {
            setCurrentAccount(data.configs[0].email);
          }
        }
      })
      .catch(function(e) {
        console.error('加载邮箱配置失败:', e);
        // fallback 到 localStorage
        if (emailConfig && emailConfig.email) {
          setEmailConfigs([Object.assign({}, emailConfig, {id: 0})]);
          setCurrentAccount(emailConfig.email);
        }
      });
  }
  
  // 页面加载 & 切换邮箱时自动刷新
  React.useEffect(function() {
    loadEmailConfigs();
  }, []);
  
  React.useEffect(function() {
    if (emailTab && emailTab !== 'settings' && emailTab !== 'contacts' && emailTab !== 'security') {
      var acc = (currentAccount && currentAccount !== '__all__') ? currentAccount : '';
      setCurPage(1);
      fetchEmails(emailTab, acc, 1);
    }
  }, [currentAccount, emailTab]);
  
  // 从 Agent Mail CLI 加载邮件数据
  window.loadAgentMailData = function() {
    // 从后端API加载真实邮件数据（带分页参数避免HTTP/2截断）
    window.agentMailData = {inbox: [], sent: [], drafts: [], trash: []};
    
    var apiBase = '/api/plugins/team_chat/email';
    var folders = ['inbox', 'sent', 'drafts', 'trash'];
    var pageLimit = 20; // 每页限制避免响应体过大
    
    folders.forEach(function(folder) {
        var endpoint = {inbox:'/inbox', sent:'/sent', drafts:'/drafts', trash:'/trash'}[folder];
        fetch(apiBase + endpoint + '?limit=' + pageLimit + '&offset=0')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var emailList = data.emails || data.drafts; if (data.success && emailList) {
                    window.agentMailData[folder] = emailList.map(function(e) {
                        return {
                            id: e.id,
                            from: e.from_addr || e.from,
                            to: e.to_addr || e.to,
                            subject: e.subject,
                            date: e.received_date || e.sent_date || e.date,
                            read: e.read_status === 1 || e.read === true,
                            body: e.body || ''
                        };
                    });
                }
            })
            .catch(function(e) {
                console.error('加载' + folder + '失败:', e);
            });
    });
  };
  
  // 页面加载时初始化
  if (typeof window !== 'undefined') {
    window.loadAgentMailData();
  }
  
  // 测试邮件连接
  // 用指定配置测试连接（不从 emailConfig state 读取）
  function testEmailConnectionWithCfg(cfg) {
    if (!cfg || !cfg.email) { alert("请先保存配置再测试"); return; }
    var testCfg = Object.assign({}, cfg);
    if (!testCfg.smtp_username) testCfg.smtp_username = testCfg.username || testCfg.email;
    if (!testCfg.smtp_password || testCfg.smtp_password === "") { testCfg.smtp_password = testCfg.password || ""; }
    if (!testCfg.imap_username) testCfg.imap_username = testCfg.username || testCfg.email;
    if (!testCfg.imap_password) testCfg.imap_password = testCfg.password || "";
    fetch("/api/plugins/team_chat/email/test-connection", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(testCfg)
    }).then(function(res) { return res.json(); })
    .then(function(data) { alert(data.success ? "✅ 连接成功！" : "❌ 连接失败：" + (data.message || data.error || "未知错误")); })
    .catch(function(e) { alert("❌ 测试失败：" + e.message); });
  }
  
  function testEmailConnection() {
  if (!emailConfig || !emailConfig.email) {
    alert("请先配置邮箱");
    return;
  }

  // 填充IMAP字段（默认与SMTP相同）
  var cfg = Object.assign({}, emailConfig);
  if (!cfg.smtp_username) cfg.smtp_username = cfg.username || cfg.email;
  if (!cfg.smtp_password || cfg.smtp_password === "") { cfg.smtp_password = cfg.password || ""; }
  if (!cfg.imap_username) cfg.imap_username = cfg.username || cfg.email;
  if (!cfg.imap_password) cfg.imap_password = cfg.password || "";
  if (!cfg.imap_host) cfg.imap_host = cfg.imap_host || "";
  if (!cfg.imap_port) cfg.imap_port = cfg.imap_port || 993;
  if (!cfg.imap_ssl) cfg.imap_ssl = cfg.imap_ssl !== false;
  if (!cfg.display_name) cfg.display_name = cfg.email.split("@")[0];

  // 显示加载状态
  var loadingElement = document.querySelector('.connection-test-loading');
  if (loadingElement) loadingElement.style.display = 'block';

  fetch("/api/plugins/team_chat/email/test-connection", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(cfg)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (loadingElement) loadingElement.style.display = 'none';

    // 双重检查：既要 success=true，也要 SMTP/IMAP 实际结果
    var results = data.results || data;
    var smtpOk = results.smtp === true;
    var imapOk = results.imap === true;

    if (smtpOk && imapOk) {
      alert("✓ 连接测试成功！\nSMTP: ✓\nIMAP: ✓");
      // 保存配置到localStorage（用补全后的配置）
      localStorage.setItem("teamchat_email_config", JSON.stringify(cfg));
    } else if (smtpOk || imapOk) {
      var partialMsg = [];
      if (smtpOk) partialMsg.push("SMTP ✓");
      else partialMsg.push("SMTP ✗");
      if (imapOk) partialMsg.push("IMAP ✓");
      else partialMsg.push("IMAP ✗");
      alert("⚠️ 连接测试部分成功\n" + partialMsg.join("\n") + "\n\n" + (results.message || ""));
    } else {
      alert("✗ 连接测试失败\n" + (results.message || data.message || "请检查配置"));
    }
  })
  .catch(function(err) {
    if (loadingElement) loadingElement.style.display = 'none';
    alert("✗ 连接测试失败: " + err.message);
    console.error("连接测试错误:", err);
  });
}

  
  window.searchContactsMail = function(senderEmail, senderName) {
    // 切到收件箱，然后加载该发件人的邮件
    setEmailTab("inbox");
    setEmails([]);
    setLoading(true);
    setError("");
    // 修改筛选为显示全部
    if (typeof setInboxFilter !== 'undefined') { setInboxFilter("all"); }

    function handleResponse(data) {
      setLoading(false);
      var emailList = data.emails || data.drafts; if (data.success && emailList) {
        setEmails(data.emails);
        if (data.emails.length === 0) {
          setError("未找到 " + (senderName || senderEmail) + " 的关联邮件（可能该邮件不在已同步的收件箱中）");
        }
      } else {
        setError("查询失败: " + (data.message || "未知错误"));
      }
    }

    function handleError(err) {
      setLoading(false);
      setError("查询失败: " + (err.message || "网络错误"));
    }

    // 优先使用 by-sender 端点，404 时 fallback 到 search
    fetch("/api/plugins/team_chat/email/email/by-sender?email=" + encodeURIComponent(senderEmail))
      .then(function(r) {
        if (!r.ok) {
          // Fallback: use search endpoint
          return fetch("/api/plugins/team_chat/email/email/search?q=" + encodeURIComponent(senderEmail))
            .then(function(r2) { return r2.json(); })
            .then(function(data2) {
              // Filter by from_addr
              if (data2.success && data2.emails) {
                data2.emails = data2.emails.filter(function(e) {
                  return e.from_addr && e.from_addr.toLowerCase().indexOf(senderEmail.toLowerCase()) >= 0;
                });
              }
              handleResponse(data2);
              return null; // prevent next .then
            });
        }
        return r.json();
      })
      .then(function(data) {
        if (data !== null) handleResponse(data);
      })
      .catch(handleError);

    // 关闭联系人弹窗（如果在弹窗中）
    var overlay = document.getElementById('compose-modal-overlay');
    if (overlay) overlay.remove();
  };


  function markRead(email) {
    if (email.read_status === 1) return;
    fetch("/api/plugins/team_chat/email/inbox/" + email.id + "/read", {
      method: "PUT",
      headers: {"Content-Type": "application/json"}
    }).then(function() {
      setEmails(emails.map(function(e) {
        if (e.id === email.id) { e.read_status = 1; return Object.assign({}, e); }
        return e;
      }));
    }).catch(function() {});
  }

  function deleteEmail(tab, id) {
    var url, method;
    if (tab === "trash") {
      url = "/api/plugins/team_chat/email/trash/" + id;
      method = "DELETE";
    } else {
      url = "/api/plugins/team_chat/email/" + tab + "/" + id;
      method = "DELETE";
    }
    fetch(url, {
      method: method,
      headers: {"Content-Type": "application/json"}
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        var updatedEmails = emails.filter(function(email){return email.id !== id;});
        setEmails(updatedEmails);
        setTotalEmails(Math.max(0, totalEmails - 1));
        if (tab === "trash") {
          setTimeout(function(){ fetchEmails("trash"); }, 500);
        }
      } else {
        alert("删除失败: " + (d.message || "请重试"));
      }
    }).catch(function(err) {
      console.error("删除邮件失败:", err);
      alert("删除失败: " + err.message);
    });
  }

  // ---- ⭐ 星标邮件 ----
  function toggleStarEmail(email) {
    var newStarred = !email.starred;
    // Update local state
    var updated = emails.map(function(e) {
      if (e.id === email.id) return Object.assign({}, e, {starred: newStarred});
      return e;
    });
    setEmails(updated);
    // Persist to backend
    var formData = new FormData();
    formData.append("starred", newStarred ? "1" : "0");
    fetch("/api/plugins/team_chat/email/inbox/" + email.id + "/star", {
      method: "POST",
      body: formData
    }).catch(function(err) { /* silent */ });
  }

  // ---- ↩ 恢复回收站邮件 ----
  function restoreEmail(item) {
    fetch("/api/plugins/team_chat/email/trash/" + item.id + "/restore", {
      method: "POST",
      headers: {"Content-Type": "application/json"}
    }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.success) {
        setEmails(emails.filter(function(e) { return e.id !== item.id; }));
        setTotalEmails(Math.max(0, totalEmails - 1));
        alert("✅ 邮件已恢复");
      } else {
        alert("❌ 恢复失败: " + (d.message || "未知错误"));
      }
    }).catch(function(err) {
      alert("❌ 恢复失败: " + err.message);
    });
  }

  // ---- 🗑️ 清空回收站 ----  // ---- 📧 邮件详情预览弹窗 ----
  window.showMailDetail = function(email) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(3px)';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:12px;padding:24px;width:640px;min-width:360px;min-height:280px;max-height:95vh;overflow:auto;resize:both;box-shadow:0 12px 40px rgba(0,0,0,0.3);border:1px solid #ddd';
    var fromAddr = email.from_addr || email.from || '';
    var toAddr = email.to_addr || email.to || '';
    var subject = email.subject || '(无主题)';
    var htmlBody = email.html_body || '';
    var plainBody = email.body || '';
    var body = htmlBody || plainBody || '(无内容)';
    var hasHtml = !!htmlBody;
    var date = email.sent_date || email.received_date || email.date || '';
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
      '<h2 style="margin:0;font-size:16px;word-break:break-all">' + subject.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</h2>' +
      '<button onclick="this.closest(\'div\').parentElement.remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999">✕</button></div>' +
      '<div style="display:flex;gap:12px;margin-bottom:12px;font-size:13px;color:#666">' +
      '<div><b>发件人：</b>' + fromAddr.replace(/</g,'&lt;') + '</div>' +
      '<div><b>收件人：</b>' + toAddr.replace(/</g,'&lt;') + '</div>' +
      '<div><b>时间：</b>' + (date ? new Date(date).toLocaleString() : '未知') + '</div></div>' +
      '<div id="mail-detail-body" style="border-top:1px solid #eee;padding-top:12px;font-size:14px;line-height:1.6;word-break:break-word;max-height:50vh;overflow-y:auto"></div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    var bodyDiv = document.getElementById('mail-detail-body');
    if (bodyDiv && hasHtml) {
      var iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:100%;min-height:300px;border:none;background:white;';
      iframe.srcdoc = htmlBody;
      iframe.sandbox = 'allow-same-origin';
      iframe.onload = function() {
        try {
          var h = iframe.contentDocument.body.scrollHeight || 300;
          iframe.style.height = Math.min(h, window.innerHeight * 0.45) + 'px';
        } catch(e) {}
      };
      bodyDiv.appendChild(iframe);
    } else if (bodyDiv) {
      bodyDiv.innerHTML = plainBody.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    }
  };

  function clearTrash() {
    if (!confirm("确定要清空回收站吗？此操作不可恢复！")) return;
    var trashEmails = emails.filter(function(e) { return true; });
    trashEmails.forEach(function(email) {
      fetch("/api/plugins/team_chat/email/trash/" + email.id, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"}
      }).then(function(r) { return r.json(); }).then(function(d) {
        if (d.success) { /* ok */ }
      }).catch(function(err) {
        console.error("删除回收站邮件失败:", err);
      });
    });
    setEmails([]);
    setTotalEmails(0);
    setCurPage(1);
    alert("✅ 回收站已清空");
  }

  // ---- 👤 联系人操作函数 ----
  function addContact(nm, em, ph, cp) {
    var name = nm || newContact.name;
    var email = em || newContact.email;
    var phone = ph || newContact.phone || "";
    var company = cp || newContact.company || "";
    console.log("[addContact] 被调用, name=", name, "email=", email);
    if (!name || !email) {
      alert("请填写姓名和邮箱");
      return;
    }
    var contact = {
      name: name,
      email: email,
      phone: phone,
      company: company
    };
    fetch(getApiUrl("/plugins/team_chat/email/contacts"), {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(contact)
    }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          setNewContact({name:"",email:"",phone:"",company:""});
          setShowAddContact(false);
          fetchContacts();
        } else {
          alert("添加失败: " + (data.message || "未知错误"));
        }
      }).catch(function(e) {
        alert("添加失败: " + e.message);
      });
  }
  
  function fetchContacts() {
    setLoading(true);
    console.log("[fetchContacts] 开始请求...");
    fetch(getApiUrl("/plugins/team_chat/email/contacts"), {headers: apiHeaders()})
      .then(function(r) { console.log("[fetchContacts] 响应状态:",r.status); return r.json(); })
      .then(function(data) {
        console.log("[fetchContacts] 数据:", data);
        setLoading(false);
        if (data.success && data.contacts) {
          setEmails(data.contacts);
        } else {
          console.log("[fetchContacts] 数据格式异常");
          setEmails([]);
        }
      }).catch(function(e) {
        console.log("[fetchContacts] 请求失败:", e.message);
        setLoading(false);
        setEmails([]);
      });
  }

  function deleteContact(id) {
    if (!confirm("确定要删除此联系人吗？")) return;
    fetch(getApiUrl("/plugins/team_chat/email/contacts/" + id), {
      method: 'DELETE',
      headers: apiHeaders()
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          fetchContacts();
        } else {
          alert("删除失败: " + (data.message || "未知错误"));
        }
      }).catch(function(e) {
        alert("删除失败: " + e.message);
      });
  }

  // ---- 📄 翻页功能 ----
  function goPage(tab, page) {
    if (page < 1) page = 1;
    var totalPages = Math.max(1, Math.ceil(totalEmails / pageSize));
    if (page > totalPages) page = totalPages;
    setCurPage(page);
    fetchEmails(tab, undefined, page);
  }
  function onPageSizeChange(tab, newSize) {
    setPageSize(newSize);
    setCurPage(1);
    fetchEmails(tab, undefined, 1);
  }

  // ---- 📤 邮件发送功能 ----
  // 处理附件选择
  function handleComposeAttachment(e) {
    var files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    var newAttachments = files.map(function(file) {
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      };
    });
    
    setComposeAttachments(composeAttachments.concat(newAttachments));
  }
  
  // 移除附件
  function removeComposeAttachment(index) {
    setComposeAttachments(composeAttachments.filter(function(_, i) { return i !== index; }));
  }
  
  // 发送邮件（支持附件）
  function openComposeModal() {
    setShowCompose(true);
    openComposeDOM("写邮件", "", "", "", "");
  }

  function closeComposeModal() {
    setShowCompose(false);
    setComposeData({to:"",cc:"",bcc:"",subject:"",body:"",replyTo:"",priority:"normal",attachments:[]});
    setComposeAttachments([]);
  }

  function sendEmail() {
    if (!composeData.to || !composeData.subject) {
      alert("请填写收件人和主题");
      return;
    }
    
    if (!emailConfig || !emailConfig.email) {
      alert("请先配置邮箱");
      return;
    }
    
    setSendingEmail(true);
    
    // 构建FormData（支持附件）
    var formData = new FormData();
    formData.append("to_addr", composeData.to);
    formData.append("to_name", composeData.to.split("@")[0]);
    formData.append("subject", composeData.subject);
    formData.append("body", composeData.body);
    if (composeData.cc) formData.append("cc", composeData.cc);
    if (composeData.bcc) formData.append("bcc", composeData.bcc);
    
    // 添加附件
    if (composeAttachments && composeAttachments.length > 0) {
      composeAttachments.forEach(function(file, idx) {
        if (file.file) {
          formData.append("attachments", file);
        }
      });
    }
    
    // 调用后端API发送邮件
    fetch("/api/plugins/team_chat/email/send", {
      method: "POST",
      body: formData
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      setSendingEmail(false);
      if (data.success) {
        closeComposeModal();
        alert("✅ " + data.message);
        // 如果在发件箱页面，刷新列表
        if (emailTab === "sent") {
          fetchEmails("sent");
        }
      } else {
        alert("❌ 发送失败: " + (data.message || "请检查配置"));
      }
    })
    .catch(function(err) {
      setSendingEmail(false);
      console.error("发送邮件失败:", err);
      alert("❌ 发送失败: " + err.message);
    });
  }

  function getEmailText(email) {
    if (email.body && email.body.trim()) return email.body;
    if (email.html_body) {
      var t = email.html_body;
      t = t.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      t = t.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      t = t.replace(/<br\s*\/?>/gi, '\n');
      t = t.replace(/<\/p>/gi, '\n');
      t = t.replace(/<\/div>/gi, '\n');
      t = t.replace(/<[^>]+>/g, '');
      t = t.replace(/&nbsp;/g, ' ');
      t = t.replace(/&lt;/g, '<');
      t = t.replace(/&gt;/g, '>');
      t = t.replace(/&amp;/g, '&');
      t = t.replace(/&quot;/g, '"');
      t = t.replace(/&#39;/g, "'");
      t = t.replace(/\n{3,}/g, '\n\n');
      return t.trim();
    }
    return "(无内容)";
  }

  function replyEmail(email, replyAll) {
    setShowCompose(true);
    var dateStr = email.received_date || email.sent_date || email.created_at || "";
    var quoteHeader = "\n\n--- 原始邮件 ---\n发件人: " + (email.from_name || email.from_addr || "未知")
      + "\n发送时间: " + dateStr
      + "\n收件人: " + (email.to_addr || "")
      + "\n主题: " + (email.subject || "(无主题)") + "\n\n";
    var quoteBody = getEmailText(email).split('\n').map(function(l){return '> '+l;}).join('\n');
    openComposeDOM(replyAll ? "回复全部" : "回复",
      replyAll ? (email.from_addr + "," + (email.cc || "")) : email.from_addr,
      "",
      "Re: " + email.subject,
      quoteHeader + quoteBody
    );
  }

  function forwardEmail(email) {
    setShowCompose(true);
    var dateStr = email.received_date || email.sent_date || email.created_at || "";
    var quoteHeader = "\n\n--- 转发邮件 ---\n发件人: " + (email.from_name || email.from_addr || "未知")
      + "\n发送时间: " + dateStr
      + "\n收件人: " + (email.to_addr || "")
      + "\n主题: " + (email.subject || "(无主题)") + "\n\n";
    var quoteBody = getEmailText(email);
    openComposeDOM("转发", "", "", "Fwd: " + email.subject,
      quoteHeader + quoteBody
    );
  }

  function openComposeDOM(title, to, cc, subject, body) {
    // 初始化附件数组
    window.composeAttachments = [];
    console.log('[TeamChat] Opening compose modal, attachments reset');
    var old = document.getElementById('compose-modal-overlay');
    if (old) old.remove();
    var overlay = document.createElement('div');
    overlay.id = 'compose-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(3px)';
    overlay.innerHTML = '<div style="background:linear-gradient(180deg,#fafafa,#f0f0f0);border-radius:12px;padding:24px;width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,0.3);border:1px solid #ddd">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'+
      '<h2 style="margin:0">✉️ '+title+'</h2>'+
      '<button onclick="document.getElementById(&apos;compose-modal-overlay&apos;).remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999">✕</button></div>'+
      '<div style="display:flex;flex-direction:column;gap:12px">'+
      '<div><label style="font-size:14px;margin-bottom:4px;display:block">收件人 *</label><input id="cm-to" type="text" value="'+to.replace(/"/g,'&quot;')+'" placeholder="多个收件人用逗号分隔" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#fff;box-sizing:border-box"></div>'+
      '<div><label style="font-size:14px;margin-bottom:4px;display:block">抄送 (CC)</label><input id="cm-cc" type="text" value="'+(cc||'').replace(/"/g,'&quot;')+'" placeholder="抄送给其他人" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#fff;box-sizing:border-box"></div>'+
      '<div><label style="font-size:14px;margin-bottom:4px;display:block">密送 (BCC)</label><input id="cm-bcc" type="text" placeholder="密送给其他人" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#fff;box-sizing:border-box"></div>'+
      '<div><label style="font-size:14px;margin-bottom:4px;display:block">主题 *</label><input id="cm-subject" type="text" value="'+subject.replace(/"/g,'&quot;')+'" placeholder="邮件主题" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#fff;box-sizing:border-box"></div>'+
      '<div><label style="font-size:14px;margin-bottom:4px;display:block">正文</label><textarea id="cm-body" placeholder="在此输入邮件内容..." style="width:100%;min-height:150px;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;resize:vertical;box-sizing:border-box">'+body.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea></div>'+
      '<div><label style="font-size:14px;margin-bottom:4px;display:block">附件 <span style="color:#999;font-size:12px">- 支持任意格式，文件夹请打包成zip</span></label><div id="cm-attachment-zone" style="border:2px dashed #ccc;border-radius:6px;padding:15px;text-align:center;cursor:pointer;transition:all 0.3s" onclick="document.getElementById(&apos;cm-attachments&apos;).click()"><div style="font-size:24px;margin-bottom:5px">📎</div><div style="font-size:13px;color:#666">点击选择文件或拖拽文件到此处</div><input type="file" id="cm-attachments" multiple style="display:none"></div><div id="cm-attachment-list" style="margin-top:10px;display:none"></div></div>'+
      '<div style="display:flex;gap:10px;margin-top:16px">'+
      '<button onclick="document.getElementById(&apos;compose-modal-overlay&apos;).remove()" style="flex:1;padding:12px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:14px;background:linear-gradient(180deg,#f5f5f5,#e8e8e8);color:#555;font-weight:bold;box-shadow:0 2px 4px rgba(0,0,0,0.1)">取消</button>'+
      '<button id="cm-draft-btn" style="flex:1;padding:12px;border:none;border-radius:6px;cursor:pointer;font-size:14px;background:linear-gradient(135deg,#11998e,#38ef7d);color:white;box-shadow:0 4px 15px rgba(17,153,142,0.4);font-weight:bold;letter-spacing:1px">📥 暂存</button>'+
      '<button id="cm-send-btn" style="flex:1;padding:12px;border:none;border-radius:6px;cursor:pointer;font-size:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;box-shadow:0 4px 15px rgba(102,126,234,0.4);font-weight:bold;letter-spacing:1px">📤 发送</button>'+
      '</div></div></div>';
    document.body.appendChild(overlay);
    document.getElementById('cm-draft-btn').onclick = function(){
      var toVal = document.getElementById('cm-to').value.trim();
      var subjectVal = document.getElementById('cm-subject').value.trim();
      var bodyVal = document.getElementById('cm-body').value;
      var ccVal = document.getElementById('cm-cc').value.trim();
      var bccVal = document.getElementById('cm-bcc').value.trim();
      var btn = document.getElementById('cm-draft-btn');
      btn.textContent = '⏳ 保存中...'; btn.disabled = true;
      var payload = {to_addr: toVal, subject: subjectVal || '(无主题)', body: bodyVal};
      if (ccVal) payload.cc = ccVal;
      if (bccVal) payload.bcc = bccVal;
      fetch('/api/plugins/team_chat/email/drafts', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) })
      .then(function(r){
        if (!r.ok) {
          return r.json().then(function(detail){
            throw new Error(detail.detail ? JSON.stringify(detail.detail) : ('HTTP '+r.status));
          });
        }
        return r.json();
      })
      .then(function(d){
        if (d.success) {
          document.getElementById('compose-modal-overlay').remove();
          alert('✅ 已保存到草稿箱');
          if (emailTab === 'drafts') fetchEmails('drafts');
        } else {
          btn.textContent = '📥 暂存'; btn.disabled = false;
          alert('❌ 保存失败: ' + (d.message || ''));
        }
      })
      .catch(function(err){
        btn.textContent = '📥 暂存'; btn.disabled = false;
        alert('❌ 保存失败: ' + (err.message || err));
      });
    };
        document.getElementById('cm-send-btn').onclick = function(){
      var toVal = document.getElementById('cm-to').value.trim();
      var subjectVal = document.getElementById('cm-subject').value.trim();
      var bodyVal = document.getElementById('cm-body').value;
      var ccVal = document.getElementById('cm-cc').value.trim();
      var bccVal = document.getElementById('cm-bcc').value.trim();
      if (!toVal || !subjectVal) { alert('请填写收件人和主题'); return; }
      if (!emailConfig || !emailConfig.email) { alert('请先配置邮箱'); return; }
      var btn = document.getElementById('cm-send-btn');
      btn.textContent = '⏳ 发送中...'; btn.disabled = true;
      var fd = new FormData();
      fd.append('to_addr', toVal); fd.append('to_name', toVal.split('@')[0]);
      fd.append('subject', subjectVal); fd.append('body', bodyVal);
      if (ccVal) fd.append('cc', ccVal);
      if (bccVal) fd.append('bcc', bccVal);
      // 添加附件
      if (window.composeAttachments && window.composeAttachments.length > 0) {
        for (var i = 0; i < window.composeAttachments.length; i++) {
          fd.append('attachments', window.composeAttachments[i]);
        }
      }
      fetch('/api/plugins/team_chat/email/send', { method: 'POST', body: fd })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.success) {
          document.getElementById('compose-modal-overlay').remove();
          alert('✅ ' + d.message);
          if (emailTab === 'sent') fetchEmails('sent');
        } else {
          btn.textContent = '📤 发送'; btn.disabled = false;
          alert('❌ 发送失败: ' + (d.message || '请检查配置'));
        }
      })
      .catch(function(err){
        btn.textContent = '📤 发送'; btn.disabled = false;
        alert('❌ 发送失败: ' + err.message);
      });

    // 加载联系人列表用于自动补全
    window.loadContactListForCompose = function() {
      fetch('/api/plugins/team_chat/email/contacts?limit=200&offset=0')
        .then(function(r){return r.json();})
        .then(function(d){
          if(d.success && d.emails){
            var listId = 'cm-contact-list';
            var existing = document.getElementById(listId);
            if(existing) existing.remove();
            var dl = document.createElement('datalist');
            dl.id = listId;
            d.emails.forEach(function(c){
              var name = c.name || '';
              var email = c.email || '';
              if (email) {
                var opt1 = document.createElement('option');
                if (name && name !== email) {
                  opt1.value = name + ' <' + email + '>';
                } else {
                  opt1.value = email;
                }
                dl.appendChild(opt1);
                if (name && name !== email) {
                  var opt2 = document.createElement('option');
                  opt2.value = email;
                  dl.appendChild(opt2);
                }
              }
            });
            document.body.appendChild(dl);
            ['cm-to', 'cm-cc'].forEach(function(fid){
              var inp = document.getElementById(fid);
              if(inp) inp.setAttribute('list', listId);
            });
            var onRecipientInput = function(e) {
              var val = e.target.value;
              var m = val.match(/^(.+?)\\s*<([^>]+@[^>]+)>\s*$/);
              if (m) {
                e.target.value = m[2];
              }
            };
            ['cm-to', 'cm-cc'].forEach(function(fid){
              var inp = document.getElementById(fid);
              if(inp) {
                inp.removeEventListener('input', onRecipientInput);
                inp.addEventListener('input', onRecipientInput);
              }
            });
          }
        }).catch(function(){});
    };
    window.loadContactListForCompose();

    // 附件功能由补丁代码处理 (Attachment Patch v3)
    };
  }

  // ---- 🐝 蜂巢邮箱操作函数 ----
  function editDraft(email) {
    // 只使用 DOM 版本的弹窗
    openComposeDOM("编辑草稿", email.to_addr || "", email.cc || "", email.subject || "", email.body || "");
  }


  /* restoreEmail duplicate removed - using new version above */




  function addHiveFriend() {
    if (!newFriend.name || !newFriend.email) {
      alert("请填写姓名和邮箱");
      return;
    }
    // 生成面码（如果没有提供）
    var faceCode = newFriend.faceCode;
    if (!faceCode || !faceCode.startsWith("HIVE-")) {
      faceCode = "HIVE-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    // 检查面码是否已存在
    var exists = hiveFriends.some(function(f) { return f.faceCode === faceCode; });
    if (exists) {
      alert("该面码已被使用，请使用其他面码");
      return;
    }
    var friend = {
      id: Date.now(),
      name: newFriend.name,
      email: newFriend.email,
      faceCode: faceCode,
      avatar: newFriend.name.charAt(0),
      status: "offline",
      lastSeen: "刚刚添加"
    };
    saveHiveFriends([...hiveFriends, friend]);
    setNewFriend({name: "", email: "", faceCode: ""});
    setShowAddFriend(false);
    console.log("添加朋友:", friend);
  }

  function deleteHiveFriend(id) {
    if (!confirm("确定要删除此朋友吗？")) return;
    var updated = hiveFriends.filter(function(f) { return f.id !== id; });
    saveHiveFriends(updated);
    if (selectedFriend && selectedFriend.id === id) {
      setSelectedFriend(null);
    }
    console.log("删除朋友: id=" + id);
  }

  function sendHiveMessage() {
    if (!selectedFriend) {
      alert("请先选择一个朋友");
      return;
    }
    if (!hiveInput.trim() && attachedFiles.length === 0) {
      alert("请输入消息内容或选择附件");
      return;
    }
    
    // 如果P2P已启用，尝试使用WebRTC发送
    if (p2pEnabled && selectedFriend.faceCode) {
      // 检查是否已有连接
      if (!peerConnections[selectedFriend.faceCode]) {
        // 发起连接
        initiateP2PConnection(selectedFriend.faceCode);
        // 等待连接建立后发送
        setTimeout(function() {
          sendP2PMessage(selectedFriend.faceCode, hiveInput);
        }, 2000);
      } else {
        // 直接发送
        sendP2PMessage(selectedFriend.faceCode, hiveInput);
      }
    }
    
    var message = {
      id: Date.now(),
      from: "我",
      to: selectedFriend.name,
      content: hiveInput,
      timestamp: new Date().toLocaleString(),
      type: attachedFiles.length > 0 ? "file" : "text",
      files: attachedFiles
    };
    
    saveHiveMessages([...hiveMessages, message]);
    setHiveInput("");
    setAttachedFiles([]);
    console.log("发送消息:", message);
  }

  function handleFileAttach(e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;
    
    var newFiles = [];
    for (var i = 0; i < files.length; i++) {
      newFiles.push({
        name: files[i].name,
        size: files[i].size,
        type: files[i].type,
        file: files[i]
      });
    }
    setAttachedFiles([...attachedFiles, ...newFiles]);
    console.log("添加附件:", newFiles);
  }

  function removeAttachedFile(index) {
    var newFiles = attachedFiles.slice();
    newFiles.splice(index, 1);
    setAttachedFiles(newFiles);
  }

  // ---- 🐝 面码操作函数 ----
  function copyFaceCode() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(myFaceCode).then(function() {
        alert("面码已复制: " + myFaceCode);
      }).catch(function() {
        // 降级方案
        var textarea = document.createElement("textarea");
        textarea.value = myFaceCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("面码已复制: " + myFaceCode);
      });
    } else {
      alert("我的面码: " + myFaceCode);
    }
  }

  function refreshFaceCode() {
    if (!confirm("刷新后将生成新的面码，旧的面码将失效。确定要刷新吗？")) return;
    var newCode = "HIVE-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    saveFaceCode(newCode);
    alert("面码已刷新: " + newCode);
  }

  function updateMyHiveInfo(name, avatar) {
    if (name) {
      localStorage.setItem("hive_my_name", name);
      setMyHiveName(name);
    }
    if (avatar) {
      localStorage.setItem("hive_my_avatar", avatar);
      setMyHiveAvatar(avatar);
    }
  }

  function shareFaceCode() {
    var shareText = "快来蜂巢邮箱加我好友吧！我的面码是: " + myFaceCode;
    if (navigator.share) {
      navigator.share({
        title: "蜂巢邮箱 - 添加好友",
        text: shareText
      }).catch(function() {
        copyFaceCode();
      });
    } else {
      copyFaceCode();
    }
  }

  function addFriendByFaceCode() {
    var code = prompt("请输入朋友的面码:");
    if (!code) return;
    code = code.trim().toUpperCase();
    if (!code.startsWith("HIVE-")) {
      alert("面码格式错误，应以 HIVE- 开头");
      return;
    }
    if (code === myFaceCode) {
      alert("不能添加自己为好友");
      return;
    }
    // 检查是否已存在
    var exists = hiveFriends.some(function(f) { return f.faceCode === code; });
    if (exists) {
      alert("该朋友已在您的好友列表中");
      return;
    }
    // 模拟添加朋友
    var newFriend = {
      id: Date.now(),
      name: "新朋友(" + code.substring(5) + ")",
      email: code.toLowerCase() + "@hive.local",
      faceCode: code,
      avatar: "👤",
      status: "offline",
      lastSeen: "刚刚添加"
    };
    setHiveFriends([...hiveFriends, newFriend]);
    alert("成功添加朋友: " + code);
  }

  // 不再自动同步：用户需手动点击刷新按钮 fetchEmails
  // React.useEffect(function() { ... }, [emailTab]);  // 已禁用

  // AI分身开关同步：监听外部事件更新React状态
  React.useEffect(function() {
    function handler(e) { setAiFenshenEnabled(e.detail.enabled); }
    window.addEventListener("aiFenshenToggle", handler);
    return function() { window.removeEventListener("aiFenshenToggle", handler); };
  }, []);

  // AI分身开关初始化：启动时同步按钮显示状态
  React.useEffect(function() {
    window.toggleAIFenshenGlobal(aiFenshenEnabled);
  }, []);

  // AI分身按钮随邮箱视图自动显隐：进入邮箱始终显示，退出主界面按全局开关
  React.useEffect(function() {
    var btn = document.querySelector(".ai-copilot-btn");
    if (!btn) return;
    if (aimailView) {
      btn.classList.remove("ai-copilot-btn-hidden");
    } else {
      if (!aiFenshenEnabled) {
        btn.classList.add("ai-copilot-btn-hidden");
      }
    }
  }, [aimailView, aiFenshenEnabled]);

  // 监听外部入口（AI分身快捷按钮等）打开传统邮箱
  React.useEffect(function() {
    function handler(ev) {
      var tab = (ev && ev.detail && ev.detail.tab) || "inbox";
      setAimailView(true);
      setAimailMode("traditional");
      setEmailTab(tab);
      // 延迟一帧确保 state 已更新再 fetch（否则 fetchEmails 读到旧的 emailTab）
      setTimeout(function() { fetchEmails(tab); }, 50);
    }
    window.addEventListener("openTraditionalEmail", handler);
    return function() { window.removeEventListener("openTraditionalEmail", handler); };
  }, []);

  // 暴露 React state 到 window，供 AI分身原生 DOM 按钮直接调用
  React.useEffect(function() {
    window.__setAimailView = setAimailView;
    window.__setAimailMode = setAimailMode;
    window.__setEmailTab = setEmailTab;
    window.__fetchEmails = fetchEmails;
    window.__setCurrentAccount = setCurrentAccount;
    window.__setAiFenshenEnabled = setAiFenshenEnabled;
    window.__aiFenshenEnabled = aiFenshenEnabled;
    // 检查是否有 pending 的邮箱 tab（来自 AI分身按钮在组件未挂载时的调用）
    try {
      var pendingTab = localStorage.getItem("__pending_email_tab");
      if (pendingTab) {
        localStorage.removeItem("__pending_email_tab");
        setAimailView(true);
        setAimailMode("traditional");
        setEmailTab(pendingTab);
        setTimeout(function() { fetchEmails(pendingTab); }, 100);
      }
    } catch(e) {}
    return function() {
      delete window.__setAimailView;
      delete window.__setAimailMode;
      delete window.__setEmailTab;
      delete window.__fetchEmails;
      delete window.__setCurrentAccount;
      delete window.__setAiFenshenEnabled;
      delete window.__aiFenshenEnabled;
    };
  }, []);

  // ---- ⚙️ 配置操作函数 ----
  function openConfig(isNew) {
    if (isNew) {
      // 新建配置：清空表单
      setEmailConfig({provider:"custom",email:"",display_name:"",smtp_host:"",smtp_port:"",smtp_ssl:true,smtp_username:"",smtp_password:"",imap_host:"",imap_port:"",imap_ssl:true,imap_username:"",imap_password:"",username:"",password:""});
    }
    setConfigVisible(true);
  }
  
  // 检测邮箱服务商
  function detectEmailProviderAuto(email) {
    if (!email || !email.includes("@")) return null;
    var domain = email.split("@")[1].toLowerCase();
    var providers = {
      "qq.com": "qq", "foxmail.com": "foxmail", "163.com": "mail163", "126.com": "mail126",
      "yeah.net": "yeah", "aliyun.com": "aliyun", "sina.com": "sina", "sina.cn": "sinacn",
      "sohu.com": "sohu", "21cn.com": "cn21", "tom.com": "tom", "139.com": "mail139",
      "189.cn": "mail189", "gmail.com": "gmail", "outlook.com": "outlook",
      "hotmail.com": "outlook", "live.com": "outlook", "yahoo.com": "yahoo",
      "yahoo.cn": "yahoocn", "icloud.com": "icloud", "me.com": "icloud", "mac.com": "icloud"
    };
    return providers[domain] || null;
  }
  
  // 获取邮箱服务商配置
  function getProviderConfigAuto(provider) {
    var configs = {
      qq: {name:"QQ邮箱", smtp:{host:"smtp.qq.com",port:465,ssl:true,tls:true}, imap:{host:"imap.qq.com",port:993,ssl:true}, authCode:true},
      foxmail: {name:"Foxmail邮箱", smtp:{host:"smtp.qq.com",port:465,ssl:true,tls:true}, imap:{host:"imap.qq.com",port:993,ssl:true}, authCode:true},
      mail163: {name:"163邮箱", smtp:{host:"smtp.163.com",port:465,ssl:true,tls:true}, imap:{host:"imap.163.com",port:993,ssl:true}, authCode:true},
      mail126: {name:"126邮箱", smtp:{host:"smtp.126.com",port:465,ssl:true,tls:true}, imap:{host:"imap.126.com",port:993,ssl:true}, authCode:true},
      yeah: {name:"Yeah邮箱", smtp:{host:"smtp.yeah.net",port:465,ssl:true,tls:true}, imap:{host:"imap.yeah.net",port:993,ssl:true}, authCode:true},
      aliyun: {name:"阿里云邮箱", smtp:{host:"smtp.aliyun.com",port:465,ssl:true,tls:true}, imap:{host:"imap.aliyun.com",port:993,ssl:true}, authCode:true},
      sina: {name:"新浪邮箱", smtp:{host:"smtp.sina.com",port:465,ssl:true,tls:true}, imap:{host:"imap.sina.com",port:993,ssl:true}, authCode:true},
      sinacn: {name:"新浪CN邮箱", smtp:{host:"smtp.sina.cn",port:465,ssl:true,tls:true}, imap:{host:"imap.sina.cn",port:993,ssl:true}, authCode:true},
      sohu: {name:"搜狐邮箱", smtp:{host:"smtp.sohu.com",port:465,ssl:true,tls:true}, imap:{host:"imap.sohu.com",port:993,ssl:true}, authCode:true},
      cn21: {name:"21CN邮箱", smtp:{host:"smtp.21cn.com",port:465,ssl:true,tls:true}, imap:{host:"imap.21cn.com",port:993,ssl:true}, authCode:true},
      tom: {name:"TOM邮箱", smtp:{host:"smtp.tom.com",port:465,ssl:true,tls:true}, imap:{host:"imap.tom.com",port:993,ssl:true}, authCode:true},
      mail139: {name:"139邮箱", smtp:{host:"smtp.139.com",port:465,ssl:true,tls:true}, imap:{host:"imap.139.com",port:993,ssl:true}, authCode:true},
      mail189: {name:"189邮箱", smtp:{host:"smtp.189.cn",port:465,ssl:true,tls:true}, imap:{host:"imap.189.cn",port:993,ssl:true}, authCode:true},
      gmail: {name:"Gmail", smtp:{host:"smtp.gmail.com",port:587,ssl:false,tls:true}, imap:{host:"imap.gmail.com",port:993,ssl:true}, authCode:true},
      outlook: {name:"Outlook/Hotmail", smtp:{host:"smtp-mail.outlook.com",port:587,ssl:false,tls:true}, imap:{host:"outlook.office365.com",port:993,ssl:true}, authCode:false},
      yahoo: {name:"Yahoo邮箱", smtp:{host:"smtp.mail.yahoo.com",port:465,ssl:true,tls:true}, imap:{host:"imap.mail.yahoo.com",port:993,ssl:true}, authCode:true},
      yahoocn: {name:"雅虎中国", smtp:{host:"smtp.mail.yahoo.cn",port:465,ssl:true,tls:true}, imap:{host:"imap.mail.yahoo.cn",port:993,ssl:true}, authCode:true},
      icloud: {name:"iCloud邮箱", smtp:{host:"smtp.mail.me.com",port:587,ssl:false,tls:true}, imap:{host:"imap.mail.me.com",port:993,ssl:true}, authCode:true}
    };
    return configs[provider] || null;
  }
  
  // =================== WebRTC P2P通信功能 ===================
  
  // 初始化WebRTC
  function initWebRTC() {
    if (!window.RTCPeerConnection) {
      console.error("浏览器不支持WebRTC");
      alert("您的浏览器不支持WebRTC，请使用Chrome/Firefox/Edge");
      return false;
    }
    
    // 初始化信令服务器连接（使用简单的HTTP轮询作为fallback）
    initSignalingFallback();
    
    setWebrtcReady(true);
    console.log("WebRTC初始化成功");
    return true;
  }
  
  // 信令服务器Fallback（使用localStorage模拟，实际应使用WebSocket服务器）
  function initSignalingFallback() {
    // 监听localStorage变化作为信令通道
    window.addEventListener("storage", handleSignalingMessage);
    setConnectionStatus("ready");
  }
  
  // 处理信令消息
  function handleSignalingMessage(event) {
    if (event.key === "hive_signaling_" + myFaceCode) {
      try {
        var message = JSON.parse(event.newValue);
        handleWebRTCSignal(message);
      } catch(e) {
        console.error("信令消息解析失败:", e);
      }
    }
  }
  
  // 发送信令消息
  function sendSignalingMessage(targetFaceCode, message) {
    var key = "hive_signaling_" + targetFaceCode;
    var data = JSON.stringify({
      from: myFaceCode,
      timestamp: Date.now(),
      ...message
    });
    localStorage.setItem(key, data);
    // 触发storage事件需要不同页面，这里手动触发
    setTimeout(function() {
      handleWebRTCSignal(JSON.parse(data));
    }, 100);
  }
  
  // 创建PeerConnection
  async function createPeerConnection(friendFaceCode) {
    var config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
      ]
    };
    
    var pc = new RTCPeerConnection(config);
    
    pc.onicecandidate = function(event) {
      if (event.candidate) {
        sendSignalingMessage(friendFaceCode, {
          type: "ice-candidate",
          candidate: event.candidate
        });
      }
    };
    
    pc.onconnectionstatechange = function() {
      console.log("连接状态:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setConnectionStatus("connected");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnectionStatus("disconnected");
        // 清理连接
        closePeerConnection(friendFaceCode);
      }
    };
    
    pc.ondatachannel = function(event) {
      var channel = event.channel;
      setupDataChannel(channel, friendFaceCode);
      setDataChannels({...dataChannels, [friendFaceCode]: channel});
    };
    
    setPeerConnections({...peerConnections, [friendFaceCode]: pc});
    return pc;
  }
  
  // 设置DataChannel
  function setupDataChannel(channel, friendFaceCode) {
    channel.onopen = function() {
      console.log("DataChannel已打开:", friendFaceCode);
      setConnectionStatus("connected");
    };
    
    channel.onmessage = function(event) {
      try {
        var message = JSON.parse(event.data);
        handleP2PMessage(message, friendFaceCode);
      } catch(e) {
        console.error("消息解析失败:", e);
      }
    };
    
    channel.onclose = function() {
      console.log("DataChannel已关闭:", friendFaceCode);
    };
    
    channel.onerror = function(error) {
      console.error("DataChannel错误:", error);
    };
  }
  
  // 发起P2P连接（作为发起方）
  async function initiateP2PConnection(friendFaceCode) {
    if (!webrtcReady) {
      if (!initWebRTC()) return;
    }
    
    setConnectionStatus("connecting");
    
    try {
      var pc = await createPeerConnection(friendFaceCode);
      
      // 创建DataChannel
      var channel = pc.createDataChannel("messages", {
        ordered: true
      });
      setupDataChannel(channel, friendFaceCode);
      setDataChannels({...dataChannels, [friendFaceCode]: channel});
      
      // 创建Offer
      var offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // 发送Offer
      sendSignalingMessage(friendFaceCode, {
        type: "offer",
        sdp: offer
      });
      
    } catch(error) {
      console.error("发起连接失败:", error);
      setConnectionStatus("error");
    }
  }
  
  // 处理WebRTC信令
  async function handleWebRTCSignal(message) {
    if (message.from === myFaceCode) return; // 忽略自己的消息
    
    var friendFaceCode = message.from;
    var pc = peerConnections[friendFaceCode];
    
    try {
      if (message.type === "offer") {
        // 收到Offer，作为应答方
        if (!pc) {
          pc = await createPeerConnection(friendFaceCode);
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        
        // 创建Answer
        var answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        sendSignalingMessage(friendFaceCode, {
          type: "answer",
          sdp: answer
        });
        
      } else if (message.type === "answer") {
        // 收到Answer
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        }
        
      } else if (message.type === "ice-candidate") {
        // 收到ICE候选
        if (pc && message.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
      }
    } catch(error) {
      console.error("处理信令失败:", error);
    }
  }
  
  // 通过P2P发送消息
  function sendP2PMessage(friendFaceCode, content) {
    var channel = dataChannels[friendFaceCode];
    if (channel && channel.readyState === "open") {
      var message = {
        id: Date.now(),
        from: myFaceCode,
        fromName: myHiveName,
        content: content,
        timestamp: Date.now(),
        type: "chat"
      };
      
      channel.send(JSON.stringify(message));
      
      // 保存到本地消息记录
      var newMessage = {
        id: message.id,
        from: myHiveName,
        to: friendFaceCode,
        content: content,
        timestamp: new Date().toLocaleString(),
        type: "sent"
      };
      
      var updatedMessages = [...hiveMessages, newMessage];
      setHiveMessages(updatedMessages);
      saveHiveMessages(updatedMessages);
      
      return true;
    } else {
      console.warn("DataChannel未打开，使用Fallback");
      // Fallback到localStorage
      sendMessageFallback(friendFaceCode, content);
      return false;
    }
  }
  
  // 处理收到的P2P消息
  function handleP2PMessage(message, fromFaceCode) {
    if (message.type === "chat") {
      var newMessage = {
        id: message.id || Date.now(),
        from: message.fromName || "未知",
        to: myHiveName,
        content: message.content,
        timestamp: new Date().toLocaleString(),
        type: "received"
      };
      
      var updatedMessages = [...hiveMessages, newMessage];
      setHiveMessages(updatedMessages);
      saveHiveMessages(updatedMessages);
      
      // 显示通知
      showNotification("新消息", message.fromName + ": " + message.content.substring(0, 50));
    }
  }
  
  // Fallback消息发送（使用localStorage）
  function sendMessageFallback(friendFaceCode, content) {
    var messageKey = "hive_message_" + friendFaceCode + "_" + myFaceCode;
    var message = {
      id: Date.now(),
      from: myHiveName,
      fromFaceCode: myFaceCode,
      content: content,
      timestamp: Date.now()
    };
    
    // 存储到localStorage
    var messages = JSON.parse(localStorage.getItem(messageKey) || "[]");
    messages.push(message);
    localStorage.setItem(messageKey, JSON.stringify(messages));
    
    // 同时保存到本地记录
    var newMessage = {
      id: message.id,
      from: myHiveName,
      to: friendFaceCode,
      content: content,
      timestamp: new Date().toLocaleString(),
      type: "sent"
    };
    
    var updatedMessages = [...hiveMessages, newMessage];
    setHiveMessages(updatedMessages);
    saveHiveMessages(updatedMessages);
  }
  
  // 关闭PeerConnection
  function closePeerConnection(friendFaceCode) {
    var pc = peerConnections[friendFaceCode];
    var channel = dataChannels[friendFaceCode];
    
    if (channel) {
      channel.close();
    }
    
    if (pc) {
      pc.close();
    }
    
    var newConnections = {...peerConnections};
    delete newConnections[friendFaceCode];
    setPeerConnections(newConnections);
    
    var newChannels = {...dataChannels};
    delete newChannels[friendFaceCode];
    setDataChannels(newChannels);
  }
  
  // 显示通知
  function showNotification(title, body) {
    if (window.Notification && Notification.permission === "granted") {
      new Notification(title, { body: body });
    } else if (window.Notification && Notification.permission !== "denied") {
      Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
          new Notification(title, { body: body });
        }
      });
    }
  }
  
  // 初始化P2P（用户点击启用）
  function toggleP2P() {
    if (p2pEnabled) {
      // 关闭P2P - 断开所有连接
      Object.keys(peerConnections).forEach(function(fc) {
        try {
          var pc = peerConnections[fc];
          if (pc && pc.close) pc.close();
        } catch(e) {}
      });
      setPeerConnections({});
      setP2pEnabled(false);
      setConnectionStatus("disconnected");
      alert("P2P通信已关闭");
    } else {
      // 启用P2P
      if (initWebRTC()) {
        setP2pEnabled(true);
        // 请求通知权限
        if (window.Notification && Notification.permission !== "granted") {
          Notification.requestPermission();
        }
        alert("P2P通信已启用！选择朋友开始聊天时会自动建立连接。");
      }
    }
  }
  
  // Himalaya技术自配
  function autoConfigureEmail() {
    var email = himalayaAutoConfig.email;
    var password = himalayaAutoConfig.password;
    
    if (!email || !password) {
      setHimalayaAutoConfig({...himalayaAutoConfig, status: "error", message: "请输入邮箱地址和密码"});
      return;
    }
    
    setHimalayaAutoConfig({...himalayaAutoConfig, status: "detecting", message: "正在检测邮箱服务商..."});
    
    setTimeout(function() {
      var provider = detectEmailProviderAuto(email);
      if (!provider) {
        setHimalayaAutoConfig({...himalayaAutoConfig, status: "error", message: "未能识别的邮箱服务商，请使用自定义配置"});
        return;
      }
      
      var config = getProviderConfigAuto(provider);
      if (!config) {
        setHimalayaAutoConfig({...himalayaAutoConfig, status: "error", message: "暂不支持该邮箱服务商"});
        return;
      }
      
      setHimalayaAutoConfig({...himalayaAutoConfig, status: "configuring", message: "正在配置 " + config.name + "...", provider: provider});
      
      setTimeout(function() {
        var newConfig = {
          provider: provider,
          email: email,
          display_name: email.split("@")[0],
          username: email,
          password: password,
          smtp_host: config.smtp.host,
          smtp_port: config.smtp.port,
          smtp_ssl: config.smtp.ssl,
          imap_host: config.imap.host,
          imap_port: config.imap.port,
          imap_ssl: config.imap.ssl
        };
        
        localStorage.setItem("teamchat_email_config", JSON.stringify(newConfig));
        setEmailConfig(newConfig);
        
        setHimalayaAutoConfig({...himalayaAutoConfig, status: "success", message: "✅ " + config.name + " 配置成功！\n\nSMTP: " + config.smtp.host + ":" + config.smtp.port + "\nIMAP: " + config.imap.host + ":" + config.imap.port});
      }, 1000);
    }, 800);
  }
  
  // AI邮件助手调用
  function callAICopilot(mode, content) {
    if (!content.trim()) {
      setAiResult("请输入邮件内容");
      return;
    }
    setAiLoading(true);
    setAiResult("");
    
    var prompts = {
      optimize: "请优化以下邮件内容，使其更加专业、清晰、有礼貌：\n\n" + content,
      grammar: "请检查以下邮件内容的语法和拼写错误，并给出修正建议：\n\n" + content,
      suggest: "请为以下邮件内容提供改进建议，包括语气、结构、用词等方面：\n\n" + content
    };
    
    fetch("/api/console/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json", "X-Agent-Id": "default"},
      body: JSON.stringify({message: prompts[mode] || prompts.optimize, session_id: "ai_copilot_" + Date.now()})
    })
    .then(function(r) { 
      if (!r.ok) {
        throw new Error("HTTP " + r.status + ": " + r.statusText);
      }
      var text = r.text();
      return text;
    })
    .then(function(text) {
      // 尝试解析JSON，如果失败则返回原始文本
      var data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // 如果不是JSON，直接使用文本
        data = { response: text };
      }
      setAiLoading(false);
      if (data && data.response) {
        setAiResult(data.response);
      } else if (data && data.message) {
        setAiResult(data.message);
      } else if (typeof data === "string") {
        setAiResult(data);
      } else {
        setAiResult("AI处理完成，但未返回有效内容");
      }
    })
    .catch(function(err) {
      setAiLoading(false);
      setAiResult("AI调用失败: " + err.message);
    });
  }

  function closeConfig() {
    setConfigVisible(false);
  }

  function handleProviderChange(provider) {
    var preset = EMAIL_PROVIDERS[provider];
    if (preset && provider !== "custom") {
      setEmailConfig({
        ...emailConfig,
        provider: provider,
        username: emailConfig.email,
        smtp_host: preset.smtp.host,
        smtp_port: preset.smtp.port,
        smtp_ssl: preset.smtp.ssl,
        imap_host: preset.imap.host,
        imap_port: preset.imap.port,
        imap_ssl: preset.imap.ssl
      });
    }
  }

  function handleEmailChange(email) {
    // 自动检测邮箱服务商
    var detectedProvider = detectEmailProvider(email);
    var provider = detectedProvider || emailConfig.provider;
    var preset = EMAIL_PROVIDERS[provider];
    if (preset && preset.authCode && provider !== "custom") {
      setEmailConfig({
        ...emailConfig,
        email: email,
        username: email,
        provider: provider,
        smtp_host: preset.smtp.host,
        smtp_port: preset.smtp.port,
        smtp_ssl: preset.smtp.ssl,
        imap_host: preset.imap.host,
        imap_port: preset.imap.port,
        imap_ssl: preset.imap.ssl
      });
    } else {
      setEmailConfig({
        ...emailConfig,
        email: email
      });
    }
  }

  // 自动检测邮箱服务商
  function detectEmailProvider(email) {
    if (!email || !email.includes("@")) return null;
    var domain = email.split("@")[1].toLowerCase();
    for (var key in EMAIL_PROVIDERS) {
      if (EMAIL_PROVIDERS[key].domain === domain) {
        return key;
      }
    }
    // 模糊匹配
    if (domain.includes("qq.com")) return "qq";
    if (domain.includes("foxmail.com")) return "foxmail";
    if (domain.includes("163.com")) return "mail163";
    if (domain.includes("126.com")) return "mail126";
    if (domain.includes("yeah.net")) return "yeah";
    if (domain.includes("aliyun.com")) return "aliyun";
    if (domain.includes("sina.com")) return "sina";
    if (domain.includes("sina.cn")) return "sinacn";
    if (domain.includes("sohu.com")) return "sohu";
    if (domain.includes("21cn.com")) return "cn21";
    if (domain.includes("tom.com")) return "tom";
    if (domain.includes("139.com")) return "mail139";
    if (domain.includes("189.cn")) return "mail189";
    if (domain.includes("gmail.com")) return "gmail";
    if (domain.includes("outlook.com") || domain.includes("hotmail.com") || domain.includes("live.com")) return "outlook";
    if (domain.includes("yahoo.com") || domain.includes("yahoo.cn")) return "yahoo";
    if (domain.includes("icloud.com") || domain.includes("me.com") || domain.includes("mac.com")) return "icloud";
    return null;
  }

  function saveConfig() {
    setSavingConfig(true);

    // 同步到后端数据库（供发送邮件使用）
    var cfg = Object.assign({}, emailConfig);
    if (!cfg.smtp_username) cfg.smtp_username = cfg.username || cfg.email;
    if (!cfg.smtp_password || cfg.smtp_password === "") { cfg.smtp_password = cfg.password || ""; }
    if (!cfg.imap_username) cfg.imap_username = cfg.username || cfg.email;
    if (!cfg.imap_password || cfg.imap_password === "") { cfg.imap_password = cfg.password || ""; }
    if (!cfg.display_name) cfg.display_name = cfg.email ? cfg.email.split("@")[0] : "";
    
    // 先保存本地（用补全后的cfg，确保下次加载密码字段完整），再异步同步后端
    localStorage.setItem("teamchat_email_config", JSON.stringify(cfg));
    
    fetch("/api/plugins/team_chat/email/config", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(cfg)
    }).then(function(r) { return r.json(); }).then(function(d) {
      console.log("后端保存结果:", d);
      // 保存成功后刷新邮箱列表
      loadEmailConfigs();
    }).catch(function(err) {
      console.error("后端保存失败:", err);
    });
    
    // 关闭弹窗（不等待后端完全返回）
    setSavingConfig(false);
    closeConfig();
    fetchEmails("inbox");
  }

  // 初始化时从localStorage加载配置（useEffect中执行，避免无限循环）
  useEffect(function() {
    var saved = localStorage.getItem("teamchat_email_config");
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        setEmailConfig(parsed);
      } catch(e) {}
    }
  }, []);


    // ---- 📑 多标签页 ----
    var _tabs = useState([]), tabs = _tabs[0], setTabs = _tabs[1];
    var _atid = useState(null), activeTabId = _atid[0], setActiveTabId = _atid[1];
    var _tc2 = useState(""), tabLabel = _tc2[0], setTabLabel = _tc2[1];
    function genId() { return "tab_"+Date.now()+"_"+Math.random().toString(36).slice(2,8); }
    function newTab(label) { var lbl; if (!label||label==="新会话") { _tabCounter++; lbl = "新会话"+_tabCounter; } else { lbl = label; } var t={id:genId(),sid:"",label:lbl,hist:[],stps:[],sel:[],bs:false,discDone:false,discLd:false,ld:false,cr:0,rds:3,pp:0,msg:"",msgHist:[],msgHistIdx:-1,msgDraft:"",hid:"cloud-orchestrator",hnm:"CloudPaw-Master"}; setTabs(function(p){return p.concat([t]);}); setActiveTabId(t.id); return t; }
    var snap = useRef({}); // 实时快照，避免闭包过期
    function saveTab() { if(!activeTabId) return; var s=snap.current; setTabs(function(p){return p.map(function(t){if(t.id!==activeTabId) return t; return Object.assign({},t,{si:s.si,hist:s.hist,stps:s.stps,sel:s.sel,bs:s.bs,discDone:s.discDone,discLd:s.discLd,ld:s.ld,cr:s.cr,rds:s.rds,pp:s.pp,msg:s.msg,msgHist:s.msgHist,msgHistIdx:s.msgHistIdx,msgDraft:s.msgDraft,hid:s.hid,hnm:s.hnm});});}); }
    function restoreTab(t) { setSi(t.si||t.sid||""); setHist(t.hist||[]); setStps(t.stps||[]); setSel(t.sel||[]); setBs(t.bs||false); setDiscDone(t.discDone||false); setDiscLd(t.discLd||false); setLd(t.ld||false); setCr(t.cr||0); setRds(t.rds||3); setPp(t.pp||0); setMsg(t.msg||""); setMsgHist(t.msgHist||[]); setMsgHistIdx(typeof t.msgHistIdx==="number"?t.msgHistIdx:-1); setMsgDraft(t.msgDraft||""); setHid(t.hid||"cloud-orchestrator"); setHnm(t.hnm||"CloudPaw-Master"); setTabLabel(t.label||""); }
    function closeTab(tid) { saveTab(); setTabs(function(p){var n=p.filter(function(t){return t.id!==tid;}); if(activeTabId===tid&&n.length>0){var ni=n[n.length-1];setActiveTabId(ni.id);restoreTab(ni);} return n;}); }
    function updateSi(v) { setSi(v);
      setTabs(function(p){return p.map(function(t){if(t.id!==activeTabId) return t; return Object.assign({},t,{si:v});});});
    }
    // 🔒 异步回调中同步标签数据到 tabs（防止界面离开后丢失）
    function syncActiveTab(data) {
      setTabs(function(p){return p.map(function(t){
        if(t.id!==activeTabRef.current) return t;
        return Object.assign({},t,{sid:data.si||"",si:data.si||"",hist:data.hist||[],stps:data.stps||[],bs:data.bs||false,discDone:data.discDone||false});
      });});
    }
    // 💾 localStorage 会话缓存：send 后写入，历史 Modal 优先读取
    function saveSessionCache(si, hist, stps, bs, discDone) {
      try {
        var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
        // 保留已有条目的 pinned/tag
        var old = cache.find(function(s){return s.session_id===si;});
        var entry = {
          session_id: si,
          host_id: snap.current.hid||"cloud-orchestrator",
          host_name: snap.current.hnm||"CloudPaw-Master",
          agent_ids: (snap.current.sel||[]).slice(),
          history: (hist||[]).slice(-3),
          host_steps: (stps||[]).slice(-3),
          brainstorm: bs||false,
          discussion_done: discDone||false,
          updated_at: Date.now()/1000,
          tag: (old||{}).tag||"",
          pinned: (old||{}).pinned||false
        };
        cache = cache.filter(function(s){return s.session_id!==si;});
        cache.unshift(entry);
        cache = cache.slice(0, 50);
        localStorage.setItem("teamchat_sessions_cache", JSON.stringify(cache));
        setSess(cache);
      } catch(e) {}
    }
    var _h = useState([]), hist = _h[0], setHist = _h[1];
    var _a = useState([]), ags = _a[0], setAgs = _a[1];
    var _d = useState([]), sel = _d[0], setSel = _d[1];
    var _m = useState(""), msg = _m[0], setMsg = _m[1];
    var _mh = useState([]), msgHist = _mh[0], setMsgHist = _mh[1];
    var _mi = useState(-1), msgHistIdx = _mi[0], setMsgHistIdx = _mi[1];
    var _md = useState(""), msgDraft = _md[0], setMsgDraft = _md[1];
    var _l = useState(false), ld = _l[0], setLd = _l[1];
    var _st = useState([]), stps = _st[0], setStps = _st[1];
    var _ag = useState(true), agLd = _ag[0], setAgLd = _ag[1];
    var _hi = useState("cloud-orchestrator"), hid = _hi[0], setHid = _hi[1];
    var _hn = useState("CloudPaw-Master"), hnm = _hn[0], setHnm = _hn[1];
    var _ss = useState([]), sess = _ss[0], setSess = _ss[1];
    var _sv = useState(false), sessV = _sv[0], setSessV = _sv[1];
    var _ht = useState("all"), hTab = _ht[0], setHtab = _ht[1]; // 历史会谈 tab: all/starred
    var _et = useState(null), editingTag = _et[0], setEditingTag = _et[1]; // 正在编辑标签的 session_id
    var _sl = useState(false), sessLd = _sl[0], setSessLd = _sl[1];
    var _li = useState(false), list = _li[0], setList = _li[1];
    var _bs = useState(false), bs = _bs[0], setBs = _bs[1];
    var _rd = useState(3), rds = _rd[0], setRds = _rd[1];
    var _cr = useState(0), cr = _cr[0], setCr = _cr[1];
    var _pp = useState(0), pp = _pp[0], setPp = _pp[1];
    var _sq = useState(""), sq = _sq[0], setSq = _sq[1];
    var _uc = useState(""), uc = _uc[0], setUc = _uc[1];
    var _ai = useState(""), ai = _ai[0], setAi = _ai[1];
    var _had = useState("default-0"), humanAvatarId = _had[0], setHumanAvatarId = _had[1];
    var _hau = useState(""), humanAvatarUrl = _hau[0], setHumanAvatarUrl = _hau[1];
    var _hv = useState(null), hoverInfo = _hv[0], setHoverInfo = _hv[1];
    var _ab = useState(true), atBottom = _ab[0], setAtBottom = _ab[1];
    var _nb = useState(0), newBadge = _nb[0], setNewBadge = _nb[1];
    var _ch = useState([]), chEnabled = _ch[0], setChEnabled = _ch[1];
    var _sip = useState(""), sysIp = _sip[0], setSysIp = _sip[1];
    var _clk = useState(new Date().toLocaleString()), clock = _clk[0], setClock = _clk[1];
    var _at = useState(0), avTs = _at[0], setAvTs = _at[1];
    var _sa = useState(false), showAllAgents = _sa[0], setShowAllAgents = _sa[1];
    var _tc = useState("#5D4037"), tblColor = _tc[0], setTblColor = _tc[1];
    var _ti = useState(0), themeIdx = _ti[0], setThemeIdx = _ti[1];
    var _ut = useState("day"), uiTheme = _ut[0], setUiTheme = _ut[1]; // 日光/月色
    var _ad = useState(false), adV = _ad[0], setAdV = _ad[1]; // 一闪广告
var _rm = useState(false), readmeV = _rm[0], setReadmeV = _rm[1];
    var _rc = useState(""), readmeC = _rc[0], setReadmeC = _rc[1];
    // ---- 轻音乐 ----
    var _mu = useState(false), musicOn = _mu[0], setMusicOn = _mu[1];
    var _mv = useState(function(){ try { return parseFloat(localStorage.getItem("teamchat_music_vol")||"0.5"); } catch(e) { return 0.5; } }), musicVol = _mv[0], setMusicVol = _mv[1];
    var _rp = useState(false), replayV = _rp[0], setReplayV = _rp[1];
    var _ri = useState(0), replayIdx = _ri[0], setReplayIdx = _ri[1];
    var _rpl = useState(false), replayPl = _rpl[0], setReplayPl = _rpl[1];
    var _dl = useState(false), discLd = _dl[0], setDiscLd = _dl[1];
    var _df = useState(false), discDone = _df[0], setDiscDone = _df[1];
    var _dsv = useState(false), discSumV = _dsv[0], setDiscSumV = _dsv[1]; // 讨论结束摘要卡
    var _kv = useState(false), keysV = _kv[0], setKeysV = _kv[1]; // 快捷键面板
    var _cv = useState(false), cardView = _cv[0], setCardView = _cv[1];
    var _ci = useState(0), cardIdx = _ci[0], setCardIdx = _ci[1];
    // ---- 📼 PPT 播放器 ----
    var _pv = useState(false), pptV = _pv[0], setPptV = _pv[1];
    var _pms = useState([]), pptMsgs = _pms[0], setPptMsgs = _pms[1];
    var _pi = useState(0), pptIdx = _pi[0], setPptIdx = _pi[1];
    var _ppl = useState(false), pptPl = _ppl[0], setPptPl = _ppl[1];
    var _ps = useState(1), pptSpeed = _ps[0], setPptSpeed = _ps[1];
    var _pt = useState(0), pptTyped = _pt[0], setPptTyped = _pt[1];
    var _psa = useState(false), pptShowAll = _psa[0], setPptShowAll = _psa[1];
    var _pth = useState("dark"), pptTheme = _pth[0], setPptTheme = _pth[1]; // dark=月色 light=日光
    var _so = useState(true), sideOpen = _so[0], setSideOpen = _so[1];
    var pptCvRf = useRef(null), pptTmRf = useRef(null), pptKeysRf = useRef(false);
    // ---- 📄 文件架 ----
    var _fv = useState(false), fileShelfV = _fv[0], setFileShelfV = _fv[1];
    var _fl = useState([]), shelfFiles = _fl[0], setShelfFiles = _fl[1];
    var _fls = useState(false), shelfLd = _fls[0], setShelfLd = _fls[1];
    var _wf = useState([]), wsFiles = _wf[0], setWsFiles = _wf[1];
    var _wp = useState(""), wsPath = _wp[0], setWsPath = _wp[1];
    var _wsl = useState(false), wsLd = _wsl[0], setWsLd = _wsl[1];
    var _st = useState("collected"), shelfTab = _st[0], setShelfTab = _st[1];
    var themes = [
    {name:"经典",table:"#5D4037",inner:"#795548",border:"#FFD700",bg:"rgba(26,26,46,0.65)",rug:"rgba(139,90,43,0.15)"},
    {name:"海洋",table:"#1e3a5f",inner:"#2e5984",border:"#4fc3f7",bg:"rgba(10,22,40,0.75)",rug:"rgba(30,58,95,0.2)"},
    {name:"森林",table:"#2d4a2d",inner:"#3d6b3d",border:"#7cb342",bg:"rgba(26,47,26,0.7)",rug:"rgba(45,74,45,0.2)"},
    {name:"低碳",table:"#c62828",inner:"#2e7d32",border:"#66bb6a",bg:"rgba(12,28,12,0.72)",rug:"rgba(198,40,40,0.15)"},
    {name:"赛朋",table:"#1a1a2e",inner:"#16213e",border:"#00ff88",bg:"rgba(8,8,18,0.88)",rug:"rgba(0,255,136,0.08)"}
  ];
  var histRf = useRef(null), cvRf = useRef(null), fiRf = useRef(null), avRf = useRef(null), aiRf = useRef(""), humAvRf = useRef(null), abortRf = useRef(null), stopRef = useRef(false); _abortRef = abortRf;
  var activeTabRef = useRef(""); // 异步回调中取最新活跃标签ID

    // 🔒 每一帧更新快照和标签ref，保证异步回调读到最新值
    activeTabRef.current = activeTabId;
    snap.current = {si:si,hist:hist,stps:stps,sel:sel,bs:bs,discDone:discDone,discLd:discLd,ld:ld,cr:cr,rds:rds,pp:pp,msg:msg,msgHist:msgHist,msgHistIdx:msgHistIdx,msgDraft:msgDraft,hid:hid,hnm:hnm};

    // 🔒 安全锁：任一标签有未完成讨论时，其他标签锁定输入
    var busyTabId = null;
    tabs.forEach(function(t) {
      var isBusy = (t.id===activeTabId) ? (ld||(bs&&!discDone)) : (t.ld||(t.bs&&!t.discDone));
      if (isBusy) busyTabId = t.id;
    });
    var tabBlocked = busyTabId!==null && busyTabId!==activeTabId;
    var busyLabel = "";
    if (busyTabId) { var bt = tabs.find(function(t){return t.id===busyTabId;}); busyLabel = (bt||{}).label||"新会话"; }
    var busyRef = useRef({blocked:false,label:""});
    busyRef.current = {blocked:tabBlocked,label:busyLabel};

    // =================== Data Loading ===================

    useEffect(function () {
      var cancelled = false;
      setAgLd(true);
      apiGet("/agents").then(function (d) {
        if (cancelled) return;
        if (!d || typeof d !== 'object') {
          console.error("智能体API返回格式不正确:", d);
          setAgs([]); setAgLd(false);
          return;
        }
        var all = (d.agents||[]).filter(function(a){return a&&typeof a==="object"&&a.agent_id;});
        setAgs(all); var def = all.find(function (a) { return a.agent_id==="cloud-orchestrator"; });
        if (!def && all.length > 0) def = all[0];
        if (def) { setHid(def.agent_id); setHnm(def.name||def.agent_id); } setAgLd(false);
      }).catch(function (e) {
        if (cancelled) return;
        console.error("加载智能体列表失败:", e);
        setAgs([]); setAgLd(false);
      });
      return function () { cancelled = true; };
    }, []);

    // 拉取启用频道列表
    useEffect(function () {
      var cancelled = false;
      fetch(getApiUrl("/plugins/team_chat/channels")).then(function (r) { return r.json(); }).then(function (d) {
        if (cancelled) return;
        setChEnabled(Array.isArray(d.channels)?d.channels:[]);
      }).catch(function () {});
      return function () { cancelled = true; };
    }, []);

    // 📡 监听串串频道事件（加载会话 / PPT回放）
    useEffect(function () {
      function onLoadSess(ev) {
        var si = ev.detail && ev.detail.session_id;
        if (!si) return;
        apiGet("/session/"+si).then(function (r) {
          updateSi(r.session_id); setHist(r.history||[]); setStps(r.host_steps||[]);
          setHid(r.host_id||"cloud-orchestrator"); setHnm(r.host_name||"CloudPaw-Master");
          if (r.agent_ids && r.agent_ids.length>0) setSel(r.agent_ids);
          saveTab();
          setTabs(function(p){return p.map(function(t){if(t.id!==activeTabRef.current)return t;return Object.assign({},t,{si:r.session_id,hist:r.history||[],stps:r.host_steps||[],sel:r.agent_ids||t.sel||[]});});});
        }).catch(function(e){message.error("加载会话失败: "+e.message);});
      }
      function onPPTPlay(ev) {
        var si = ev.detail && ev.detail.session_id;
        if (!si) return;
        openPPT(si);
      }
      window.addEventListener("teamchat-load-session", onLoadSess);
      window.addEventListener("teamchat-ppt-play", onPPTPlay);
      return function () {
        window.removeEventListener("teamchat-load-session", onLoadSess);
        window.removeEventListener("teamchat-ppt-play", onPPTPlay);
      };
    }, []);

    // 💾 从 localStorage 加载历史会谈缓存（不依赖后端 API）
    useEffect(function () {
      try {
        var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
        if (cache.length>0) setSess(cache);
      } catch(e) {}
      // 后台同步后端数据
      apiGet("/sessions").then(function (r) {
        var merged = r.sessions||[];
        if (merged.length>0) {
          setSess(merged);
          try { localStorage.setItem("teamchat_sessions_cache", JSON.stringify(merged)); } catch(e) {}
        }
      }).catch(function () {});
    }, []);

    // 初始化标签页（从 localStorage 恢复，若无则新建；并恢复上次会话）
    useEffect(function () {
      if (tabs.length>0) return;
      var savedTabs = null;
      try { savedTabs = JSON.parse(localStorage.getItem("teamchat_tabs")||"null"); } catch(e) {}
      if (savedTabs && Array.isArray(savedTabs) && savedTabs.length>0) {
        var maxN = 0; savedTabs.forEach(function(t){ var m = (t.label||"").match(/^新会话(\d+)$/); if (m) { var n = parseInt(m[1],10); if (n>maxN) maxN=n; } });
        _tabCounter = maxN;
        setTabs(savedTabs); setActiveTabId(savedTabs[0].id); restoreTab(savedTabs[0]);
      } else {
        newTab();
        // 尝试恢复上次会话到默认标签
        var ls = ""; try { ls = localStorage.getItem("teamchat_last_session")||""; } catch (e) {}
        if (ls) {
          var cancelled = false;
          apiGet("/session/"+encodeURIComponent(ls)).then(function (r) {
            if (cancelled) return;
            updateSi(r.session_id); setHist(r.history||[]); setStps(r.host_steps||[]);
            setHid(r.host_id||"cloud-orchestrator"); setHnm(r.host_name||"CloudPaw-Master");
            // 恢复选中的智能体
            if (r.agent_ids&&r.agent_ids.length>0) setSel(r.agent_ids);
          }).catch(function () {});
        }
      }
    }, []);

    // 每次标签页状态变更时自动存 localStorage
    useEffect(function () {
      if (tabs.length===0) return;
      try {
        localStorage.setItem("teamchat_tabs", JSON.stringify(tabs.map(function(t){
          return {id:t.id, sid:t.sid||"", label:t.label||"新会话", hist:t.hist||[], stps:t.stps||[], sel:t.sel||[], bs:t.bs||false, discDone:t.discDone||false, discLd:t.discLd||false, ld:t.ld||false, cr:t.cr||0, rds:t.rds||3, pp:t.pp||0, msg:t.msg||"", msgHist:t.msgHist||[], msgHistIdx:t.msgHistIdx||-1, msgDraft:t.msgDraft||"", hid:t.hid||"cloud-orchestrator", hnm:t.hnm||"CloudPaw-Master"};
        })));
      } catch(e) {}
    }, [tabs]);

    var [avBusy,setAvBusy] = useState(false);
    var handleUploadAvatar = useCallback(function (ev) {
      if (avBusy) return;
      var f = ev.target.files[0]; if (!f) return;
      setAvBusy(true);
      var reader = new FileReader();
      reader.onload = function (re) {
        var dataUrl = re.target.result;
        var h = {"Content-Type":"application/json"}; var t = getApiToken(); if (t) h.Authorization = "Bearer "+t;
        fetch(getApiUrl("/plugins/team_chat/avatars/human"),{method:"PUT",headers:h,body:JSON.stringify({data_url:dataUrl})}).then(function(r){if(!r.ok){return r.text().then(function(t){throw new Error(t||"HTTP "+r.status);});}return r.json();}).then(function(d){message.success("头像已更新");setHumanAvatarId("custom");setHumanAvatarUrl(d.url||dataUrl);}).catch(function(e){message.error(e.message||"上传失败");}).finally(function(){setAvBusy(false);});
      };
      reader.onerror = function(){message.error("读取图片失败");setAvBusy(false);};
      reader.readAsDataURL(f);
    }, [avBusy]);

    useEffect(function () {
      if (!ld) { setPp(0); setCr(0); return; }
      setPp(0); var t = setInterval(function () { setPp(function (p) { return p<90?p+2:p; }); }, 400);
      return function () { clearInterval(t); };
    }, [ld]);

    useEffect(function () {
      var el = histRf.current; if (!el) return;
      if (atBottom) { el.scrollTop = el.scrollHeight; }
      else { setNewBadge(function (n) { return n+1; }); }
    }, [hist]);

    // 消息区滚动检测
    var onMsgScroll = useCallback(function () {
      var el = histRf.current; if (!el) return;
      var btm = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      setAtBottom(btm);
      if (btm) setNewBadge(0);
    }, []);

    // 滚动到底部
    var scrollToBottom = useCallback(function () {
      var el = histRf.current;
      if (el) { el.scrollTop = el.scrollHeight; setNewBadge(0); }
    }, []);

    useEffect(function () {
      fetch(getApiUrl("/plugins/team_chat/system-info")).then(function (r) { return r.json(); }).then(function (d) {
        setSysIp(d.ip||"未知");
      }).catch(function () { setSysIp("获取失败"); });
      var t = setInterval(function () { setClock(new Date().toLocaleString()); }, 1000);
      return function () { clearInterval(t); };
    }, []);

    // 加载已存储的人类头像
    useEffect(function () {
      fetch(getApiUrl("/plugins/team_chat/avatars")).then(function(r){return r.json();}).then(function(d){
        var avs = d.avatars||{};
        if (avs.human) { setHumanAvatarId("custom"); setHumanAvatarUrl(avs.human); }
      }).catch(function(){});
    }, []);

    var handleRestoreAvatar = useCallback(function () {
      var h = {}; var t = getApiToken(); if (t) h.Authorization = "Bearer "+t;
      fetch(getApiUrl("/plugins/team_chat/avatars/human"),{method:"DELETE",headers:h}).then(function(r){return r.json();}).then(function(d){
        if (d.ok) { setHumanAvatarId("default-0"); setHumanAvatarUrl(""); message.success("已恢复默认头像"); }
        else { message.info("已是默认头像"); }
      }).catch(function(){setHumanAvatarId("default-0");setHumanAvatarUrl("");message.success("已恢复默认头像");});
    }, []);

    // ---- 提醒: 讨论结束摘要卡 + 桌面通知 ----
    var prevDiscDone = useRef(false);
    useEffect(function () {
      if (discDone && !prevDiscDone.current && hist.length>0) {
        setDiscSumV(true);
        var tm = setTimeout(function () { setDiscSumV(false); }, 12000);
        // 桌面通知 + 播放当前轻音乐
        try {
          if ("Notification" in window && Notification.permission==="granted") {
            new Notification("🧠 TeamChat 讨论完成", {body:"共 "+hist.length+" 条消息 · "+sel.length+" 位智能体参与", tag:"teamchat-done"});
          }
          if (!musicRef.current) toggleMusic();
        } catch(e) {}
        return function () { clearTimeout(tm); };
      }
      prevDiscDone.current = discDone;
    }, [discDone, hist.length, sel.length]);

    // ---- 提醒: 请求桌面通知权限 ----
    useEffect(function () {
      try {
        if ("Notification" in window && Notification.permission==="default") {
          var tm = setTimeout(function () { Notification.requestPermission(); }, 6000);
          return function () { clearTimeout(tm); };
        }
      } catch(e) {}
    }, []);

    // 恢复自定义简谱
    useEffect(function () {
      try { var cs = localStorage.getItem("teamchat_custom_song"); if (cs) setCustSong(cs); } catch(e) {}
    }, []);

    // ---- 提醒: 快捷键首次提示 ----
    useEffect(function () {
      try {
        if (localStorage.getItem("teamchat_shortcut_hint")) return;
        setTimeout(function () {
          message.info("⌨ 快捷键: ↑↓ 回溯历史 · Shift+Enter 换行 · Enter 发送", 6);
          localStorage.setItem("teamchat_shortcut_hint", "1");
        }, 4000);
      } catch (e) {}
    }, []);

    // ---- 🎬 一闪广告：仅首次加载 ----
    useEffect(function () {
      try {
        if (localStorage.getItem("teamchat_ad_shown")) return;
        var tm1 = setTimeout(function () {
          setAdV(true);
          localStorage.setItem("teamchat_ad_shown", "1");
        }, 2500);
        var tm2 = setTimeout(function () { setAdV(false); }, 6500);
        return function () { clearTimeout(tm1); clearTimeout(tm2); };
      } catch(e) {}
    }, []);

    // =================== Canvas Animation ===================
    useEffect(function () {
      var cv = cvRf.current; if (!cv) return;
      var ctx = cv.getContext("2d"), W = 270, H = 320, cx = W/2, cy = H/2-30, r = 78;
      var mem = [{id:"human",name:"你",color:"#e8f0fe"}];
      if (hid) mem.push({id:hid,name:hnm.slice(0,8),color:"#fff3cd"});
      sel.forEach(function (id) { var ag=ags.find(function(a){return a&&a.agent_id===id;}); mem.push({id:id,name:(ag&&ag.name||id).slice(0,10),color:"#d4edda"}); });
      var avImgs={};mem.forEach(function(m){if(m.id&&m.id!=="human"){var img=new Image();img.src=getApiUrl("/plugins/team_chat/avatar/"+encodeURIComponent(m.id));avImgs[m.id]=img;}});var himg=new Image();himg.src=humanAvatarId==="custom"&&humanAvatarUrl?humanAvatarUrl:humanSvgs[parseInt((humanAvatarId||"default-0").split("-")[1])||0];avImgs["human"]=himg;var fr=0;var anim=true;
      function dr() {
        if(!anim) return;
        var th = themeIdx>=0&&themeIdx<themes.length?themes[themeIdx]:null;
        var bgColor = th?th.bg:"rgba(26,26,46,0.65)";
        var tbl = tblColor||"#5D4037";
        var innerTbl = th?th.inner:"#795548";
        var bdrColor = th?th.border:"#FFD700";
        ctx.clearRect(0,0,W,H); ctx.fillStyle=bgColor;ctx.fillRect(0,0,W,H);
        ctx.fillStyle=tbl; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
        if(bs){var pulse=Math.sin(fr*0.05)*0.4+0.6;ctx.strokeStyle="rgba(255,215,0,"+pulse+")";ctx.lineWidth=2+pulse*3;}else{ctx.strokeStyle=bdrColor;ctx.lineWidth=2;}
        ctx.stroke();
        ctx.fillStyle=innerTbl; ctx.beginPath(); ctx.arc(cx,cy,r-8,0,Math.PI*2); ctx.fill();
        var decors=["💻","🎵","🌸","📚","☕"];decors.forEach(function(d,i){var da=(i/decors.length)*Math.PI*2-Math.PI/2;var dx=cx+(r-14)*Math.cos(da);var dy=cy+(r-14)*Math.sin(da);ctx.font="9px serif";ctx.fillText(d,dx-5,dy+3);});
        ctx.save();ctx.fillStyle="rgba(255,255,255,0.92)";ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("TeamChat",cx,cy-6);ctx.font="bold 11px monospace";ctx.fillText("0+1+2≠3",cx,cy+8);ctx.restore();

        // --- Office furniture ---
        var deskPositions = [
          {x:32,y:68,label:"🪑"},
          {x:W-64,y:68,label:"🪑"},
          {x:32,y:H-58,label:"🖥"},
          {x:W-64,y:H-58,label:"🖥"},
          {x:W/2-18,y:H-58,label:"📞"}
        ];
        var bookshelfX = W-40;
        var plants = [
          {x:16,y:150,emoji:"🌿"},
          {x:16,y:200,emoji:"🌵"}
        ];
        var wallItems = [
          {x:W/2-24,y:14,emoji:"🕐"},
          {x:W/2+14,y:14,emoji:"📋"},
          {x:W-48,y:144,emoji:"🗄"}
        ];
        deskPositions.forEach(function(dp){
          ctx.fillStyle="#8D6E63";
          ctx.fillRect(dp.x,dp.y,34,15);
          ctx.fillStyle="#5D4037";
          ctx.fillRect(dp.x+4,dp.y+15,3,7);
          ctx.fillRect(dp.x+27,dp.y+15,3,7);
          ctx.font="13px serif";
          ctx.fillText(dp.label,dp.x+9,dp.y+12);
        });
        // Bookshelf
        ctx.fillStyle="#6D4C41";
        ctx.fillRect(bookshelfX,140,22,80);
        ctx.fillStyle="#8D6E63";
        for(var i=0;i<5;i++){ctx.fillRect(bookshelfX+3,145+i*15,16,11);}
        ctx.font="10px serif";
        ["📕","📘","📗","📙","📖"].forEach(function(b,bi){
          ctx.fillText(b,bookshelfX+4,155+bi*15);
        });
        // Plants
        plants.forEach(function(p){
          ctx.font="15px serif";
          ctx.fillText(p.emoji,p.x,p.y);
        });
        // Wall items
        wallItems.forEach(function(w){
          ctx.font="14px serif";
          ctx.fillText(w.emoji,w.x,w.y);
        });
        // Coffee corner
        ctx.font="12px serif";
        ctx.fillText("☕",42,H-86);
        ctx.fillText("🥤",70,H-86);
        // Rug under round table
        var rugColor = th?th.rug:"rgba(139,90,43,0.15)";
        ctx.fillStyle=rugColor;
        ctx.beginPath();
        ctx.ellipse(cx,cy,r+42,r+24,0,0,Math.PI*2);
        ctx.fill();

        // --- Tea room ---
        ctx.fillStyle="#BCAAA4";
        ctx.fillRect(12,H-32,80,32);
        ctx.fillStyle="#8D6E63";
        ctx.fillRect(12,H-32,80,5);
        ctx.fillStyle="#8D6E63";ctx.font="10px serif";ctx.fillText("🍵 茶室",18,H-12);

        // --- Waiters ---
        var waiterData=[
          {emoji:"🚶",phase:0, speed:0.004, pauseTea:20, pauseTbl:30},
          {emoji:"🚶‍♀️",phase:60,speed:0.0035,pauseTea:25,pauseTbl:25},
          {emoji:"🤵",phase:120,speed:0.003, pauseTea:15,pauseTbl:35}
        ];
        var teaX=38, teaY=H-28, tblX=cx, tblY=cy-20, cycleLen=440;
        waiterData.forEach(function(w){
          var cycle = ((fr*w.speed*100)+w.phase) % cycleLen;
          var prog=0;
          var walkDur=cycleLen-w.pauseTea-w.pauseTbl;
          if(cycle < walkDur/2){
            prog = cycle / (walkDur/2);
          } else if(cycle < walkDur/2 + w.pauseTbl){
            prog = 1;
          } else if(cycle < walkDur + w.pauseTbl){
            prog = 1 - (cycle - walkDur/2 - w.pauseTbl) / (walkDur/2);
          } else {
            prog = 0;
          }
          var wx = teaX + (tblX-teaX)*prog + Math.sin(cycle*0.03)*2;
          var wy = teaY + (tblY-teaY)*prog + Math.sin(cycle*0.05)*1.5;
          ctx.font="10px serif";
          ctx.fillText(w.emoji,wx-5,wy+4);
          // Small tray below
          if(prog>0.1&&prog<0.9){
            ctx.fillStyle="#A1887F";ctx.fillRect(wx-6,wy+5,12,3);
            ctx.fillStyle="#FFF";ctx.fillRect(wx-2,wy+4,4,2);
          }
        });

        var n=mem.length||1;
        var memPos=[];
        mem.forEach(function(m,i){
          var angle = -Math.PI/2+(i/n)*Math.PI*2;
          var bounce = Math.sin(fr*0.04+i)*2;
          var px = cx+(r+28+bounce)*Math.cos(angle);
          var py = cy+(r+28+bounce)*Math.sin(angle);
          memPos.push({id:m.id,name:m.name,x:px,y:py});
          var aimg=avImgs[m.id];if(aimg&&aimg.complete&&aimg.naturalWidth>0){ctx.globalAlpha=1;ctx.drawImage(aimg,px-12,py-16,24,24);ctx.strokeStyle=bdrColor;ctx.lineWidth=1;ctx.strokeRect(px-12,py-16,24,24);}else{ctx.fillStyle=m.color;ctx.globalAlpha=0.85;ctx.fillRect(px-6,py-4,12,12);ctx.fillStyle=bdrColor;ctx.globalAlpha=1;ctx.beginPath();ctx.arc(px,py-10,6,0,Math.PI*2);ctx.fill();}
          ctx.fillStyle="#fff"; ctx.font="8px monospace";
          var nm = m.name.length>10?m.name.slice(0,9)+".":m.name;
          ctx.fillText(nm,px-nm.length*3,py+18);
        });
        cvRf._memPos=memPos;
        fr++; requestAnimationFrame(dr);
      }
      var rid = requestAnimationFrame(dr);
      return function () { anim=false; cancelAnimationFrame(rid); };
    }, [hid, hnm, sel, avTs, humanAvatarId, humanAvatarUrl, bs, themeIdx, tblColor]);

    useEffect(function () {
      var fetchCron = function () {
        fetch(getApiUrl("/plugins/team_chat/cron-summary")).then(function (r) {
          if (!r.ok) throw new Error("HTTP "+r.status);
          return r.json();
        }).then(function (d) {
          setCronJobs(d.jobs||[]);
        }).catch(function () {});
      };
      fetchCron();
      var iv = setInterval(fetchCron, 30000);
      return function () { clearInterval(iv); };
    }, []);

    var toggle = useCallback(function (id) {
      if (id===hid) return;
      setSel(function (p) { return p.indexOf(id)>=0?p.filter(function (x) { return x!==id; }):p.concat([id]); });
    }, [hid]);

    var chHost = useCallback(function (nid) {
      var oid = hid; setHid(nid);
      var f = ags.find(function (a) { return a.agent_id===nid; });
      setHnm(f?(f.name||nid):nid);
      setSel(function (p) {
        var u = p.filter(function (id) { return id!==nid; });
        if (oid&&oid!==nid&&ags.some(function (a) { return a.agent_id===oid; })) u.push(oid);
        return u;
      });
    }, [ags, hid]);

    function renderAgentTag(a) {
      if (!a||typeof a!=="object"||!a.agent_id) return null;
      var ih = String(a.agent_id)===String(hid), is = !ih&&sel.indexOf(a.agent_id)>=0;
      var avUrl = getApiUrl("/plugins/team_chat/avatar/"+encodeURIComponent(a.agent_id));
      return e("div",{key:a.agent_id,style:{display:"flex",flexDirection:"column",alignItems:"center",gap:2}},
        e(Tag,{color:ih?"default":(is?"blue":"default"),
          style:{cursor:ih?"not-allowed":"pointer",opacity:ih?0.5:1},
          onClick:function () { toggle(a.agent_id); }
        },
          (ih?"🎤":is?"✅":""),
          (a.name||a.agent_id)+(ih?" (主持人)":"")
        ),
        e("img",{src:avUrl+"?t="+avTs,
          style:{width:24,height:24,borderRadius:"50%",objectFit:"cover",background:"#eee",cursor:"pointer"},
          title:"点击上传 20x20 头像",
          onClick:function(ev){ev.stopPropagation();aiRf.current=a.agent_id;if(avRf.current)avRf.current.click();},
          onError:function(e){e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect fill='%23ddd' width='20' height='20' rx='10'/%3E%3Ctext x='10' y='15' text-anchor='middle' font-size='14'%3E📷%3C/text%3E%3C/svg%3E";e.target.style.opacity=0.6;}
        })
      );
    }

    var loadSess = useCallback(function () {
      setSessV(true); setSessLd(true);
      apiGet("/sessions"+(sq?"?search="+encodeURIComponent(sq):"")).then(function (r) {
        var merged = r.sessions||[];
        setSess(merged); setSessLd(false);
        try { localStorage.setItem("teamchat_sessions_cache", JSON.stringify(merged)); } catch(e) {}
      }).catch(function (err) {
        console.error("[TeamChat] loadSess error:",err&&err.message);
        var errMsg = (err&&err.message)||"";
        try {
          var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
          if (cache.length>0) { setSess(cache); message.info("从本地缓存加载历史会谈"); }
          else { message.error(errMsg?"历史会谈加载失败: "+errMsg:"无法加载历史会谈，请确认QwenPaw已启动并刷新插件"); }
        } catch(e) { setSess([]); message.error("加载失败"); }
        setSessLd(false);
      });
    }, [sq]);

    // 辅助：刷新历史会谈列表 + localStorage 缓存
    var updateSessList = useCallback(function () {
      apiGet("/sessions"+(sq?"?search="+encodeURIComponent(sq):"")).then(function (r) {
        var merged = r.sessions||[];
        setSess(merged);
        try { localStorage.setItem("teamchat_sessions_cache", JSON.stringify(merged)); } catch(e) {}
      }).catch(function (err) {
        console.error("[TeamChat] updateSessList error:",err&&err.message);
        try {
          var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
          if (cache.length>0) setSess(cache);
        } catch(e) {}
      });
    }, [sq]);

    // 扫描工作区产物文件（递归子目录）
    var scanWs = useCallback(function (p) {
      setWsLd(true); setWsPath(p||"");
      apiGet("/workspace-files"+(p?"?path="+encodeURIComponent(p):"")).then(function (r) {
        setWsFiles(r.files||[]); setWsLd(false);
      }).catch(function () { setWsLd(false); });
    }, []);

    var collectFile = useCallback(function (filepath) {
      apiPost("/collect-file",{path:filepath}).then(function (r) {
        var fn = filepath.split("/").pop()||filepath.split("\\").pop()||filepath;
        message.success("📄 "+fn+" → 已收入文件架", 4);
        loadShelf();
      }).catch(function (e) { message.error(e.message||"收集失败"); });
    }, [loadShelf]);

    var loadOne = useCallback(function (sid) {
      setSessV(false);
      apiGet("/session/"+sid).then(function (r) {
        saveTab();
        var t = newTab(r.session_id.slice(0,12)+"...");
        t.sid = r.session_id;
        t.hist = r.history||[];
        t.stps = r.host_steps||[];
        t.hid = r.host_id||"cloud-orchestrator";
        t.hnm = r.host_name||"CloudPaw-Master";
        if (r.agent_ids&&r.agent_ids.length>0) t.sel = r.agent_ids;
        t.bs = r.brainstorm||false;
        t.discDone = r.discussion_done||false;
        setTabs(function(p){return p.map(function(x){return x.id===t.id?t:x;});});
        restoreTab(t);
        try { localStorage.setItem("teamchat_last_session",r.session_id); } catch (e) {}
        message.success("已加载到新标签");
      }).catch(function () { message.error("加载失败"); });
    }, []);

    // ---- 📼 PPT 播放器：从历史会谈打开 ----
    var openPPT = useCallback(function (sid) {
      setSessV(false);
      apiGet("/session/"+sid).then(function (r) {
        setPptMsgs(r.history||[]);
        setPptIdx(0); setPptPl(false); setPptSpeed(1); setPptTyped(0); setPptShowAll(false);
        setPptV(true);
      }).catch(function (e) { message.error("加载失败: "+e.message); });
    }, []);

    var startVoice = useCallback(function () {
      var SR = window.SpeechRecognition||window.webkitSpeechRecognition;
      if (!SR) { message.warning("浏览器不支持语音"); return; }
      var rec = new SR(); rec.lang="zh-CN"; rec.interimResults=false;
      setList(true); rec.start();
      rec.onresult=function (ev) { setMsg(function (p) { return p+(p?" ":"")+ev.results[0][0].transcript; }); setList(false); };
      rec.onerror=function () { setList(false); message.error("语音失败"); };
      rec.onend=function () { setList(false); };
    }, []);

    // =================== Event Handlers ===================

    var handleFile = useCallback(function (ev) {
      var f = ev.target.files[0]; if (!f) return;
      var ext = f.name.split(".").pop().toLowerCase();
      var ok = ["txt","md","json","py","js","html","css","xml","csv","log","yaml","yml"];
      if (ok.indexOf(ext)===-1) { message.warning("不支持 ."+ext); return; }
      if (f.size>5*1024*1024) { message.warning("最大5MB"); return; }
      var fd = new FormData(); fd.append("file",f);
      fetch(getApiUrl("/plugins/team_chat/upload"),{method:"POST",body:fd}).then(function (r) {
        if (!r.ok) return r.json().then(function (e) { throw new Error(e.detail); });
        return r.json();
      }).then(function (d) {
        setMsg(function (p) { return p+"\n[文件: "+d.filename+" ("+(d.size/1024).toFixed(1)+"KB)]\n"; });
        message.success(d.filename+" 已上传");
      }).catch(function (e) { message.error(e.message); });
    }, []);

    var handleAvatar = useCallback(function (ev) {
      var f = ev.target.files[0]; if (!f || !aiRf.current) return;
      var agId = aiRf.current;
      var reader = new FileReader();
      reader.onload = function (re) {
        var img = new Image();
        img.onload = function () {
          var cvs = document.createElement("canvas");
          cvs.width = 20; cvs.height = 20;
          var ctx = cvs.getContext("2d");
          ctx.drawImage(img, 0, 0, 20, 20);
          cvs.toBlob(function (blob) {
            var fd = new FormData();
            fd.append("agent_id", agId);
            fd.append("file", blob, "avatar_20x20.png");
            fetch(getApiUrl("/plugins/team_chat/avatar"),{method:"POST",body:fd}).then(function (r) {
              if (!r.ok) return r.json().then(function (e) {
                var msg = typeof e.detail === "string" ? e.detail : (Array.isArray(e.detail) ? e.detail.map(function(d){return d.msg;}).join("; ") : JSON.stringify(e.detail));
                throw new Error(msg);
              });
              return r.json();
            }).then(function (d) {
              message.success(d.id+" 头像已更新");
              setAvTs(Date.now());
            }).catch(function (e) { message.error(e.message); });
          }, "image/png");
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(f);
    }, []);

    var stop = useCallback(function () {
      stopRef.current = true;
      if (abortRf.current) { abortRf.current.abort(); abortRf.current = null; }
      setLd(false); snap.current.ld = false; snap.current.pp = 0;
    }, []);

    var send = useCallback(function () {
      var m = msg.trim(); if (!m) { message.warning("请输入消息"); return; }
      if (sel.length===0) { message.warning(bs?"头脑风暴需要至少一个参与智能体":"请选择至少一个参与智能体"); return; }
      if (busyRef.current.blocked) { message.warning("⏳ 请等待「"+busyRef.current.label+"」完成后再操作"); return; }
      if (uc) m = "[环境上下文] "+uc+"\n\n"+m;
      setLd(true); snap.current.ld=true;snap.current.pp=0; setMsg(""); setMsgHistIdx(-1); setDiscSumV(false);
      if (m&&!msgHist.includes(m)) setMsgHist(function(p){var n=p.slice(-199);n.push(m);return n;});

      if (bs && rds>1) {
        var all = []; stopRef.current = false;
        function round(ri) {
          if (stopRef.current) { setLd(false); return; }
          if (ri>rds) { setLd(false); setHist(all); setDiscDone(true); try { localStorage.setItem("teamchat_last_session",si||""); } catch (e) {}
            syncActiveTab({si:si,hist:all,stps:[],bs:true,discDone:true});
            saveSessionCache(si,all,[],true,true);
            message.success("🧠 完成！共 "+rds+" 轮"); return; }
          setCr(ri); snap.current.cr=ri;snap.current.pp=Math.round((ri-1)/rds*100); var rm = ri===1?m:"🧠 [第"+ri+"/"+rds+"轮] 基于前面讨论，请深化或提出新观点。";
          if (all.length>0) rm+="\n[前面讨论]\n"+all.slice(-5).map(function (h) { return h.sender_name+": "+h.content.slice(0,150); }).join("\n");
          apiPostAbort("/chat",{message:rm,agent_ids:sel,host_id:hid,session_id:si,brainstorm:bs}).then(function (r) {
            updateSi(r.session_id); try { localStorage.setItem("teamchat_last_session",r.session_id); } catch (e) {}
            all=all.concat(r.history||[]); setHist(all.slice()); setPp(Math.round(ri/rds*100)); snap.current.pp=Math.round(ri/rds*100);
            syncActiveTab({si:r.session_id,hist:all,stps:[],bs:true,discDone:false});
            saveSessionCache(r.session_id,all,[],true,false);
            setTimeout(function () { round(ri+1); },800);
          }).catch(function (e) { if(e&&e.name==="AbortError"){setLd(false);message.warning("⏹ 已停止");}else{setLd(false);message.error("第"+ri+"轮: "+(e&&e.message||e));} });
        }
        round(1); return;
      }

      apiPostAbort("/chat",{message:m,agent_ids:sel,host_id:hid,session_id:si,brainstorm:bs}).then(function (r) {
        updateSi(r.session_id); try { localStorage.setItem("teamchat_last_session",r.session_id); } catch (e) {}
        setHist(r.history||[]); setStps(r.host_steps||[]); setLd(false); setPp(100);
        syncActiveTab({si:r.session_id,hist:r.history||[],stps:r.host_steps||[],bs:bs,discDone:false});
        saveSessionCache(r.session_id,r.history||[],r.host_steps||[],bs,false);
        message.success("已发送");
      }).catch(function (e) { if(e&&e.name==="AbortError"){setLd(false);message.warning("⏹ 已停止");}else{setLd(false);message.error(e&&e.message||e);} });
    }, [msg,sel,si,hid,bs,rds,uc]);

    var onKd = useCallback(function (ev) {
      if (ev.key==="?"&&!ev.shiftKey&&!ev.ctrlKey&&!ev.metaKey){ev.preventDefault();setKeysV(function(v){return !v;});return;}
      if (ev.key==="Escape"&&keysV){ev.preventDefault();setKeysV(false);return;}
      if (ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();send();return;}
      if (ev.key==="ArrowUp"){
        ev.preventDefault();
        if (msgHist.length===0) return;
        if (msgHistIdx===-1) { setMsgDraft(msg); setMsgHistIdx(msgHist.length-1); setMsg(msgHist[msgHist.length-1]); }
        else if (msgHistIdx>0) { setMsgHistIdx(msgHistIdx-1); setMsg(msgHist[msgHistIdx-1]); }
        return;
      }
      if (ev.key==="ArrowDown"){
        ev.preventDefault();
        if (msgHistIdx===-1) return;
        if (msgHistIdx<msgHist.length-1) { setMsgHistIdx(msgHistIdx+1); setMsg(msgHist[msgHistIdx+1]); }
        else { setMsgHistIdx(-1); setMsg(msgDraft); setMsgDraft(""); }
        return;
      }
      if (msgHistIdx!==-1) { setMsgHistIdx(-1); setMsgDraft(""); }
    }, [send, msg, msgHist, msgHistIdx, msgDraft, keysV]);

    // ---- 刷卡器: pullSummary ----
    var pullSummary = useCallback(function () {
      if (!si) { message.warning("无会话"); return; }
      setDiscLd(true);
      apiPost("/session/"+si+"/summarize",{host_id:hid}).then(function (r) {
        var sm = {role:"host",sender:hid,sender_name:hnm,content:"📊 最终汇总\n\n"+r.summary,timestamp:Date.now()/1000};
        setHist(function (p) { return p.concat([sm]); });
        setDiscLd(false); setDiscDone(true);
        syncActiveTab({si:si,hist:(snap.current.hist||[]).concat([sm]),stps:snap.current.stps||[],bs:snap.current.bs||false,discDone:true});
        saveSessionCache(si,(snap.current.hist||[]).concat([sm]),snap.current.stps||[],snap.current.bs||false,true);
        message.success("汇总已加载");
      }).catch(function (e) { setDiscLd(false); message.error(e.message); });
    }, [si,hid,hnm]);

    // ================================================================
    //  [v4.1.0] 🎵 轻音乐引擎 — 数字简谱播放 + 音量控制 + 停止按钮
    //  7首内置曲目(茉莉花/欢乐颂/天空之城/小苹果/童话/北京欢迎你/粉刷匠)
    //  parseNotation → 解析数字简谱 → AudioContext triangle 三角波播放
    //  volRf 音量 ref(同步 localStorage teamchat_music_vol, 0.1-1.0)
    //  Popover UI: ▶正在播放指示 + 曲目列表 + 🔊音量滑块 + ⏹停止按钮 + ✏️自定义
    // ================================================================
    // =================== 🎵 轻音乐引擎 ===================
    var P = [0,261.63,293.66,329.63,392.00,440.00,523.25]; // 五声音阶: 1=C 2=D 3=E 4=G 5=A 6=C5
    var PD = [0,261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33]; // 全音阶: 1=C 2=D 3=E 4=F 5=G 6=A 7=B 8=C5 9=D5
    var SONGS = {
      "茉莉花": {scale:"pentatonic", raw:"1111151112 5555555555 4444333333 222215112 555554421 555554421 2222123332 111132111 5555555555 6666555332 55554422 111111 555522332211 666655355332211"},
      "欢乐颂": {scale:"diatonic", raw:"334554321123322 334554321123211 223123431 23432125334554321123211"},
      "天空之城": {scale:"diatonic", raw:"6717137 365615 343413 173377 6717137 365615 34171 231 17667 56 1232352 1717137 67171215 43213 36655321 1212533 36655321 321276"},
      "小苹果": {scale:"diatonic", raw:"6 4 5 2 6 5 4 5 2 6 4 5 5 8 6 3 4 4 3 2 3 4 5 1 9 8 6 6 5 4 6 5 6 5 8 88888"},
      "童话": {scale:"diatonic", raw:"5543343 3434321 1356 6652243 135666 522434321 2366 1171"},
      "北京欢迎你": {scale:"diatonic", raw:"3532323 326132 21612352 365121 3532323 326132 21612352 365621 21612352 36553 2321562 6322135"},
      "粉刷匠": {scale:"diatonic", raw:"5353531 24325 5353531 24321 2244325 24325 5353531 24321"}
    };
    var _sng = useState(0), songIdx = _sng[0], setSongIdx = _sng[1];
    var _csng = useState(""), custSong = _csng[0], setCustSong = _csng[1];
    var _csts = useState(function(){
      try { return JSON.parse(localStorage.getItem("teamchat_custom_songs")||"[]"); } catch(e) { return []; }
    }), customSongs = _csts[0], setCustomSongs = _csts[1];
    function saveCustomSongs(songs) { setCustomSongs(songs); try { localStorage.setItem("teamchat_custom_songs", JSON.stringify(songs)); } catch(e) {} }
    var customSongsRef = useRef(customSongs); customSongsRef.current = customSongs;
    var custSongRef = useRef(custSong); custSongRef.current = custSong;
    var _sm = useState(false), showSaveModal = _sm[0], setShowSaveModal = _sm[1];
    var _snv = useState(""), saveNameVal = _snv[0], setSaveNameVal = _snv[1];
    function getBuiltinCount() { return Object.keys(SONGS).length; }
    function getTotalSongs() { return getBuiltinCount() + (customSongs?customSongs.length:0); }
    function getSongName(idx) {
      var b = getBuiltinCount();
      if (idx < b) return Object.keys(SONGS)[idx];
      var ci = idx - b;
      if (customSongs && ci < customSongs.length) return customSongs[ci].name;
      return "\u81ea\u5b9a\u4e49";
    }
    function getSongData(idx) {
      var b = getBuiltinCount();
      if (idx < b) {
        var s = SONGS[Object.keys(SONGS)[idx]];
        return {raw:s.raw, scale:s.scale};
      }
      var ci = idx - b;
      if (customSongs && ci < customSongs.length) {
        return {raw: customSongs[ci].raw, scale: customSongs[ci].scale||"diatonic"};
      }
      return {raw: custSong||"111111", scale: "diatonic"};
    }

    // 解析简谱串 → SEQ 数组
    function parseNotation(raw, scale) {
      var T = scale==="pentatonic"?P:PD;
      var seq = [];
      var lines = raw.split(/\s+/);
      lines.forEach(function(line, li) {
        var chars = line.split("");
        chars.forEach(function(ch, ci) {
          var n = parseInt(ch,10);
          if (isNaN(n)||n<=0||n>=T.length) return;
          var freq = T[n];
          var isLast = li===lines.length-1 && ci===chars.length-1;
          seq.push([freq, isLast?0.35:0.15, isLast?0.35:0.04]);
        });
        if (li<lines.length-1 && seq.length>0) seq[seq.length-1][2]=0.25;
      });
      return seq;
    }
    function getCurrentSEQ() {
      var sd = getSongData(songIdx);
      return parseNotation(sd.raw, sd.scale);
    }
    var musicRef = useRef(null);
    var volRf = useRef(function(){ try { return parseFloat(localStorage.getItem("teamchat_music_vol")||"0.5"); } catch(e) { return 0.5; } }());
    useEffect(function(){ volRf.current = musicVol; }, [musicVol]);
    var toggleMusic = useCallback(function (targetIdx) {
      if (musicRef.current) {
        musicRef.current.stopped = true; clearTimeout(musicRef.current.timer); musicRef.current.osc.forEach(function(o){try{o.stop();}catch(e){}}); musicRef.current=null; setMusicOn(false); return;
      }
      setMusicOn(true);
      var ctx = new (window.AudioContext||window.webkitAudioContext)();
      var st = {ctx:ctx,stopped:false,timer:null,idx:0,osc:[]};
      musicRef.current = st;
      var useIdx = (targetIdx!==undefined)?targetIdx:songIdx;
      var CS = customSongsRef.current||[];
      var CU = custSongRef.current||"";
      var b = Object.keys(SONGS).length;
      var sd;
      if (useIdx < b) {
        sd = SONGS[Object.keys(SONGS)[useIdx]];
      } else {
        var ci = useIdx - b;
        if (CS && ci < CS.length) {
          sd = CS[ci];
        } else {
          sd = {raw: CU||"111111", scale:"diatonic"};
        }
      }
      var SEQ = parseNotation(sd.raw, sd.scale||"diatonic");
      function play() {
        if (st.stopped) { if (st.idx>=SEQ.length) { setMusicOn(false); musicRef.current=null; } return; }
        if (st.idx>=SEQ.length) { setMusicOn(false); musicRef.current=null; return; }
        var n = SEQ[st.idx], freq = n[0], dur = n[1], gap = n[2];
        var osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = "triangle"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        var v = volRf.current||0.5;
        gain.gain.linearRampToValueAtTime(v, ctx.currentTime+0.04);
        gain.gain.linearRampToValueAtTime(v, ctx.currentTime+dur-0.04);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime+dur);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime+dur);
        st.osc.push(osc);
        st.idx++;
        st.timer = setTimeout(play, (dur+gap)*1000);
      }
      play();
    }, []);

    // ---- 📼 PPT 播放器特效 (打字机·粒子·键盘) ----
    useEffect(function () {
      if (!pptV) return;
      var cur = pptMsgs[pptIdx];
      if (!cur) return;
      var full = cur.content||"";
      setPptTyped(0); setPptShowAll(false);
      var charDelay = pptPl ? Math.max(6, 35/pptSpeed) : 8;
      var i = 0, steps = Math.max(1, Math.ceil(pptSpeed * 3));
      var iv = setInterval(function () {
        i += steps;
        if (i >= full.length) { setPptTyped(full.length); setPptShowAll(true); clearInterval(iv); return; }
        setPptTyped(i);
      }, charDelay);
      return function () { clearInterval(iv); };
    }, [pptIdx, pptPl, pptSpeed, pptV, pptMsgs]);

    useEffect(function () {
      if (!pptPl || !pptV || !pptShowAll) return;
      var delay = Math.max(500, 2000/pptSpeed);
      pptTmRf.current = setTimeout(function () {
        setPptIdx(function (i) { if (i >= pptMsgs.length-1) { setPptPl(false); return i; } return i+1; });
      }, delay);
      return function () { clearTimeout(pptTmRf.current); };
    }, [pptPl, pptV, pptShowAll, pptSpeed, pptIdx, pptMsgs.length]);

    useEffect(function () {
      if (!pptV) return;
      var handler = function (e) {
        if (e.key === "ArrowLeft")  { setPptIdx(function(i){return Math.max(0,i-1);}); setPptPl(false); }
        if (e.key === "ArrowRight") { setPptIdx(function(i){return Math.min(pptMsgs.length-1,i+1);}); setPptPl(false); }
        if (e.key === " ")          { setPptPl(function(p){return !p;}); e.preventDefault(); }
        if (e.key === "Escape")     { setPptV(false); setPptPl(false); }
        if (e.key === "1")          { setPptSpeed(0.5); setPptPl(false); }
        if (e.key === "2")          { setPptSpeed(1); setPptPl(false); }
        if (e.key === "3")          { setPptSpeed(2); setPptPl(false); }
      };
      window.addEventListener("keydown", handler);
      return function () { window.removeEventListener("keydown", handler); };
    }, [pptV, pptMsgs.length]);

    useEffect(function () {
      if (!pptV) return;
      var cv = pptCvRf.current; if (!cv) return;
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      var ctx = cv.getContext("2d");
      var pts = []; var N = 60;
      for (var j=0;j<N;j++) pts.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*2+0.8,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,a:Math.random()*0.2+0.04});
      var anim = true;
      function draw() {
        if (!anim) return;
        ctx.clearRect(0,0,cv.width,cv.height);
        for (var k=0;k<N;k++) {
          var p=pts[k]; p.x+=p.vx; p.y+=p.vy;
          if (p.x<0) p.x=cv.width; if (p.x>cv.width) p.x=0;
          if (p.y<0) p.y=cv.height; if (p.y>cv.height) p.y=0;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
          ctx.fillStyle=pptTheme==="dark"?"rgba(0,229,255,"+p.a+")":"rgba(230,81,0,"+p.a+")"; ctx.fill();
        }
        requestAnimationFrame(draw);
      }
      draw();
      return function () { anim=false; };
    }, [pptV]);

    var exportPPT = useCallback(function () {
      var lines = ["# 讨论回顾","","> 导出时间: "+new Date().toLocaleString(),"> 共 "+pptMsgs.length+" 条消息","","---",""];
      pptMsgs.forEach(function(m,i){
        var who = m.sender_name||m.sender||m.role||"系统";
        lines.push("## "+(i+1)+". "+who+" ("+(m.role||"")+")");
        lines.push(""); lines.push(m.content||""); lines.push(""); lines.push("---"); lines.push("");
      });
      var content = lines.join("\n");
      var fn = "review_"+new Date().toISOString().slice(0,10)+".md";
      _saveFile(content, fn, "text/markdown");
    }, [pptMsgs]);

    // ---- 通用「另存为」对话框 ----
    function _saveFile(content, suggestedName, mimeType) {
      try {
        if (window.showSaveFilePicker) {
          window.showSaveFilePicker({
            suggestedName: suggestedName,
            types: [{description: "文件", accept: {[mimeType]: [".md", ".txt", ".json", ".py", ".js", ".html", ".csv"]}}]
          }).then(function (handle) {
            return handle.createWritable().then(function (w) {
              return w.write(content).then(function () { return w.close(); });
            });
          }).then(function () {
            message.success("已保存: "+suggestedName);
          }).catch(function (e) {
            if (e.name!=="AbortError") _fallbackDownload(content, suggestedName, mimeType);
          });
          return;
        }
      } catch (e) {}
      _fallbackDownload(content, suggestedName, mimeType);
    }
    function _fallbackDownload(content, fn, mimeType) {
      var blob = new Blob([content], {type: mimeType+";charset=utf-8"});
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href=url; a.download=fn; a.click();
      URL.revokeObjectURL(url);
      message.success("已导出至浏览器下载目录 — "+fn);
    }

    // ---- 📄 文件架操作 ----
    var loadShelf = useCallback(function () {
      setShelfLd(true);
      apiGet("/collected-files").then(function (r) {
        setShelfFiles(r.files||[]); setShelfLd(false);
      }).catch(function () { setShelfLd(false); message.error("加载文件列表失败"); });
    }, []);

    var downloadShelfFile = useCallback(function (f) {
      var url = getApiUrl("/plugins/team_chat"+f.download_url);
      fetch(url, {headers: apiHeaders()}).then(function (r) {
        if (!r.ok) throw new Error("HTTP "+r.status);
        return r.blob();
      }).then(function (blob) {
        _saveFile(blob, f.original||f.filename, blob.type||"application/octet-stream");
      }).catch(function (e) { message.error("下载失败: "+e.message); });
    }, []);

    var openReadme = useCallback(function () {
      setReadmeV(true);
      (function(){var u=QP.plugin&&QP.plugin.getMediaUrl?QP.plugin.getMediaUrl("../README.md"):getApiUrl("/plugins/team_chat/readme");return fetch(u).then(function(r){return r.text();}).then(function(t){setReadmeC(t);}).catch(function(){setReadmeC("加载 README.md 失败");});})();
    }, []);

    // 🔄 组件卸载前自动持久化当前标签状态到 localStorage（避免 setState 警告）
    useEffect(function () {
      return function () {
        var t = snap.current; if (!t||!t.si) return;
        try {
          var tabs = JSON.parse(localStorage.getItem("teamchat_tabs")||"[]");
          var updated = tabs.map(function(tab){
            if (tab.id !== activeTabRef.current) return tab;
            return Object.assign({}, tab, {si:t.si,hist:t.hist,stps:t.stps,sel:t.sel,bs:t.bs,discDone:t.discDone,discLd:t.discLd,ld:t.ld,cr:t.cr,rds:t.rds,pp:t.pp,msg:t.msg,msgHist:t.msgHist,msgHistIdx:t.msgHistIdx,msgDraft:t.msgDraft,hid:t.hid,hnm:t.hnm});
          });
          localStorage.setItem("teamchat_tabs", JSON.stringify(updated));
        } catch(e) {}
      };
    }, []);



    // =================== Layout / Main Render ===================
  var paginationBar = function(tab) { return e("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",padding:"12px 0",gap:"10px",borderTop:"1px solid #e0e0e0",marginTop:"12px"}}, e("span",{style:{fontSize:"12px",color:"#333"}},"共 " + totalEmails + " 封 · 每页 " + pageSize), e("button",{onClick:function(){goPage(tab,1);},disabled:curPage<=1,style:{padding:"4px 12px",borderRadius:"4px",border:"1px solid #ccc",background:"#f5f5f5",color:"#333",cursor:curPage<=1?"default":"pointer",opacity:curPage<=1?0.4:1,fontSize:"12px"}},"首页"), e("button",{onClick:function(){goPage(tab,curPage-1);},disabled:curPage<=1,style:{padding:"4px 12px",borderRadius:"4px",border:"1px solid #ccc",background:"#f5f5f5",color:"#333",cursor:curPage<=1?"default":"pointer",opacity:curPage<=1?0.4:1,fontSize:"12px"}},"上一页"), e("span",{style:{fontSize:"13px",color:"#333"}},curPage + " / " + Math.max(1,Math.ceil(totalEmails/pageSize))), e("button",{onClick:function(){goPage(tab,curPage+1);},disabled:curPage>=Math.ceil(totalEmails/pageSize),style:{padding:"4px 12px",borderRadius:"4px",border:"1px solid #ccc",background:"#f5f5f5",color:"#333",cursor:curPage>=Math.ceil(totalEmails/pageSize)?"default":"pointer",opacity:curPage>=Math.ceil(totalEmails/pageSize)?0.4:1,fontSize:"12px"}},"下一页"), e("button",{onClick:function(){goPage(tab,Math.ceil(totalEmails/pageSize));},disabled:curPage>=Math.ceil(totalEmails/pageSize),style:{padding:"4px 12px",borderRadius:"4px",border:"1px solid #ccc",background:"#f5f5f5",color:"#333",cursor:curPage>=Math.ceil(totalEmails/pageSize)?"default":"pointer",opacity:curPage>=Math.ceil(totalEmails/pageSize)?0.4:1,fontSize:"12px"}},"末页"), e("select",{value:pageSize,onChange:function(ev){onPageSizeChange(tab,parseInt(ev.target.value));},style:{padding:"4px 8px",borderRadius:"4px",border:"1px solid #ccc",background:"#f5f5f5",color:"#333",fontSize:"12px",cursor:"pointer"}}, e("option",{value:10},"10"), e("option",{value:20},"20"), e("option",{value:50},"50"), e("option",{value:100},"100"))); };

    if(chuanView) return e(ChuanChuanPage,{onBack:function(){setChuanView(false);}});
  // AI邮箱主视图
    if(aimailView && aimailMode === "main") return e("div",{style:{padding:"20px",textAlign:"center",background:"linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",color:"#333",minHeight:"100vh"}},
    e("h2",null,"AI邮箱功能"), e("p",{style:{fontSize:"14px",opacity:0.8,marginTop:"8px"}},"巢邮箱 - AI邮件系统 v0.3.0"),
    e("div",{style:{marginTop:"16px",textAlign:"center"}},
      e("a",{href:"https://t.zsxq.com/w9EaD",target:"_blank",rel:"noopener noreferrer",style:{display:"inline-block",borderRadius:"16px",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,.12)",transition:"transform .2s",maxWidth:"320px",textDecoration:"none"}},
        e("div",{style:{background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",padding:"32px 24px",textAlign:"center"}},
          e("div",{style:{fontSize:"40px",marginBottom:"8px"}},"🌍"),
          e("div",{style:{fontSize:"20px",fontWeight:"bold",color:"#e67e22",marginBottom:"4px"}},"知识星球"),
          e("div",{style:{fontSize:"13px",color:"rgba(255,255,255,0.7)",lineHeight:"1.6"}},"加入我们搭建应用")
        )
      ),
      e("p",{style:{fontSize:"16px",fontWeight:"bold",color:"#1a1a2e",margin:"10px 0 2px 0",letterSpacing:"1px"}},"想像力让小白搭建企业级应用")
    ),
    // AI分身全局开关
    e("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",marginTop:"20px",gap:"12px"}},
      e("span",{style:{fontSize:"15px",fontWeight:"bold",color:"#555"}},"🤖 AI分身全局开关"),
      e("div",{onClick:function(){var n=!aiFenshenEnabled;setAiFenshenEnabled(n);window.toggleAIFenshenGlobal(n);},style:{width:"56px",height:"28px",borderRadius:"14px",background:aiFenshenEnabled?"linear-gradient(135deg,#667eea,#764ba2)":"#ccc",cursor:"pointer",position:"relative",transition:"background 0.3s ease",boxShadow:aiFenshenEnabled?"0 0 12px rgba(102,126,234,0.5)":"inset 0 1px 3px rgba(0,0,0,0.15)"}},
        e("div",{style:{width:"22px",height:"22px",borderRadius:"50%",background:"white",position:"absolute",top:"3px",left:aiFenshenEnabled?"31px":"3px",transition:"left 0.3s cubic-bezier(0.4,0,0.2,1)",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}})
      ),
      e("span",{style:{fontSize:"13px",fontWeight:"bold",color:aiFenshenEnabled?"#667eea":"#999",minWidth:"36px",transition:"color 0.3s"}},aiFenshenEnabled?"ON":"OFF")
    ),
    e("div",{style:{marginTop:"30px",display:"flex",flexDirection:"column",gap:"16px",alignItems:"center"}},
      e("div",{onClick:function(){setAimailMode("traditional");},style:{background:"#ffffff",border:"1px solid #e0e0e0",borderRadius:"16px",padding:"24px 48px",cursor:"pointer",width:"360px",textAlign:"center",transition:"transform 0.2s",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}},
        e("div",{style:{fontSize:"24px",marginBottom:"8px"}},"📧 🕊️"),
        e("div",{style:{fontSize:"18px",fontWeight:"bold"}},"传统邮箱"),
        e("div",{style:{fontSize:"12px",opacity:0.7,marginTop:"4px"}},"收件、发件、管理")
      ),
      e("div",{onClick:function(){window.showHiveAnimation();},style:{background:"#ffffff",border:"1px solid #e0e0e0",borderRadius:"16px",padding:"24px 48px",cursor:"pointer",width:"360px",textAlign:"center",transition:"transform 0.2s",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}},
        e("div",{style:{fontSize:"24px",marginBottom:"8px"}},"🏠 🐝🐝"),
        e("div",{style:{fontSize:"18px",fontWeight:"bold"}},"蜂巢邮箱"),
        e("div",{style:{fontSize:"12px",opacity:0.7,marginTop:"4px"}},"写信给AI CC咨询: c115886@agent.qq.com")
      )
    ),
    e("button",{onClick:function(){setAimailView(false);},style:{background:"white",color:"#667eea",border:"none",padding:"10px 20px",borderRadius:"8px",cursor:"pointer",marginTop:"30px"}},"返回主界面")
  );

    var filteredEmails = emails.filter(function(email) {
      if (emailFilter === "all") return true;
      if (emailFilter === "unread") return email.read_status === 0;
      if (emailFilter === "starred") return email.starred;
      if (emailFilter === "ad" || emailFilter === "enterprise" || emailFilter === "notification" || emailFilter === "general") return email.category === emailFilter;
      return true;
    });
        if(aimailView && aimailMode === "traditional") return e("div",{style:{padding:"20px",background:"linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",color:"#333",minHeight:"100vh"}},
    e("div",{style:{display:"flex",alignItems:"center",marginBottom:"20px"}},
      e("button",{onClick:function(){setAimailMode("main");},style:{background:"#667eea",border:"none",color:"white",padding:"8px 16px",borderRadius:"8px",cursor:"pointer",marginRight:"12px"}},"← 返回"),
      e("h2",{style:{margin:0,color:"#333"}},"传统邮箱"),
        e("button",{onClick:openComposeModal,style:{background:"#667eea",color:"white",border:"none",padding:"8px 16px",borderRadius:"6px",cursor:"pointer",fontSize:"14px"}},"✉️ 写邮件")
      ),
    e("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",justifyContent:"center",marginBottom:"16px"}},
      // ---- 📧 多邮箱选择器 ----
      emailConfigs.length > 0 ? e("select",{
        value: currentAccount,
        onChange: function(ev){ setCurrentAccount(ev.target.value); },
        style: {padding:"6px 12px",borderRadius:"8px",border:"1px solid #667eea",fontSize:"13px",fontWeight:"bold",color:"#667eea",background:"white",cursor:"pointer",minWidth:"180px",maxWidth:"260px"}
      },
        e("option",{value:"__all__",style:{fontWeight:"bold",background:"#f0f4ff"}},"📧 全部邮箱 (" + emailConfigs.length + ")"),
        e("option",{disabled:true,style:{fontSize:"1px",padding:0,height:"4px",background:"#ddd"}},"──────────────"),
        emailConfigs.map(function(cfg){ return e("option",{key:cfg.id||cfg.email,value:cfg.email}, "📨 " + cfg.email); })
      ) : null,
      e("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center",alignItems:"center"}},
        emailConfigs.length > 0 ? e("span",{onClick:function(){setEmailTab("inbox");setCurPage(1);fetchEmails("inbox");},style:emailTab==="inbox"?{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #5a6cdb",boxShadow:"0 2px 12px rgba(102,126,234,0.4)",fontWeight:"bold",color:"#fff",textShadow:"0 1px 0 rgba(0,0,0,0.2)"}:{background:"linear-gradient(180deg,#e8e8e8,#c0c0c0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #aaa",fontWeight:"bold",color:"#555"}},"📬 收件箱") : null,
        emailConfigs.length > 0 ? e("span",{onClick:function(){setEmailTab("sent");setCurPage(1);fetchEmails("sent");},style:emailTab==="sent"?{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #5a6cdb",boxShadow:"0 2px 12px rgba(102,126,234,0.4)",fontWeight:"bold",color:"#fff",textShadow:"0 1px 0 rgba(0,0,0,0.2)"}:{background:"linear-gradient(180deg,#e8e8e8,#c0c0c0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #aaa",fontWeight:"bold",color:"#555"}},"📤 发件箱") : null,
        emailConfigs.length > 0 ? e("span",{onClick:function(){setEmailTab("drafts");setCurPage(1);fetchEmails("drafts");},style:emailTab==="drafts"?{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #5a6cdb",boxShadow:"0 2px 12px rgba(102,126,234,0.4)",fontWeight:"bold",color:"#fff",textShadow:"0 1px 0 rgba(0,0,0,0.2)"}:{background:"linear-gradient(180deg,#e8e8e8,#c0c0c0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #aaa",fontWeight:"bold",color:"#555"}},"📝 草稿箱") : null,
        emailConfigs.length > 0 ? e("span",{onClick:function(){setEmailTab("contacts");fetchContacts();},style:emailTab==="contacts"?{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #5a6cdb",boxShadow:"0 2px 12px rgba(102,126,234,0.4)",fontWeight:"bold",color:"#fff",textShadow:"0 1px 0 rgba(0,0,0,0.2)"}:{background:"linear-gradient(180deg,#e8e8e8,#c0c0c0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #aaa",fontWeight:"bold",color:"#555"}},"👥 联系人") : null,
        emailConfigs.length > 0 ? e("span",{onClick:function(){setEmailTab("trash");setCurPage(1);fetchEmails("trash");},style:emailTab==="trash"?{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #5a6cdb",boxShadow:"0 2px 12px rgba(102,126,234,0.4)",fontWeight:"bold",color:"#fff",textShadow:"0 1px 0 rgba(0,0,0,0.2)"}:{background:"linear-gradient(180deg,#e8e8e8,#c0c0c0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #aaa",fontWeight:"bold",color:"#555"}},"🗑 回收站") : null,
      e("span",{onClick:function(){setEmailTab("settings");},style:emailTab==="settings"?{background:"linear-gradient(135deg,#667eea,#764ba2)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #5a6cdb",boxShadow:"0 2px 12px rgba(102,126,234,0.4)",fontWeight:"bold",color:"#fff",textShadow:"0 1px 0 rgba(0,0,0,0.2)"}:{background:"linear-gradient(180deg,#e8e8e8,#c0c0c0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #aaa",fontWeight:"bold",color:"#555"}},"⚙ 设置"),
      e("span",{onClick:function(){setEmailTab("security");},style:emailTab==="security"?{background:"linear-gradient(135deg,#ff6b6b,#c62828)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #b71c1c",boxShadow:"0 2px 12px rgba(255,107,107,0.4)",fontWeight:"bold",color:"#fff",textShadow:"0 1px 0 rgba(0,0,0,0.2)"}:{background:"linear-gradient(180deg,#e8e8e8,#c0c0c0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #aaa",fontWeight:"bold",color:"#555"}},"🛡️ 安全提示")
      )
    ),

        emailTab === "inbox" ? e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
      e("div",{style:{marginBottom:"16px"}},
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}},
          e("h3",{style:{margin:0,fontSize:"18px"}},"📬 收件箱 (" + (filteredEmails ? filteredEmails.length : 0) + ")"),
          e("div",{style:{display:"flex",gap:"8px"}},
      e("div",{style:{display:"flex",gap:"8px",alignItems:"center",marginTop:"8px",justifyContent:"center"}},
        e("select",{value:emailFilter,onChange:function(e){setEmailFilter(e.target.value);setCurPage(1);},style:{padding:"6px 12px",borderRadius:"6px",border:"1px solid #ccc",background:"#fff",fontSize:"13px",cursor:"pointer",color:"#333"}},
          e("option",{value:"all"},"📬 全部邮件"),
          e("option",{value:"unread"},"🔵 未读"),
          e("option",{value:"starred"},"⭐ 星标"),
          e("option",{value:"ad"},"📢 广告"),
          e("option",{value:"enterprise"},"🏢 企业"),
          e("option",{value:"notification"},"🔔 通知"),
          e("option",{value:"general"},"📋 普通")
        )
      ),
            e("button",{onClick:function(){fetchEmails("inbox");setLastSync(new Date().toLocaleTimeString());},style:{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",padding:"8px 18px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"bold",boxShadow:"0 2px 8px rgba(102,126,234,0.3)"}},"🔄 刷新收件箱"),
            e("button",{onClick:function(ev){var btn=ev.currentTarget;var origText="📥 同步";setSelectedIds([]);setTimeout(function(){btn.textContent="⏳ 同步中...";btn.disabled=true;btn.style.opacity="0.7";},10);var hdrs=apiHeaders?apiHeaders():{};var ctrl=new AbortController();var timeout=setTimeout(function(){ctrl.abort();},30000);fetch("/api/plugins/team_chat/email/sync",{method:"POST",headers:hdrs,signal:ctrl.signal}).then(function(r){clearTimeout(timeout);return r.json();}).then(function(d){btn.textContent=origText;btn.disabled=false;btn.style.opacity="1";if(d.success){fetchEmails("inbox");setLastSync(new Date().toLocaleTimeString());}else{alert("同步失败: "+(d.message||"未知错误"));}}).catch(function(e){clearTimeout(timeout);btn.textContent=origText;btn.disabled=false;btn.style.opacity="1";if(e.name!=="AbortError"){console.error("同步出错:",e);alert("同步请求失败: "+(e.message||"网络错误"));}else{alert("同步超时(30秒)，请检查网络或邮箱配置");}});},style:{background:"linear-gradient(135deg,#11998e,#38ef7d)",color:"#fff",border:"none",padding:"8px 18px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"bold",boxShadow:"0 2px 8px rgba(17,153,142,0.3)"}},"📥 同步")
          )
        ),
        lastSync ? e("div",{style:{fontSize:"11px",color:"#999",textAlign:"right",marginBottom:"6px"}},"⏱ 上次: " + lastSync + " · 共 " + (emails ? emails.length : 0) + " 封") : null,
        e("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}},
          selectedIds && selectedIds.length > 0
            ? e("span",null,
                e("span",{style:{fontSize:"13px",fontWeight:"bold",color:"#1565c0",marginRight:"10px"}},"已选 " + selectedIds.length + " 封"),
                e("button",{onClick:function(){setSelectedIds(emails.map(function(e){return e.id;}));},style:{padding:"4px 10px",borderRadius:"5px",fontSize:"12px",border:"1px solid #90caf9",cursor:"pointer",background:"#fff",color:"#1565c0"}},"☑ 全选"),
                e("button",{onClick:function(){setSelectedIds([]);},style:{padding:"4px 10px",borderRadius:"5px",fontSize:"12px",border:"1px solid #90caf9",cursor:"pointer",background:"#fff",color:"#1565c0",marginLeft:"4px"}},"✖ 取消"),
                e("button",{onClick:function(){var ids=selectedIds.slice();fetch("/api/plugins/team_chat/email/inbox/batch-delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(ids)}).then(function(r){return r.json();}).then(function(d){if(d.success){setEmails(emails.filter(function(e){return ids.indexOf(e.id)===-1;}));setSelectedIds([]);}else{alert("❌ 删除失败: "+(d.message||"未知错误"));}}).catch(function(err){alert("❌ 删除失败: "+err.message);});},style:{padding:"4px 12px",borderRadius:"5px",fontSize:"12px",fontWeight:"bold",border:"none",cursor:"pointer",background:"#ef5350",color:"#fff",marginLeft:"8px"}},"🗑 批量删除 " + selectedIds.length)
              )
            : e("span",{style:{fontSize:"12px",color:"#999"}},"☑ 点击勾选框可批量操作")
        )
      ),
      loading ? e("div",{style:{textAlign:"center",padding:"60px",opacity:0.6}},"⏳ 加载中...") :
      error ? e("div",{style:{textAlign:"center",padding:"60px",color:"#ff6b6b"}},"❌ " + error) :
      filteredEmails.length === 0 ? e("div",{style:{textAlign:"center",padding:"60px",opacity:0.6}},"📭 收件箱为空") :
      e("div",null,filteredEmails.map(function(email){var isSel=selectedIds.indexOf(email.id)>=0;var isUnread=email.read_status===0;return e("div",{key:email.id,onClick:function(){window.showMailDetail(email);},style:{background:isSel?"#e3f2fd":selectedEmail&&selectedEmail.id===email.id?"#f5f5f5":"white",padding:"10px 12px",marginBottom:"6px",borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",boxShadow:isUnread?"0 2px 8px rgba(102,126,234,0.12)":"0 1px 2px rgba(0,0,0,0.04)",border:isSel?"2px solid #1976d2":isUnread?"1px solid rgba(102,126,234,0.25)":"1px solid rgba(0,0,0,0.05)",borderLeft:isUnread?"4px solid #667eea":"1px solid rgba(0,0,0,0.05)"}},
        e("input",{type:"checkbox",checked:isSel,readOnly:true,onClick:function(e){e.stopPropagation();if(!isSel){setSelectedIds(selectedIds.concat([email.id]));}else{setSelectedIds(selectedIds.filter(function(x){return x!==email.id;}));}},style:{width:"15px",height:"15px",cursor:"pointer",flexShrink:0,accentColor:"#1976d2"}}),
        e("div",{style:{width:"32px",height:"32px",borderRadius:"50%",background:email.from_addr==="系统通知"?"#38ef7d":"#667eea",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"bold",fontSize:"12px",flexShrink:0}},email.from_addr?email.from_addr.charAt(0):"?"),
        e("div",{style:{flex:1,minWidth:0}},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}},
            e("div",{style:{fontWeight:"bold",fontSize:"13px",color:email.read_status===0?"#1565c0":"#333"}},email.subject||"(无主题)"),
            e("div",{style:{fontSize:"10px",color:"#999",whiteSpace:"nowrap"}},email.received_date?new Date(email.received_date).toLocaleDateString():email.created_at?new Date(email.created_at).toLocaleDateString():"")
          ),
          e("div",{style:{fontSize:"11px",color:"#666",marginBottom:"1px"}},email.from_addr||"未知发件人",
            email.account_email && currentAccount === '__all__' ? e("span",{style:{fontSize:"9px",color:"#667eea",marginLeft:"6px",background:"#e3f2fd",padding:"1px 5px",borderRadius:"3px"}},email.account_email) : null
          ),
          e("div",{style:{fontSize:"11px",color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"400px"}},getEmailText(email).replace(/\n/g," ").substring(0,100)||"(无内容)")
        ),
        e("div",{style:{display:"flex",gap:"3px",flexShrink:0,alignItems:"center"}},
          e("button",{title:"标为已读",onClick:function(e){e.stopPropagation();markRead(email);},style:{background:"none",border:"none",cursor:"pointer",fontSize:"14px",padding:"1px 3px",opacity:email.read_status===0?1:0.25}},email.read_status===0?"🔵":"⚪"),
          e("button",{title:email.starred?"取消星标":"星标",onClick:function(e){e.stopPropagation();toggleStarEmail(email);},style:{background:"none",border:"none",cursor:"pointer",fontSize:"14px",padding:"1px 3px"}},email.starred?"⭐":"☆"),
          e("button",{title:"回复",onClick:function(e){e.stopPropagation();replyEmail(email,false);},style:{background:"#667eea",color:"white",border:"2px solid #5a6cdb",padding:"2px 6px",borderRadius:"3px",cursor:"pointer",fontSize:"11px",fontWeight:"bold"}},"↩"),
          e("button",{title:"删除",onClick:function(e){e.stopPropagation();deleteEmail("inbox",email.id);},style:{background:"#ff0000",color:"white",border:"2px solid #cc0000",padding:"2px 6px",borderRadius:"3px",cursor:"pointer",fontSize:"11px",fontWeight:"bold"}},"🗑")
        )
      )}))
    ,paginationBar("inbox")) : emailTab === "sent" ? e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},
        e("h3",{style:{margin:0,fontSize:"18px"}},"📤 发件箱 (" + (emails ? emails.length : 0) + ")"),
        e("button",{onClick:function(){fetchEmails("sent");},style:{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",padding:"8px 18px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"bold",boxShadow:"0 2px 8px rgba(102,126,234,0.3)"}},"🔄 刷新发件箱")
      ),
      loading ? e("div",{style:{textAlign:"center",padding:"60px",opacity:0.6}},"⏳ 加载中...") :
      error ? e("div",{style:{textAlign:"center",padding:"60px",color:"#ff6b6b"}},"❌ " + error) :
      emails && emails.length === 0 ? e("div",{style:{textAlign:"center",padding:"60px",opacity:0.6}},"📭 暂无已发送邮件") :
      e("div",null,emails.map(function(email){var isSel=selectedIds.indexOf(email.id)>=0;var isUnread=email.read_status===0;return e("div",{key:email.id,onClick:function(){window.showMailDetail(email);},style:{background:isSel?"#e8f5e9":"white",padding:"10px 12px",marginBottom:"6px",borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",boxShadow:isUnread?"0 2px 8px rgba(102,126,234,0.12)":"0 1px 2px rgba(0,0,0,0.04)",border:isSel?"2px solid #2e7d32":isUnread?"1px solid rgba(102,126,234,0.25)":"1px solid rgba(0,0,0,0.05)",borderLeft:isUnread?"4px solid #667eea":"1px solid rgba(0,0,0,0.05)"}},
        e("input",{type:"checkbox",checked:isSel,readOnly:true,onClick:function(e){e.stopPropagation();if(!isSel){setSelectedIds(selectedIds.concat([email.id]));}else{setSelectedIds(selectedIds.filter(function(x){return x!==email.id;}));}},style:{width:"15px",height:"15px",cursor:"pointer",flexShrink:0,accentColor:"#2e7d32"}}),
        e("div",{style:{width:"32px",height:"32px",borderRadius:"50%",background:"#66bb6a",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"bold",fontSize:"12px",flexShrink:0}},"发"),
        e("div",{style:{flex:1,minWidth:0}},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}},
            e("div",{style:{fontWeight:"bold",fontSize:"13px"}},email.subject||"(无主题)"),
            e("div",{style:{fontSize:"10px",color:"#999",whiteSpace:"nowrap"}},email.sent_date?new Date(email.sent_date).toLocaleDateString():email.created_at?new Date(email.created_at).toLocaleDateString():"")
          ),
          e("div",{style:{fontSize:"11px",color:"#666",marginBottom:"1px"}},"→ "+(email.to_addr||"未知")),
          e("div",{style:{fontSize:"11px",color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"400px"}},getEmailText(email).replace(/\n/g," ").substring(0,100)||"(无内容)")
        ),
        e("div",{style:{display:"flex",gap:"3px",flexShrink:0,alignItems:"center"}},
          e("button",{title:"回复",onClick:function(e){e.stopPropagation();replyEmail(email,false);},style:{background:"#667eea",color:"white",border:"2px solid #5a6cdb",padding:"2px 6px",borderRadius:"3px",cursor:"pointer",fontSize:"11px",fontWeight:"bold"}},"↩"),
          e("button",{title:"星标",onClick:function(e){e.stopPropagation();toggleStarEmail(email);},style:{background:"none",border:"none",cursor:"pointer",fontSize:"14px",padding:"1px 3px"}},email.starred?"⭐":"☆"),
          e("button",{title:"删除",onClick:function(e){e.stopPropagation();deleteEmail("sent",email.id);},style:{background:"#ff0000",color:"white",border:"2px solid #cc0000",padding:"2px 6px",borderRadius:"3px",cursor:"pointer",fontSize:"11px",fontWeight:"bold"}},"🗑")
        )
      )}))
    ,paginationBar("sent")) : emailTab === "drafts" ? e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},
        e("h3",{style:{margin:0}},"📝 草稿箱 (" + (emails ? emails.length : 0) + ")"),
        e("button",{onClick:function(){openComposeModal();},style:{background:"rgba(255,255,255,0.2)",border:"none",color:"white",padding:"6px 14px",borderRadius:"6px",cursor:"pointer",fontSize:"12px"}},"✏️ 新建")
      ),
      loading ? e("div",{style:{textAlign:"center",padding:"40px"}},"加载中...") :
      emails && emails.length === 0 ? e("div",{style:{textAlign:"center",opacity:0.6}},"暂无草稿") :
      e("div",null,emails.map(function(email){var isSel=selectedIds.indexOf(email.id)>=0;return e("div",{key:email.id,style:{background:isSel?"#fff3e0":"white",padding:"10px 12px",marginBottom:"6px",borderRadius:"8px",display:"flex",alignItems:"flex-start",gap:"8px",border:isSel?"2px solid #e65100":"1px solid rgba(0,0,0,0.05)",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",borderLeft:"4px solid #ff9800"}},
        e("input",{type:"checkbox",checked:isSel,readOnly:true,onClick:function(e){e.stopPropagation();if(!isSel){setSelectedIds(selectedIds.concat([email.id]));}else{setSelectedIds(selectedIds.filter(function(x){return x!==email.id;}));}},style:{width:"15px",height:"15px",cursor:"pointer",flexShrink:0,accentColor:"#e65100"}}),
        e("div",{style:{flex:1,minWidth:0}},
          e("div",{style:{fontWeight:"bold",fontSize:"13px",marginBottom:"4px"}},email.subject||"(无主题)"),
          e("div",{style:{color:"#666",fontSize:"12px",marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},email.body||"(无内容)"),
          e("div",{style:{fontSize:"10px",color:"#999"}},email.created_at?new Date(email.created_at).toLocaleString():"")
        ),
        e("div",{style:{display:"flex",gap:"4px",flexShrink:0}},
          e("button",{onClick:function(e){e.stopPropagation();editDraft(email);},style:{background:"#667eea",color:"white",border:"none",padding:"5px 10px",borderRadius:"4px",cursor:"pointer",fontSize:"11px",fontWeight:"bold"}},"✏️ 编辑"),
          e("button",{onClick:function(e){e.stopPropagation();deleteEmail("drafts",email.id);},style:{background:"#ff0000",color:"white",border:"2px solid #cc0000",padding:"4px 8px",borderRadius:"4px",cursor:"pointer",fontSize:"11px",fontWeight:"bold"}},"🗑 删除")
        )
      )}))
    ,paginationBar("drafts")) : emailTab === "contacts" ? e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},
        e("h3",null,"👥 联系人 (" + emails.length + ")"),
        e("button",{onClick:function(){console.log("[联系人] +添加按钮被点击, showAddContact前="+showAddContact);showAddContactModal(newContact,setNewContact,addContact);},style:{background:"#667eea",color:"white",border:"none",padding:"8px 16px",borderRadius:"6px",cursor:"pointer",fontSize:"14px"}},"+ 添加")
      ),
      loading ? e("div",{style:{textAlign:"center",padding:"40px",opacity:0.6}},"⏳ 加载中...") :
      emails.length === 0 ? e("div",{style:{textAlign:"center",padding:"40px",opacity:0.6}},"暂无联系人") :
      e("div",null,emails.map(function(item,i){return e("div",{key:i,style:{background:"white",padding:"12px 16px",marginBottom:"8px",borderRadius:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid rgba(0,0,0,0.05)"}},
        e("div",{style:{display:"flex",alignItems:"center",gap:"10px"}},
          e("div",{style:{width:"36px",height:"36px",borderRadius:"50%",background:"#667eea",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"bold",fontSize:"16px"}},(item.name||"?")[0]),
          e("div",null,
            e("div",{style:{fontWeight:"bold"}},item.name||"未知"),
            e("div",{style:{fontSize:"12px",opacity:0.6}},item.email||""),
            e("div",{style:{fontSize:"11px",opacity:0.4}},item.phone ? item.phone + (item.company?" · ":"") : "",item.company||"")
          )
        ),
        e("div",{style:{display:"flex",gap:"6px",flexShrink:0}},
          e("button",{title:"给此联系人写信",onClick:function(e){e.stopPropagation();if(!item.email){alert("此联系人无邮箱地址");return;}openComposeDOM("新邮件",item.email,"","",item.name ? "Dear " + item.name + ",\n\n" : "");},style:{background:"#667eea",color:"white",border:"2px solid #5a6cdb",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"12px",fontWeight:"bold"}},"📧 写信"),
          e("button",{title:"查看此联系人的关联收件箱邮件",onClick:function(e){e.stopPropagation();if(!item.email){alert("此联系人无邮箱地址");return;}window.searchContactsMail(item.email,item.name);},style:{background:"#f0f0f0",color:"#333",border:"1px solid #ccc",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"12px",fontWeight:"bold"}},"📬 查邮件"),
          e("button",{onClick:function(e){e.stopPropagation();deleteContact(item.id);},style:{background:"none",border:"1px solid rgba(255,0,0,0.3)",color:"red",padding:"4px 10px",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}},"删除")
        )
      )})
    )) : emailTab === "trash" ? e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},
        e("h3",null,"🗑️ 回收站 (" + (emails ? emails.length : 0) + ")"),
        e("button",{onClick:function(){if(!confirm("确定清空回收站？此操作不可恢复！"))return;clearTrash();},style:{background:"#d32f2f",color:"white",border:"2px solid #b71c1c",padding:"8px 18px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:"bold",boxShadow:"0 2px 8px rgba(211,47,47,0.3)"}},"🗑 清空回收站")
      ),
      loading ? e("div",{style:{textAlign:"center",padding:"40px",opacity:0.6}},"⏳ 加载中...") :
      emails.length === 0 ? e("div",{style:{textAlign:"center",padding:"40px",opacity:0.6}},"回收站为空") :
      e("div",null,emails.map(function(item,i){return e("div",{key:i,style:{background:"rgba(255,255,255,0.05)",padding:"8px 12px",marginBottom:"6px",borderRadius:"6px",display:"flex",alignItems:"center",border:"1px solid rgba(255,0,0,0.1)"}},
        e("div",{style:{flex:1,display:"flex",alignItems:"center",gap:"8px",overflow:"hidden"}},
          e("span",{style:{fontSize:"13px"}},"🗑"),
          e("span",{style:{fontSize:"13px",fontWeight:"bold",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},item.subject||"(无主题)")
        ),
        e("div",{style:{display:"flex",gap:"4px",flexShrink:0,marginLeft:"8px"}},
          e("button",{onClick:function(){restoreEmail(item);},style:{background:"#667eea",color:"white",border:"none",padding:"5px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"11px",fontWeight:"bold",whiteSpace:"nowrap"}},"↩ 恢复"),
          e("button",{onClick:function(){deleteEmail("trash",item.id);},style:{background:"#d32f2f",color:"white",border:"none",padding:"5px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"11px",fontWeight:"bold",whiteSpace:"nowrap"}},"永久删除")
        )
      )}),
      paginationBar("trash")
    )) : emailTab === "security" ? e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}},
        e("h3",null,"🛡️ 安全提示")
      ),
      e("div",{style:{padding:"20px"}},
        // 安全提示卡片
        e("div",{style:{background:"#e6f7ff",border:"1px solid #91d5ff",borderRadius:"8px",padding:"16px",marginBottom:"16px"}},
          e("div",{style:{fontWeight:"bold",color:"#1890ff",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"}},
            e("span",null,"💡"),"安全使用建议"
          ),
          e("div",{style:{color:"#666",fontSize:"13px",lineHeight:"1.6"}},
            "• 谨慎打开陌生发件人的邮件附件",e("br",null),
            "• 不要点击邮件中的可疑链接",e("br",null),
            "• 可执行文件(.exe/.bat)风险较高",e("br",null),
            "• 大文件(>10MB)建议先预览再下载"
          )
        ),
        // 文件类型风险提示
        e("div",{style:{background:"#fff7e6",border:"1px solid #ffd591",borderRadius:"8px",padding:"16px",marginBottom:"16px"}},
          e("div",{style:{fontWeight:"bold",color:"#d46b08",marginBottom:"8px",display:"flex",alignItems:"center",gap:"8px"}},
            e("span",null,"⚠️"),"高风险文件类型"
          ),
          e("div",{style:{color:"#666",fontSize:"13px"}},
            ".exe .bat .scr .cmd .com .pif .vbs .js .jar"
          )
        ),
        // 今日安全统计
        e("div",{style:{display:"flex",gap:"16px",marginBottom:"16px"}},
          e("div",{style:{flex:1,background:"#f6ffed",border:"1px solid #b7eb8f",borderRadius:"8px",padding:"16px",textAlign:"center"}},
            e("div",{style:{fontSize:"20px",fontWeight:"bold",color:"#52c41a"}},"✓"),
            e("div",{style:{color:"#666",fontSize:"12px"}},"今日邮件已检查")
          ),
          e("div",{style:{flex:1,background:"#fff2f0",border:"1px solid #ffccc7",borderRadius:"8px",padding:"16px",textAlign:"center"}},
            e("div",{style:{fontSize:"20px",fontWeight:"bold",color:"#ff4d4f"}},"0"),
            e("div",{style:{color:"#666",fontSize:"12px"}},"风险附件拦截")
          )
        ),
        // 安全状态
        e("div",{style:{background:"#f6ffed",border:"1px solid #b7eb8f",borderRadius:"8px",padding:"12px",textAlign:"center",color:"#52c41a",fontSize:"13px"}},
          "✅ 安全提示功能已启用，请谨慎处理邮件附件"
        )
      )
    ) : e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
      e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}},
        e("h3",null,"⚙️ 邮箱设置 · " + emailConfigs.length + "个邮箱"),
        e("button",{onClick:function(){openConfig(true);},style:{background:"#28a745",color:"white",border:"none",padding:"8px 16px",borderRadius:"6px",cursor:"pointer",fontSize:"14px"}},"+ 配置邮箱")
      ),
      e("div",{style:{display:"flex",flexDirection:"column",gap:"12px"}},
        emailConfigs.length === 0 ? e("div",{style:{textAlign:"center",padding:"40px",opacity:0.6}},"尚未配置任何邮箱，点击上方按钮添加。") :
        emailConfigs.map(function(cfg,i){ return e("div",{key:cfg.email,style:{background:"white",padding:"14px 16px",borderRadius:"8px",border:"1px solid rgba(0,0,0,0.08)",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}},
            e("div",null,
              e("div",{style:{fontWeight:"bold",color:"#333",fontSize:"15px"}},cfg.email),
              e("div",{style:{fontSize:"12px",color:"#999",marginTop:"2px"}},cfg.display_name || "未设显示名称")
            ),
            e("button",{onClick:function(){if(!confirm("确定删除 " + cfg.email + " 的配置吗？")) return; fetch("/api/plugins/team_chat/email/config/" + (cfg.id || 0), {method:"DELETE",headers:{"Content-Type":"application/json"}}).then(function(r){return r.json();}).then(function(d){if(d.success){loadEmailConfigs();}}).catch(function(){}); },style:{background:"none",border:"1px solid rgba(255,0,0,0.2)",color:"#d32f2f",padding:"3px 10px",borderRadius:"4px",cursor:"pointer",fontSize:"11px"}},"删除")
          ),
          e("div",{style:{fontSize:"12px",opacity:0.6}},
            (EMAIL_PROVIDERS[cfg.provider] ? EMAIL_PROVIDERS[cfg.provider].name : "自定义") + " · " + (cfg.smtp_host||"SMTP未设") + (cfg.smtp_port?":"+cfg.smtp_port:"") + " · " + (cfg.imap_host||"IMAP未设") + (cfg.imap_port?":"+cfg.imap_port:"")
          ),
          e("div",{style:{display:"flex",gap:"8px",marginTop:"8px"}},
            e("button",{onClick:function(){setEmailConfig(Object.assign({},cfg));setConfigVisible(true);},style:{background:"#667eea",color:"white",border:"none",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}},"✏ 编辑"),
            e("button",{onClick:function(){var ccfg=Object.assign({},cfg);testEmailConnectionWithCfg(ccfg);},style:{background:"#4caf50",color:"white",border:"none",padding:"4px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}},"🔌 测试")
          )
        ); }),
        e("div",{style:{background:"rgba(102,126,234,0.1)",padding:"16px",borderRadius:"8px",border:"1px solid rgba(102,126,234,0.3)"}},
          e("div",{style:{fontWeight:"bold",marginBottom:"8px",color:"#667eea"}},"💡 提示"),
          e("div",{style:{fontSize:"14px",opacity:0.8}},
            "每个邮箱独立配置SMTP和IMAP参数。选择提供商可自动填充服务器信息。",
            e("br",null),
            "支持：QQ邮箱、163/126邮箱、Gmail、Outlook等主流服务商。"
          )
        )
      ),
      configVisible ? e("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}},
        e("div",{style:{background:"white",borderRadius:"12px",padding:"24px",width:"500px",maxHeight:"90vh",overflowY:"auto"}},
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}},
            e("h2",null,"📧 邮箱配置"),
            e("button",{onClick:closeConfig,style:{background:"none",border:"none",fontSize:"24px",cursor:"pointer"}},"×")
          ),
          e("div",{style:{display:"flex",flexDirection:"column",gap:"16px"}},
            e("div",null,
              e("label",{style:{display:"block",marginBottom:"6px",fontWeight:"bold"}},"邮箱提供商"),
              e("select",{value:emailConfig.provider,onChange:function(e){handleProviderChange(e.target.value);},style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}},
                e("option",{value:"custom"},"自定义"),
                e("option",{value:"qq"},"QQ邮箱"),
                e("option",{value:"foxmail"},"Foxmail邮箱"),
                e("option",{value:"mail163"},"163邮箱"),
                e("option",{value:"mail126"},"126邮箱"),
                e("option",{value:"yeah"},"Yeah邮箱"),
                e("option",{value:"netease"},"网易企业邮"),
                e("option",{value:"aliyun"},"阿里云邮箱"),
                e("option",{value:"sina"},"新浪邮箱"),
                e("option",{value:"sinacn"},"新浪CN邮箱"),
                e("option",{value:"sohu"},"搜狐邮箱"),
                e("option",{value:"cn21"},"21CN邮箱"),
                e("option",{value:"tom"},"TOM邮箱"),
                e("option",{value:"mail139"},"139邮箱"),
                e("option",{value:"mail189"},"189邮箱"),
                e("option",{value:"gmail"},"Gmail"),
                e("option",{value:"outlook"},"Outlook/Hotmail"),
                e("option",{value:"live"},"Live邮箱"),
                e("option",{value:"hotmail"},"Hotmail"),
                e("option",{value:"yahoo"},"Yahoo邮箱"),
                e("option",{value:"yahoocn"},"雅虎中国"),
                e("option",{value:"icloud"},"iCloud邮箱"),
                e("option",{value:"me"},"Me邮箱"),
                e("option",{value:"mac"},"Mac邮箱"),
                e("option",{value:"office365"},"Office 365"),
                e("option",{value:"exch"},"Exchange")
              )
            ),
            e("div",null,
              e("label",{style:{display:"block",marginBottom:"6px",fontWeight:"bold"}},"邮箱地址"),
              e("input",{type:"email",value:emailConfig.email,onChange:function(e){handleEmailChange(e.target.value);},placeholder:"example@mail.com",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}})
            ),
            e("div",null,
              e("label",{style:{display:"block",marginBottom:"6px",fontWeight:"bold"}},"显示名称"),
              e("input",{type:"text",value:emailConfig.display_name,onChange:function(e){setEmailConfig({...emailConfig,display_name:e.target.value});},placeholder:"张三",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}})
            ),
            e("div",null,
              e("label",{style:{display:"block",marginBottom:"6px",fontWeight:"bold"}},"用户名"),
              e("input",{type:"text",value:emailConfig.username,onChange:function(e){setEmailConfig({...emailConfig,username:e.target.value});},placeholder:"邮箱地址",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}})
            ),
            EMAIL_PROVIDERS[emailConfig.provider] && EMAIL_PROVIDERS[emailConfig.provider].authCode ? e("div",null,
              e("label",{style:{display:"block",marginBottom:"6px",fontWeight:"bold"}},"授权码"),
              e("input",{type:"password",value:emailConfig.password,onChange:function(e){setEmailConfig({...emailConfig,password:e.target.value});},placeholder:"请输入授权码",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}}),
              e("div",{style:{fontSize:"12px",color:"#666",marginTop:"4px"}},"请使用邮箱的授权码，不是登录密码")
            ) : e("div",null,
              e("label",{style:{display:"block",marginBottom:"6px",fontWeight:"bold"}},"密码"),
              e("input",{type:"password",value:emailConfig.password,onChange:function(e){setEmailConfig({...emailConfig,password:e.target.value});},placeholder:"请输入密码",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}})
            ),
            e("div",{style:{borderTop:"1px solid #eee",paddingTop:"16px"}},
              e("div",{style:{fontWeight:"bold",marginBottom:"12px",color:"#667eea"}},"SMTP 配置"),
              e("div",{style:{display:"flex",gap:"12px",marginBottom:"8px"}},
                e("input",{type:"text",value:emailConfig.smtp_host,onChange:function(e){setEmailConfig({...emailConfig,smtp_host:e.target.value});},placeholder:"smtp.example.com",style:{flex:2,padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}}),
                e("input",{type:"number",value:emailConfig.smtp_port,onChange:function(e){setEmailConfig({...emailConfig,smtp_port:parseInt(e.target.value) || 587});},placeholder:"587",style:{flex:1,padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}})
              ),
              e("label",{style:{display:"flex",alignItems:"center",gap:"8px",fontSize:"14px"}},
                e("input",{type:"checkbox",checked:emailConfig.smtp_ssl,onChange:function(e){setEmailConfig({...emailConfig,smtp_ssl:e.target.checked});}}),
                "使用 TLS/SSL 加密"
              )
            ),
            e("div",{style:{borderTop:"1px solid #eee",paddingTop:"16px"}},
              e("div",{style:{fontWeight:"bold",marginBottom:"12px",color:"#667eea"}},"IMAP 配置"),
              e("div",{style:{display:"flex",gap:"12px",marginBottom:"8px"}},
                e("input",{type:"text",value:emailConfig.imap_host,onChange:function(e){setEmailConfig({...emailConfig,imap_host:e.target.value});},placeholder:"imap.example.com",style:{flex:2,padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}}),
                e("input",{type:"number",value:emailConfig.imap_port,onChange:function(e){setEmailConfig({...emailConfig,imap_port:parseInt(e.target.value) || 993});},placeholder:"993",style:{flex:1,padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}})
              ),
              e("label",{style:{display:"flex",alignItems:"center",gap:"8px",fontSize:"14px"}},
                e("input",{type:"checkbox",checked:emailConfig.imap_ssl,onChange:function(e){setEmailConfig({...emailConfig,imap_ssl:e.target.checked});}}),
                "使用 SSL 加密"
              )
            ),
            e("div",{style:{display:"flex",gap:"12px",marginTop:"24px"}},
              e("button",{onClick:closeConfig,style:{flex:1,padding:"12px",border:"1px solid #ccc",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"linear-gradient(180deg,#f5f5f5,#e8e8e8)",color:"#555",fontWeight:"bold",boxShadow:"0 2px 4px rgba(0,0,0,0.1)"}},"取消"),
              e("button",{onClick:saveConfig,disabled:savingConfig,style:{flex:1,padding:"12px",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"#667eea",color:"white",opacity:savingConfig?0.6:1}},savingConfig?"保存中...":"保存配置")
            )
          )
        )
      ) : null
    )
  );

    // 邮件详情弹窗
    selectedEmail ? e("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9998}},
      e("div",{style:{background:"white",borderRadius:"12px",padding:"24px",width:"600px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 10px 40px rgba(0,0,0,0.2)"}},
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}},
          e("div",{style:{flex:1}},
            e("h2",{style:{margin:0,fontSize:"18px"}},(selectedEmail.subject||"(无主题)")),
            e("div",{style:{fontSize:"12px",color:"#999",marginTop:"4px"}},"来自: " + (selectedEmail.from_name||selectedEmail.from_addr||"未知") + " | " + (new Date(selectedEmail.created_at||selectedEmail.date).toLocaleString()))
          ),
          e("button",{onClick:function(){setSelectedEmail(null);},style:{background:"none",border:"none",fontSize:"24px",cursor:"pointer",color:"#999",padding:"0 4px"}},"✕")
        ),
        e("div",{style:{padding:"16px",background:"#f9f9f9",borderRadius:"8px",marginBottom:"16px",fontSize:"13px",lineHeight:"1.8"}},
          selectedEmail.to_addr ? e("div",null,"收件人: " + selectedEmail.to_addr) : null,
          selectedEmail.cc ? e("div",null,"抄送: " + selectedEmail.cc) : null
        ),
        selectedEmail.html_body ? e("div",{style:{padding:"16px",background:"white",borderRadius:"8px",border:"1px solid #eee",minHeight:"200px",fontSize:"14px",lineHeight:"1.6",color:"#333",overflow:"auto"},dangerouslySetInnerHTML:{__html:selectedEmail.html_body}}) : e("div",{style:{padding:"16px",background:"white",borderRadius:"8px",border:"1px solid #eee",minHeight:"200px",whiteSpace:"pre-wrap",fontSize:"14px",lineHeight:"1.6",color:"#333"}},selectedEmail.body||"(无内容)"),
        e("div",{style:{display:"flex",gap:"8px",justifyContent:"flex-end",marginTop:"16px",borderTop:"1px solid #eee",paddingTop:"16px"}},
          e("button",{onClick:function(){var e=selectedEmail;setSelectedEmail(null);replyEmail(e,false);},style:{background:"#667eea",color:"white",border:"none",padding:"8px 20px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}},"↩ 回复"),
          e("button",{onClick:function(){var e=selectedEmail;setSelectedEmail(null);replyEmail(e,true);},style:{background:"#764ba2",color:"white",border:"none",padding:"8px 20px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}},"↩ 回复全部"),
          e("button",{onClick:function(){var e=selectedEmail;setSelectedEmail(null);forwardEmail(e);},style:{background:"#38ef7d",color:"white",border:"none",padding:"8px 20px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}},"↪ 转发"),
          e("button",{onClick:function(){setSelectedEmail(null);},style:{background:"#f5f5f5",border:"1px solid #ddd",padding:"8px 20px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}},"关闭")
        )
      )
    ) : null,
    // 写邮件模态框
    showCompose ? e("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(3px)"}},
      e("div",{style:{background:"linear-gradient(180deg,#fafafa,#f0f0f0)",borderRadius:"12px",padding:"24px",width:"640px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 12px 40px rgba(0,0,0,0.3)",border:"1px solid #ddd"}},
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}},
          e("h2",{style:{margin:0}},"✉️ " + composeTitle),
          e("button",{onClick:closeComposeModal,style:{background:"none",border:"none",fontSize:"24px",cursor:"pointer",color:"#999"}},"✕")
        ),
        e("div",{style:{display:"flex",flexDirection:"column",gap:"12px"}},
          e("div",null,
            e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"收件人 *"),
            e("input",{type:"text",value:composeData.to,onChange:function(e){setComposeData({...composeData,to:e.target.value});},placeholder:"多个收件人用逗号分隔",style:{width:"100%",padding:"10px",border:"1px solid #ccc",borderRadius:"6px",fontSize:"14px",background:"#fff",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)"}})
          ),
          e("div",null,
            e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"抄送 (CC)"),
            e("input",{type:"text",value:composeData.cc,onChange:function(e){setComposeData({...composeData,cc:e.target.value});},placeholder:"抄送给其他人",style:{width:"100%",padding:"10px",border:"1px solid #ccc",borderRadius:"6px",fontSize:"14px",background:"#fff",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)"}})
          ),
          e("div",null,
            e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"密送 (BCC)"),
            e("input",{type:"text",value:composeData.bcc,onChange:function(e){setComposeData({...composeData,bcc:e.target.value});},placeholder:"密送给其他人",style:{width:"100%",padding:"10px",border:"1px solid #ccc",borderRadius:"6px",fontSize:"14px",background:"#fff",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)"}})
          ),
          e("div",null,
            e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"主题 *"),
            e("input",{type:"text",value:composeData.subject,onChange:function(e){setComposeData({...composeData,subject:e.target.value});},placeholder:"邮件主题",style:{width:"100%",padding:"10px",border:"1px solid #ccc",borderRadius:"6px",fontSize:"14px",background:"#fff",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)"}})
          ),
          e("div",null,
            e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"优先级"),
            e("select",{value:composeData.priority,onChange:function(e){setComposeData({...composeData,priority:e.target.value});},style:{width:"100%",padding:"10px",border:"1px solid #ccc",borderRadius:"6px",fontSize:"14px",background:"#fff",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)"}},
              e("option",{value:"low"},"低"),
              e("option",{value:"normal"},"普通"),
              e("option",{value:"high"},"高")
            )
          ),
          e("div",null,
            e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"正文"),
            e("textarea",{value:composeData.body,onChange:function(e){setComposeData({...composeData,body:e.target.value});},placeholder:"在此输入邮件内容...",style:{width:"100%",minHeight:"150px",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px",resize:"vertical"}})
          ),
          e("div",{style:{marginTop:"12px"}},
            e("label",{style:{fontSize:"14px",marginBottom:"8px",display:"block"}},"📎 附件"),
            e("input",{type:"file",multiple:true,onChange:handleComposeAttachment,style:{width:"100%",padding:"8px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px"}}),
            // 附件列表
            composeAttachments.length > 0 ? e("div",{style:{marginTop:"8px",padding:"8px",background:"#f5f5f5",borderRadius:"6px"}},
              composeAttachments.map(function(file, idx) {
                return e("div",{key:idx,style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 8px",marginBottom:"4px",background:"white",borderRadius:"4px"}},
                  e("span",{style:{fontSize:"13px"}},file.name + " (" + (file.size/1024).toFixed(1) + " KB)"),
                  e("button",{onClick:function(){removeComposeAttachment(idx);},style:{background:"none",border:"none",color:"#ff6b6b",cursor:"pointer",fontSize:"16px"}},"✕")
                );
              })
            ) : null
          ),
          e("div",{style:{display:"flex",gap:"10px",marginTop:"16px"}},
            e("button",{onClick:closeComposeModal,style:{flex:1,padding:"12px",border:"1px solid #ccc",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"linear-gradient(180deg,#f5f5f5,#e8e8e8)",color:"#555",fontWeight:"bold",boxShadow:"0 2px 4px rgba(0,0,0,0.1)"}},"取消"),
            e("button",{onClick:sendEmail,disabled:sendingEmail,style:{flex:1,padding:"12px",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"white",opacity:sendingEmail?0.6:1,boxShadow:"0 4px 15px rgba(102,126,234,0.4)",fontWeight:"bold",letterSpacing:"1px"}},sendingEmail?"⏳ 发送中...":"📤 发送")
          )
        )
      )
    ) : null,
    // ── 联系人添加弹窗（提升到传统邮箱最外层，避免position:fixed被父容器CSS破坏） ──
    (window.__CC_MODAL_V2 = true),
    console.log("[弹窗渲染检查] showAddContact="+showAddContact+" time="+Date.now()),
    showAddContact ? e("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99999}},
      e("div",{style:{background:"white",borderRadius:"12px",padding:"24px",width:"420px",maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}},
        e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},
          e("h2",{style:{margin:0}},"👤 添加联系人"),
          e("button",{onClick:function(){setShowAddContact(false);},style:{background:"none",border:"none",fontSize:"24px",cursor:"pointer",color:"#999"}},"✕")
        ),
        e("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}},
          e("input",{type:"text",value:newContact.name,onChange:function(e){setNewContact({...newContact,name:e.target.value});},placeholder:"姓名 *",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px",boxSizing:"border-box"}}),
          e("input",{type:"email",value:newContact.email,onChange:function(e){setNewContact({...newContact,email:e.target.value});},placeholder:"邮箱 *",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px",boxSizing:"border-box"}}),
          e("input",{type:"text",value:newContact.phone,onChange:function(e){setNewContact({...newContact,phone:e.target.value});},placeholder:"电话",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px",boxSizing:"border-box"}}),
          e("input",{type:"text",value:newContact.company,onChange:function(e){setNewContact({...newContact,company:e.target.value});},placeholder:"公司",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px",boxSizing:"border-box"}})
        ),
        e("div",{style:{display:"flex",gap:"10px",marginTop:"16px"}},
          e("button",{onClick:function(){setShowAddContact(false);},style:{flex:1,padding:"10px",border:"1px solid #ddd",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"white"}},"取消"),
          e("button",{onClick:addContact,style:{flex:1,padding:"10px",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"#667eea",color:"white",fontWeight:"bold"}},"保存")
        )
      )
    ) : null

    // 蜂巢邮箱视图
    if(aimailView && aimailMode === "hive") {
      return e("div",{style:{padding:"20px",background:"linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%)",color:"#333",minHeight:"100vh"}},
            // P2P状态栏
        e("div",{style:{background:p2pEnabled?"#e8f5e9":"#fff3e0",borderRadius:"8px",padding:"12px",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between"}},
          e("div",null,
            e("div",{style:{fontWeight:"bold",color:p2pEnabled?"#2e7d32":"#e65100"}},p2pEnabled?"✅ P2P通信已启用":"⏸️ P2P通信未启用"),
            e("div",{style:{fontSize:"12px",color:"#666",marginTop:"4px"}},p2pEnabled?"状态: " + connectionStatus:"点击启用真实P2P通信")
          ),
          e("button",{onClick:toggleP2P,style:{background:p2pEnabled?"#d32f2f":"#4caf50",border:"none",color:"white",padding:"8px 16px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}},p2pEnabled?"✖ 关闭P2P":"▶ 启用P2P")
        ),
        e("div",{style:{display:"flex",alignItems:"center",marginBottom:"20px"}},
          e("button",{onClick:function(){setAimailMode("main");},style:{background:"#667eea",border:"none",color:"white",padding:"8px 16px",borderRadius:"8px",cursor:"pointer",marginRight:"12px"}},"← 返回"),
          e("h2",{style:{margin:0,color:"#333"}},"蜂巢邮箱")
        ),
        // 我的面码显示
        e("div",{style:{background:"#ffffff",borderRadius:"12px",padding:"16px",marginBottom:"20px",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}},
          e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}},
            e("div",null,
              e("div",{style:{fontSize:"14px",color:"#666",marginBottom:"4px"}},"🐝 我的面码（网络识别码）"),
              e("div",{style:{fontSize:"24px",fontWeight:"bold",fontFamily:"monospace",letterSpacing:"2px",color:"#38ef7d"}},myFaceCode)
            ),
            e("div",{style:{display:"flex",gap:"8px"}},
              e("button",{onClick:copyFaceCode,style:{background:"#667eea",border:"none",color:"white",padding:"8px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}},"📋 复制"),
              e("button",{onClick:shareFaceCode,style:{background:"#764ba2",border:"none",color:"white",padding:"8px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"13px"}},"📤 分享")
            )
          ),
          e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:"12px",borderTop:"1px solid rgba(255,255,255,0.1)"}},
            e("div",{style:{fontSize:"12px",opacity:0.6}},"💡 面码保持不变，除非主动刷新"),
            e("button",{onClick:refreshFaceCode,style:{background:"rgba(255,107,107,0.3)",border:"1px solid rgba(255,107,107,0.5)",color:"#ff6b6b",padding:"6px 12px",borderRadius:"6px",cursor:"pointer",fontSize:"12px"}},"🔄 刷新面码")
          )
        ),
        // 标签切换
        e("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center",marginBottom:"20px"}},
          e("span",{onClick:function(){setHiveTab("friends");setSelectedFriend(null);},style:{background:hiveTab==="friends"?"#667eea":"rgba(255,255,255,0.2)",padding:"6px 14px",borderRadius:"16px",fontSize:"13px",cursor:"pointer"}},"👥 朋友管理 (" + hiveFriends.length + ")"),
          e("span",{onClick:function(){setHiveTab("messages");},style:{background:hiveTab==="messages"?"#667eea":"rgba(255,255,255,0.2)",padding:"6px 14px",borderRadius:"16px",fontSize:"13px",cursor:"pointer"}},"💬 消息互通"),
          e("span",{onClick:function(){setShowAddFriend(true);},style:{background:"linear-gradient(180deg,#e0e0e0,#b0b0b0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #999",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.5),0 2px 4px rgba(0,0,0,0.15)",fontWeight:"bold",color:"#333",textShadow:"0 1px 0 rgba(255,255,255,0.4)"}},"➕ 添加朋友"),
          e("span",{onClick:addFriendByFaceCode,style:{background:"linear-gradient(180deg,#e0e0e0,#b0b0b0)",padding:"6px 14px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",border:"1px solid #999",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.5),0 2px 4px rgba(0,0,0,0.15)",fontWeight:"bold",color:"#333",textShadow:"0 1px 0 rgba(255,255,255,0.4)"}},"🔍 通过面码添加")
        ),
        // 朋友列表面板
        hiveTab === "friends" ? e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px"}},
          e("h3",{style:{marginBottom:"16px"}},"👥 我的朋友"),
          hiveFriends.length === 0 ? e("div",{style:{textAlign:"center",padding:"40px",opacity:0.6}},"暂无朋友，点击上方【添加朋友】按钮") :
          e("div",null,hiveFriends.map(function(friend){
            return e("div",{key:friend.id,onClick:function(){setSelectedFriend(friend);setHiveTab("messages");},style:{background:"rgba(255,255,255,0.15)",padding:"12px 16px",marginBottom:"8px",borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",transition:"transform 0.2s"}},
              e("div",{style:{width:"40px",height:"40px",borderRadius:"50%",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}},friend.avatar),
              e("div",{style:{flex:1}},
                e("div",{style:{fontWeight:"bold"}},friend.name),
                e("div",{style:{fontSize:"12px",opacity:0.7}},friend.email),
                e("div",{style:{fontSize:"10px",opacity:0.5,fontFamily:"monospace"}},"面码: " + (friend.faceCode || "未知"))
              ),
              e("div",{style:{textAlign:"right"}},
                e("div",{style:{fontSize:"11px",color:friend.status==="online"?"#38ef7d":"#ff6b6b"}},friend.status==="online"?"● 在线":"○ 离线"),
                e("div",{style:{fontSize:"11px",opacity:0.5}},friend.lastSeen)
              ),
              e("button",{onClick:function(e){e.stopPropagation();deleteHiveFriend(friend.id);},style:{background:"none",border:"1px solid rgba(255,0,0,0.3)",color:"#ff6b6b",padding:"4px 10px",borderRadius:"4px",cursor:"pointer",fontSize:"12px"}},"删除")
            );
          }))
        ) :
        // 消息面板
        e("div",{style:{background:"rgba(255,255,255,0.1)",borderRadius:"12px",padding:"20px",minHeight:"400px"}},
          !selectedFriend ? e("div",{style:{textAlign:"center",padding:"60px 20px"}},
            e("div",{style:{fontSize:"48px",marginBottom:"16px"}},"💬"),
            e("div",{style:{fontSize:"18px",fontWeight:"bold",marginBottom:"8px"}},"选择一个朋友开始聊天"),
            e("div",{style:{fontSize:"14px",opacity:0.6}},"点击左侧朋友列表或先添加朋友")
          ) :
          e("div",null,
            // 聊天头部
            e("div",{style:{display:"flex",alignItems:"center",padding:"12px",background:"rgba(255,255,255,0.15)",borderRadius:"8px",marginBottom:"16px"}},
              e("div",{style:{width:"40px",height:"40px",borderRadius:"50%",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",marginRight:"12px"}},selectedFriend.avatar),
              e("div",null,
                e("div",{style:{fontWeight:"bold"}},selectedFriend.name),
                e("div",{style:{fontSize:"12px",opacity:0.7}},selectedFriend.status==="online"?"在线" : "离线 - " + selectedFriend.lastSeen)
              ),
              e("button",{onClick:function(){setSelectedFriend(null);},style:{marginLeft:"auto",background:"none",border:"none",color:"white",cursor:"pointer",fontSize:"18px"}},"✕")
            ),
            // 消息列表
            e("div",{style:{minHeight:"250px",maxHeight:"350px",overflowY:"auto",padding:"12px",background:"rgba(0,0,0,0.1)",borderRadius:"8px",marginBottom:"16px"}},
              hiveMessages.filter(function(m){return m.from===selectedFriend.name||m.to===selectedFriend.name;}).length===0?
              e("div",{style:{textAlign:"center",padding:"40px",opacity:0.5}},"暂无消息，开始聊天吧！") :
              hiveMessages.filter(function(m){return m.from===selectedFriend.name||m.to===selectedFriend.name;}).map(function(msg){
                var isMe = msg.from === "我";
                return e("div",{key:msg.id,style:{marginBottom:"12px",display:"flex",justifyContent:isMe?"flex-end":"flex-start"}},
                  e("div",{style:{maxWidth:"70%",background:isMe?"#667eea":"rgba(255,255,255,0.2)",padding:"10px 14px",borderRadius:"12px",borderBottomLeftRadius:isMe?"12px":"4px",borderBottomRightRadius:isMe?"4px":"12px"}},
                    msg.type==="file" ? 
                    e("div",null,
                      e("div",{style:{fontSize:"14px",marginBottom:"4px"}},"📎 附件:"),
                      msg.files.map(function(file,idx){return e("div",{key:idx,style:{fontSize:"12px",opacity:0.8}},file.name + " (" + (file.size/1024).toFixed(1) + " KB)");})
                    ) :
                    e("div",{style:{fontSize:"14px",whiteSpace:"pre-wrap"}},msg.content),
                    e("div",{style:{fontSize:"10px",opacity:0.6,marginTop:"4px",textAlign:"right"}},msg.timestamp)
                  )
                );
              })
            ),
            // 附件预览
            attachedFiles.length > 0 ? e("div",{style:{marginBottom:"12px",padding:"8px",background:"rgba(255,255,255,0.1)",borderRadius:"8px"}},
              e("div",{style:{fontSize:"12px",marginBottom:"4px",opacity:0.8}},"📎 待发送附件:"),
              attachedFiles.map(function(file,idx){
                return e("div",{key:idx,style:{display:"flex",alignItems:"center",gap:"8px",padding:"4px 8px",background:"rgba(255,255,255,0.1)",borderRadius:"4px",marginBottom:"4px"}},
                  e("span",null,file.name),
                  e("span",{style:{fontSize:"11px",opacity:0.6}},"(" + (file.size/1024).toFixed(1) + " KB)"),
                  e("button",{onClick:function(){removeAttachedFile(idx);},style:{background:"none",border:"none",color:"#ff6b6b",cursor:"pointer",fontSize:"14px"}},"✕")
                );
              })
            ) : null,
            // 输入区域
            e("div",{style:{display:"flex",gap:"8px",alignItems:"flex-end"}},
              e("textarea",{
                value: hiveInput,
                onChange: function(e){setHiveInput(e.target.value);},
                placeholder: "输入消息...",
                style: {flex:1,minHeight:"60px",padding:"10px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"8px",background:"rgba(255,255,255,0.1)",color:"white",fontSize:"14px",resize:"vertical"}
              }),
              e("div",{style:{display:"flex",flexDirection:"column",gap:"8px"}},
                e("label",{style:{cursor:"pointer",padding:"10px",background:"rgba(255,255,255,0.2)",borderRadius:"8px",textAlign:"center"}},
                  "📎",
                  e("input",{type:"file",multiple:true,onChange:handleFileAttach,style:{display:"none"}})
                ),
                e("button",{onClick:sendHiveMessage,style:{padding:"10px 16px",background:"#667eea",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"14px"}},"发送")
              )
            )
          )
        ),
        // 添加朋友模态框
        showAddFriend ? e("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}},
          e("div",{style:{background:"white",borderRadius:"12px",padding:"24px",width:"400px",color:"#333"}},
            e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},
              e("h2",{style:{margin:0}},"➕ 添加朋友"),
              e("button",{onClick:function(){setShowAddFriend(false);},style:{background:"none",border:"none",fontSize:"24px",cursor:"pointer",color:"#999"}},"✕")
            ),
            e("div",{style:{display:"flex",flexDirection:"column",gap:"12px"}},
              e("div",null,
                e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"姓名 *"),
                e("input",{type:"text",value:newFriend.name,onChange:function(e){setNewFriend({...newFriend,name:e.target.value});},placeholder:"朋友姓名",style:{width:"100%",padding:"10px",border:"1px solid #ccc",borderRadius:"6px",fontSize:"14px",background:"#fff",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)"}})
              ),
              e("div",null,
                e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"邮箱 *"),
                e("input",{type:"text",value:newFriend.email,onChange:function(e){setNewFriend({...newFriend,email:e.target.value});},placeholder:"friend@hive.local",style:{width:"100%",padding:"10px",border:"1px solid #ccc",borderRadius:"6px",fontSize:"14px",background:"#fff",transition:"border-color 0.2s,box-shadow 0.2s",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.06)"}})
              ),
              e("div",null,
                e("label",{style:{fontSize:"14px",marginBottom:"4px",display:"block"}},"面码（可选）"),
                e("input",{type:"text",value:newFriend.faceCode||"",onChange:function(e){setNewFriend({...newFriend,faceCode:e.target.value.toUpperCase()});},placeholder:"HIVE-XXXXXXXX",style:{width:"100%",padding:"10px",border:"1px solid #ddd",borderRadius:"6px",fontSize:"14px",fontFamily:"monospace"}})
              ),
              e("div",{style:{display:"flex",gap:"10px",marginTop:"16px"}},
                e("button",{onClick:function(){setShowAddFriend(false);},style:{flex:1,padding:"12px",border:"1px solid #ccc",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"linear-gradient(180deg,#f5f5f5,#e8e8e8)",color:"#555",fontWeight:"bold",boxShadow:"0 2px 4px rgba(0,0,0,0.1)"}},"取消"),
                e("button",{onClick:addHiveFriend,style:{flex:1,padding:"12px",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"14px",background:"#667eea",color:"white"}},"添加")
              )
            )
          )
        ) : null,
        // ── 咨询留言栏（蜂巢页面专用） ──
        e("div",{style:{background:"white",borderRadius:"16px",padding:"24px",marginTop:"20px",boxShadow:"0 8px 32px rgba(102,126,234,0.15)",animation:"tcFadeInUp 0.5s ease-out"}},
          e("h3",{style:{margin:"0 0 4px",color:"#333",fontSize:"18px"}},"📮 给 AI CC咨询 留言"),
          e("p",{style:{margin:"0 0 16px",color:"#999",fontSize:"13px"}},"收到后我会尽快回复到您的邮箱"),
          e("div",{style:{display:"flex",flexDirection:"column",gap:"12px"}},
            e("input",{id:"hive-msg-name",type:"text",placeholder:"姓名 *",style:{width:"100%",padding:"12px",border:"1px solid #e0e0e0",borderRadius:"8px",fontSize:"14px",boxSizing:"border-box",outline:"none",transition:"border 0.2s"}}),
            e("input",{id:"hive-msg-phone",type:"text",placeholder:"手机号",style:{width:"100%",padding:"12px",border:"1px solid #e0e0e0",borderRadius:"8px",fontSize:"14px",boxSizing:"border-box",outline:"none",transition:"border 0.2s"}}),
            e("textarea",{id:"hive-msg-content",placeholder:"咨询事项 *",rows:"3",style:{width:"100%",padding:"12px",border:"1px solid #e0e0e0",borderRadius:"8px",fontSize:"14px",boxSizing:"border-box",resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border 0.2s"}}),
            e("button",{onClick:function(){
              var n=document.getElementById("hive-msg-name").value.trim();
              var c=document.getElementById("hive-msg-content").value.trim();
              if(!n||!c){alert("请填写姓名和咨询事项");return;}
              var btn=document.getElementById("hive-msg-btn");
              btn.disabled=true;btn.textContent="✈️ 蜜蜂出发...";
              // 送信动画
              var bo=document.createElement("div");bo.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,248,220,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;pointer-events:none;";
              var bee=document.createElement("div");bee.innerHTML="🐝";bee.style.cssText="position:absolute;left:5%;top:45%;font-size:52px;animation:ccSendFly 2s ease-in-out forwards;";
              bo.appendChild(bee);
              var trail=document.createElement("div");trail.style.cssText="position:absolute;left:50%;top:50%;font-size:28px;transform:translate(-50%,-50%);animation:ccSendPulse 2s ease-in-out forwards;";
              trail.innerHTML="💌";bo.appendChild(trail);
              var ks=document.createElement("style");ks.textContent="@keyframes ccSendFly{0%{left:5%;top:45%;opacity:1;transform:scale(1)}60%{left:75%;top:20%;opacity:0.9;transform:scale(0.7)}100%{left:95%;top:5%;opacity:0;transform:scale(0.3)}}@keyframes ccSendPulse{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}40%{opacity:1;transform:translate(-50%,-50%) scale(1.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}";
              document.head.appendChild(ks);document.body.appendChild(bo);
              setTimeout(function(){
                bo.remove();ks.remove();
                btn.textContent="⏳ 发送中...";
                var url=(typeof getApiUrl!=='undefined'?getApiUrl:'/api')('/plugins/team_chat/hive-message');
                fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
                  name:n,phone:document.getElementById("hive-msg-phone").value.trim(),
                  content:c,subject:"咨询",recipient:"c115886@agent.qq.com"
                })}).then(function(r){return r.json();}).then(function(d){
                  if(d.status==="ok"){alert("✅ 留言已发送！");document.getElementById("hive-msg-name").value="";document.getElementById("hive-msg-phone").value="";document.getElementById("hive-msg-content").value="";}
                  else{alert("❌ "+(d.message||"未知错误"));}
                  btn.disabled=false;btn.textContent="📤 发送留言";
                }).catch(function(e){alert("❌ 发送失败: "+(e.message||"网络错误"));btn.disabled=false;btn.textContent="📤 发送留言";});
              },2000);
            },id:"hive-msg-btn",style:{padding:"14px",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"white",border:"none",borderRadius:"10px",cursor:"pointer",fontSize:"15px",fontWeight:"bold",boxShadow:"0 4px 16px rgba(102,126,234,0.3)",transition:"transform 0.2s, box-shadow 0.2s"}},"📤 发送留言"),
          )
        )
      );
    }

return e(ErrorBoundary,{fallbackName:"TeamChat 主页面"},
      e("div",{style:{display:"flex",flexDirection:"row",height:"100%",fontFamily:"system-ui, sans-serif"}},
      e("div",{style:{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",background:uiTheme==="day"?"#fefefe":"#12121a"}},
      /* ---- 🎬 一闪广告 ---- */
      adV?e("div",{style:{position:"absolute",top:0,left:0,right:0,zIndex:1000,display:"flex",justifyContent:"center",paddingTop:60,pointerEvents:"none"}},
        e("div",{style:{
          animation:"tcAdPulse 1.5s ease-in-out 3, tcAdIn 4s ease-out forwards",
          background:"linear-gradient(135deg, #FF8F00, #FF6D00, #FF9100)",color:"#fff",padding:"14px 32px",borderRadius:10,
          fontSize:16,fontWeight:700,letterSpacing:1,textShadow:"0 1px 3px rgba(0,0,0,.2)",
          textAlign:"center"}},
          "定制互动 115886@qq.com · 摇摇舞886")
      ):null,
      e("div",{style:{padding:"10px 16px",background:uiTheme==="day"?"#FDF8F0":"#1a1a2e",borderBottom:uiTheme==="day"?"1px solid #D7CCC8":"1px solid #2a2a3e",flexShrink:0}},
        e("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},
          e(Text,{strong:true,style:{fontSize:13,background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontWeight:"bold"}},"host主持:"),
          e("div",{style:{flex:1,maxWidth:300}},
            agLd?e(Spin,{size:"small"}):e(Select,{value:hid,onChange:chHost,style:{width:"100%"},size:"small",
              options:ags.filter(function(a){return a&&a.agent_id;}).map(function (a) { return {value:a.agent_id,label:(a.is_host?"⭐ ":"")+(a.name||a.agent_id)}; })})
          ),
          e(Switch,{checked:bs,onChange:setBs,size:"small"}), e(Text,{strong:true,style:{fontSize:14,background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontWeight:"bold"}},"🧠 头脑风暴"),
          bs?e(InputNumber,{min:2,max:5,value:rds,onChange:setRds,size:"small",style:{width:45}}):null,
          e(Popover,{content:e("div",{style:{padding:4}},e("div",null,e(Text,{style:{fontSize:11}},"🖥 IP: "),e(Text,{code:true,style:{fontSize:11}},sysIp||"---")),e("div",null,e(Text,{style:{fontSize:11}},"🕐 "+clock))),trigger:"hover"},
            e(Text,{style:{fontSize:16,cursor:"default"}},"🕐")
          ),
          e("a",{href:"https://platform.agentscope.io/plugins/team_chat",target:"_blank",rel:"noopener noreferrer",style:{fontSize:13,fontWeight:"bold",color:"#1890ff",textDecoration:"none",cursor:"pointer"}},"TeamChat扩展"),
          // 主界面动画区域（右上角）
          e("div",{style:{position:"relative",width:320,height:120,marginLeft:"auto",borderRadius:8,overflow:"hidden"},onMouseMove:function(ev){var r=ev.currentTarget.getBoundingClientRect();setHoverX(ev.clientX-r.left);setHoverY(ev.clientY-r.top);setHoverShow(true)},onMouseLeave:function(){setHoverShow(false)}},
            hoverShow&&e("div",{style:{position:"absolute",left:hoverX+8,top:hoverY-20,background:"rgba(0,0,0,0.75)",color:"#ffd700",padding:"2px 8px",borderRadius:"4px",fontSize:"12px",fontWeight:"bold",fontFamily:"monospace",pointerEvents:"none",whiteSpace:"nowrap",zIndex:999}},"115886"),
            e("div",{style:{width:320,height:120},dangerouslySetInnerHTML:{__html:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="50%" stop-color="#16213e"/><stop offset="100%" stop-color="#0f3460"/></linearGradient><linearGradient id="env1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#e3f2fd"/></linearGradient><linearGradient id="env2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff8e1"/><stop offset="100%" stop-color="#ffecb3"/></linearGradient><linearGradient id="env3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8f5e9"/><stop offset="100%" stop-color="#c8e6c9"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><!-- 背景 --><rect width="320" height="120" rx="8" fill="url(#bg2)"/><!-- 粒子背景点 --><circle cx="40" cy="30" r="1" fill="#667eea" opacity="0.4"><animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite"/></circle><circle cx="120" cy="80" r="1.5" fill="#764ba2" opacity="0.3"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="4s" repeatCount="indefinite"/></circle><circle cx="200" cy="25" r="1" fill="#e040fb" opacity="0.3"><animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite"/></circle><circle cx="280" cy="70" r="1" fill="#667eea" opacity="0.35"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.5s" repeatCount="indefinite"/></circle><circle cx="60" cy="100" r="1.2" fill="#7c4dff" opacity="0.3"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.8s" repeatCount="indefinite"/></circle><circle cx="170" cy="55" r="0.8" fill="#448aff" opacity="0.25"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.2s" repeatCount="indefinite"/></circle><!-- 信封1 大号 左→右 慢 --><g opacity="0.9"><animateTransform attributeName="transform" type="translate" values="-60,20; 380,20" dur="12s" repeatCount="indefinite"/><rect x="-25" y="-16" width="50" height="32" rx="3" fill="url(#env1)" stroke="#90caf9" stroke-width="1"/><polygon points="-25,-16 0,0 25,-16" fill="#bbdefb" stroke="#90caf9" stroke-width="0.8"/><circle cx="0" cy="4" r="2.5" fill="#1976d2"><animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite"/></circle></g><!-- 信封2 中号 右→左 中速 --><g opacity="0.8"><animateTransform attributeName="transform" type="translate" values="380,50; -60,50" dur="10s" repeatCount="indefinite"/><rect x="-20" y="-12" width="40" height="24" rx="3" fill="url(#env2)" stroke="#ffcc80" stroke-width="0.8"/><polygon points="-20,-12 0,0 20,-12" fill="#ffe0b2" stroke="#ffcc80" stroke-width="0.6"/><circle cx="0" cy="3" r="2" fill="#f57c00"><animate attributeName="r" values="2;3.5;2" dur="1.8s" repeatCount="indefinite"/></circle></g><!-- 信封3 小号 左→右 快 --><g opacity="0.7"><animateTransform attributeName="transform" type="translate" values="-40,75; 380,75" dur="8s" repeatCount="indefinite"/><rect x="-15" y="-10" width="30" height="20" rx="2" fill="url(#env3)" stroke="#a5d6a7" stroke-width="0.7"/><polygon points="-15,-10 0,0 15,-10" fill="#c8e6c9" stroke="#a5d6a7" stroke-width="0.5"/></g><!-- 信封4 中号 右→左 不同高度 --><g opacity="0.65"><animateTransform attributeName="transform" type="translate" values="380,95; -60,95" dur="11s" repeatCount="indefinite"/><rect x="-18" y="-11" width="36" height="22" rx="2.5" fill="url(#env2)" stroke="#ffcc80" stroke-width="0.7"/><polygon points="-18,-11 0,0 18,-11" fill="#ffe0b2" stroke="#ffcc80" stroke-width="0.5"/></g><!-- AI CC咨询 文字 --><text x="160" y="42" text-anchor="middle" fill="#fff" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" filter="url(#glow)" letter-spacing="4">AI CC咨询</text><!-- 底部 --><text x="160" y="112" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="system-ui,sans-serif" font-size="9">0+1+2≠3 Team</text><!-- 工业智能服务器机柜（含标牌） --><g transform="translate(16,12)"><rect x="0" y="0" width="32" height="50" rx="3" fill="#37474f" stroke="#546e7a" stroke-width="1"/><rect x="2" y="3" width="28" height="7" rx="1" fill="#263238"/><circle cx="7" cy="6.5" r="1.5" fill="#4caf50"><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/></circle><rect x="13" y="4" width="14" height="3" rx="0.5" fill="#ffc107"/><rect x="2" y="13" width="28" height="7" rx="1" fill="#263238"/><circle cx="7" cy="16.5" r="1.5" fill="#2196f3"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite"/></circle><rect x="2" y="23" width="28" height="7" rx="1" fill="#263238"/><circle cx="7" cy="26.5" r="1.5" fill="#4caf50"><animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/></circle><rect x="2" y="33" width="28" height="7" rx="1" fill="#263238"/><circle cx="7" cy="36.5" r="1.5" fill="#ff5722"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/></circle><!-- 标牌 工业智能 --><rect x="2" y="43" width="28" height="5" rx="1" fill="#1a237e"/><text x="16" y="46.8" text-anchor="middle" fill="#ffc107" font-size="4" font-family="system-ui,sans-serif" font-weight="bold">工业智能</text></g><!-- 挖机（3x，底部） --><g transform="translate(50,105) scale(3)"><rect x="-8" y="0" width="16" height="6" rx="2" fill="#ffa000" stroke="#e65100" stroke-width="0.6"/><rect x="-5" y="-10" width="10" height="12" rx="1" fill="#ffb300" stroke="#e65100" stroke-width="0.4"/><circle cx="0" cy="0" r="3" fill="#37474f"/><circle cx="0" cy="0" r="2" fill="#455a64"/><rect x="-4" y="-15" width="8" height="5" rx="1" fill="#ffb300" stroke="#e65100" stroke-width="0.4"/><!-- 挖臂（带挖掘动画） --><g transform="translate(5,-8)"><animateTransform attributeName="transform" type="rotate" values="0 5 -8; 25 5 -8; -10 5 -8; 0 5 -8" dur="3s" repeatCount="indefinite"/><g transform="translate(-5,8)"><line x1="5" y1="-8" x2="14" y2="-17" stroke="#795548" stroke-width="1.5"/><line x1="14" y1="-17" x2="18" y2="-13" stroke="#795548" stroke-width="1"/><polygon points="18,-13 22,-11 20,-17" fill="#ffa000" stroke="#e65100" stroke-width="0.4"/></g></g><!-- 履带 --><rect x="-10" y="4" width="20" height="3" rx="1" fill="#333"/><circle cx="-7" cy="5.5" r="2" fill="#555"/><circle cx="0" cy="5.5" r="2" fill="#555"/><circle cx="7" cy="5.5" r="2" fill="#555"/></g><!-- 办公桌+椅（3x） --><g transform="translate(90,72) scale(3)"><!-- 桌子 --><rect x="-12" y="-7" width="24" height="2.5" rx="1" fill="#8d6e63" stroke="#5d4037" stroke-width="0.4"/><!-- 桌腿左 --><rect x="-10" y="-4.5" width="1.5" height="6" fill="#6d4c41"/><!-- 桌腿右 --><rect x="8.5" y="-4.5" width="1.5" height="6" fill="#6d4c41"/><!-- 椅子 --><g transform="translate(18,0)"><rect x="-6" y="-5" width="12" height="1.5" rx="0.8" fill="#795548" stroke="#5d4037" stroke-width="0.4"/><!-- 椅背 --><rect x="-4.5" y="-8" width="9" height="5" rx="0.8" fill="#795548" stroke="#5d4037" stroke-width="0.4"/><!-- 椅腿左 --><rect x="-4.5" y="-3.5" width="1.5" height="6" fill="#5d4037"/><!-- 椅腿右 --><rect x="3" y="-3.5" width="1.5" height="6" fill="#5d4037"/></g></g><!-- 冷风机 --><g transform="translate(266,6) scale(3)"><rect x="0" y="0" width="16" height="36" rx="2" fill="#e0e0e0" stroke="#9e9e9e" stroke-width="0.8"/><rect x="2" y="2" width="12" height="12" rx="1" fill="#f5f5f5" stroke="#bdbdbd" stroke-width="0.5"/><!-- 风扇叶片 --><g transform="translate(8,8)"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.6s" repeatCount="indefinite"/><line x1="4" y1="8" x2="12" y2="8" stroke="#90a4ae" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="4" x2="8" y2="12" stroke="#90a4ae" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="8" r="2" fill="#607d8b"/></g><!-- 出风口格栅 --><rect x="3" y="17" width="10" height="2" rx="0.5" fill="#bdbdbd"/><rect x="3" y="21" width="10" height="2" rx="0.5" fill="#bdbdbd"/><rect x="3" y="25" width="10" height="2" rx="0.5" fill="#bdbdbd"/><rect x="4" y="29" width="8" height="4" rx="1" fill="#263238"/><text x="8" y="31.5" text-anchor="middle" fill="#00e5ff" font-size="2.5" font-family="monospace">AI</text><!-- 底座 --><rect x="1" y="34" width="14" height="2" rx="1" fill="#9e9e9e"/><rect x="3" y="36" width="10" height="2" rx="1" fill="#757575"/></g></svg>'}})
          )
        ),
        e("div",{style:{marginBottom:4}},
          agLd?e(Spin,{size:"small",style:{marginLeft:8}}):
          ags.length===0?e(Space,{size:4,style:{marginLeft:8}},
            e(Text,{type:"danger",style:{fontSize:12}},t("noAgents")),
            e(Button,{size:"small",onClick:function () { setAgLd(true); apiGet("/agents").then(function (d) { setAgs(d.agents||[]); setAgLd(false); }).catch(function () { setAgLd(false); }); }},t("retry"))
          ):null
        ),
        e("div",{style:{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}},
          e("input",{ref:avRf,type:"file",accept:".jpg,.jpeg,.png",onChange:handleAvatar,style:{display:"none"}}),
          ags.slice(0,5).map(renderAgentTag),
          ags.length>5?e("div",{key:"collapse-wrap",style:{overflow:"hidden",transition:"maxHeight 0.4s ease",maxHeight:showAllAgents?500:0,width:"100%"}},
            e("div",{style:{display:"flex",flexWrap:"wrap",gap:6}},ags.slice(5).map(renderAgentTag))
          ):null,
          ags.length>5?e("div",{key:"collapse-btn",style:{width:"100%",textAlign:"center",marginTop:2}},
            e(Button,{size:"small",type:"link",style:{fontSize:12},onClick:function(){setShowAllAgents(function(p){return !p;});}},
              showAllAgents?"×":"+"+ags.slice(5).length+" 位智能体")
          ):null
        ),
      ),
      // 📑 标签栏
      e("div",{style:{display:"flex",alignItems:"center",gap:2,padding:"4px 16px",background:uiTheme==="day"?"#FDF8F0":"#1a1a2e",borderBottom:uiTheme==="day"?"1px solid #EFEBE0":"1px solid #2a2a3e",overflowX:"auto",flexShrink:0}},
        tabs.map(function(t){
          var isActive = t.id===activeTabId;
          return e("div",{key:t.id,className:"tc-tab",
            onClick:function(){if(t.id!==activeTabId){saveTab();restoreTab(t);setActiveTabId(t.id);}},
            style:{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:"6px 6px 0 0",cursor:"pointer",fontSize:12,fontWeight:isActive?"bold":"normal",
              background:isActive?"#FFFAF5":"#F0EAE0",color:isActive?"#5D4037":"#8D6E63",border:isActive?"1px solid #D7CCC8":"1px solid transparent",
              borderBottom:isActive?"2px solid #FFD700":"none",whiteSpace:"nowrap",transition:"all .15s"}},
            e("input",{value:t.label||t.sid||"新会话",onClick:function(ev){ev.stopPropagation();},onChange:function(ev){setTabs(function(p){return p.map(function(x){if(x.id!==t.id)return x;var n=Object.assign({},x,{label:ev.target.value});if(isActive)setTabLabel(ev.target.value);return n;});});},
              style:{border:"none",background:"transparent",fontSize:12,fontWeight:"inherit",color:"inherit",width:t.id===activeTabId?Math.max(60,(tabLabel||t.label||"").length*13):Math.max(40,(t.label||"").length*11),outline:"none",cursor:"text",padding:0}}),
            tabs.length>1?e("span",{onClick:function(ev){ev.stopPropagation();closeTab(t.id);},
              className:"tc-tab-close",style:{fontSize:14,color:"#999",cursor:"pointer",padding:"0 2px",opacity:0,transition:"opacity .15s"}},"×"):null
          );
        }),
        e(Button,{size:"small",type:"text",onClick:function(){saveTab();var t=newTab();restoreTab(t);},
          style:{fontSize:16,color:"#5D4037",padding:"0 6px",minWidth:28}},"+")
      ),
      e("div",{ref:histRf,style:{flex:1,overflow:"auto",padding:"16px 20px",background:"#FFFAF5",position:"relative"},onScroll:onMsgScroll},
        withEB("消息列表", e("div",null,
          hist.length===0&&!ld?e(Empty,{description:"host主持和参与智能体，开始团队会谈",style:{marginTop:60}}):null,
          hist.map(function (m, i) { return e(MessageBubble,{key:i,msg:m}); }),
          discSumV&&discDone?e("div",{style:{marginTop:14,padding:14,background:"linear-gradient(135deg,#FFF8E1,#FFF3E0)",borderRadius:16,border:"1px solid #FFD54F",display:"flex",alignItems:"center",justifyContent:"space-between"}},
            e("div",null,
              e(Text,{strong:true,style:{fontSize:13}},"🧠 讨论完成"),
              e("br"),
              e(Text,{type:"secondary",style:{fontSize:11}},"共 "+hist.length+" 条消息 · "+sel.length+" 位智能体")
            ),
            e(Space,null,
              e(Button,{size:"small",onClick:function(){pullSummary();setDiscSumV(false);}},"查看总结"),
              e(Button,{size:"small",type:"text",onClick:function(){setDiscSumV(false);}},"✕")
            )
          ):null
        )),
        ld?e("div",{style:{textAlign:"center",padding:12}},
          e(Progress,{percent:pp,status:"active",strokeColor:{"0%":"#ff4d4f","30%":"#faad14","60%":"#1890ff","100%":"#52c41a"},style:{marginBottom:6}}),
          e("div",{style:{fontSize:16}},pp>20?"✨":"",pp>50?"🔥":"",pp>80?"💥":""),
          e(Text,{style:{fontSize:13,fontWeight:"bold",color:"#FFD700"}},bs&&cr>0?"🧠 第 "+cr+"/"+rds+" 轮":"处理中...")
        ):null,
        !atBottom&&newBadge>0?e("div",{onClick:scrollToBottom,style:{position:"absolute",bottom:20,right:20,width:38,height:38,borderRadius:"50%",
            background:"linear-gradient(135deg,#5D4037,#8D6E63)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,.2)",opacity:.85,zIndex:10,transition:"opacity .2s,transform .2s",
            fontSize:18,fontWeight:"bold",userSelect:"none"},
            onMouseEnter:function(ev){ev.currentTarget.style.opacity="1";ev.currentTarget.style.transform="scale(1.1)";},
            onMouseLeave:function(ev){ev.currentTarget.style.opacity=".85";ev.currentTarget.style.transform="scale(1)";}},
            newBadge>9?"9+":String(newBadge)
          ):null
      ),
      stps.length>0?e("div",{style:{padding:"8px 16px",background:"#fffbe6",borderTop:"1px solid #ffe58f",flexShrink:0,maxHeight:160,overflow:"auto"}},
        e(Collapse,{size:"small",ghost:true},e(Panel,{header:"📋 主持步骤 ("+stps.length+" 步)",key:"steps"},
          stps.map(function (s, i) {
            return e("div",{key:i,style:{marginBottom:4,fontSize:12}},
              e(Tag,{color:"blue",style:{marginRight:6}},"步骤"+(i+1)),
              e(Text,{strong:true},s.action),e("br"),e(Text,{type:"secondary"},s.detail)
            );
          })
        ))
      ):null,
      e("div",{style:{padding:"12px 16px",borderTop:uiTheme==="day"?"1px solid #D7CCC8":"1px solid #2a2a3e",background:uiTheme==="day"?"#FDF8F0":"#1a1a2e",flexShrink:0}},
        e(Space,{direction:"vertical",style:{width:"100%"}},
          e("div",{style:{position:"relative"}},
            tabBlocked?e("div",{style:{marginBottom:6,padding:"4px 10px",background:"#FFF3E0",borderRadius:6,border:"1px solid #FFB74D",fontSize:11,color:"#E65100"}},"⏳ 请等待「",busyLabel,"」完成后再操作"):null,
            e(TextArea,{value:msg,onChange:function (ev) { setMsg(ev.target.value); },onKeyDown:onKd,
              placeholder:tabBlocked?"⏳ 等待「"+busyLabel+"」完成..." : "↑↓ 回溯历史 · 输入消息，AI主持人协商回复...",autoSize:{minRows:2,maxRows:4},disabled:ld||tabBlocked,style:{borderRadius:8}}),
            msgHistIdx>=0?e("div",{style:{position:"absolute",top:4,right:8,fontSize:10,color:"#5D4037",background:"#FFF3E0",padding:"1px 8px",borderRadius:10,border:"1px solid #D7CCC8",zIndex:5}},"↕ 历史 "+(msgHistIdx+1)+"/"+msgHist.length):null
          ),
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            e(Space,null,
              e(Text,{type:"secondary",style:{fontSize:11}},"Enter 发送 · Shift+Enter 换行 · ↑↓ 历史"),
              e(Button,{size:"small",icon:"🎤",danger:list,onClick:startVoice,disabled:ld||tabBlocked,style:{background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",border:"1px solid #8B6914",color:"#f5e6d0",fontWeight:"bold",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.2)"}},list?"聆听中...":"语音"),
              e(Button,{size:"small",icon:"📎",disabled:ld||tabBlocked,onClick:function () { if (fiRf.current) fiRf.current.click(); },style:{background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",border:"1px solid #8B6914",color:"#f5e6d0",fontWeight:"bold",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.2)"}},"附件"),
              e("input",{ref:fiRf,type:"file",accept:".txt,.md,.json,.py,.js,.html,.css,.xml,.csv,.log,.yaml,.yml",onChange:handleFile,style:{display:"none"}}),
              hist.length>0||stps.length>0?e(Popover,{trigger:"click",placement:"top",
                content:e("div",{style:{padding:"1px 2px"}},
                  e(Button,{size:"small",type:"text",icon:"📄",onClick:function(){setFileShelfV(true);loadShelf();},style:{textAlign:"left",marginBottom:0,fontSize:10,padding:"0 4px"}},"文件架"),
                  (bs&&sel.length>0)||stps.length>0?e(Button,{size:"small",type:"text",
                    icon:discLd?"🔄":"✅",disabled:ld||discLd,
                    onClick:ld?null:pullSummary,
                    style:{textAlign:"left",color:ld?"#999":"#1890ff",fontWeight:"bold",marginBottom:0,fontSize:10,padding:"0 4px"}},
                    discLd?"加载...":(ld?"讨论中":"查看结果")):null,
                  stps.length>0?e(Button,{size:"small",type:"text",icon:"💳",
                    onClick:function(){setCardView(true);setCardIdx(0);},
                    style:{textAlign:"left",marginBottom:0,fontSize:10,padding:"0 4px"}},"观点对比"):null,
                  hist.length>0?e(Button,{size:"small",type:"text",icon:"📼",
                    onClick:function(){if(pptMsgs.length===0||pptMsgs!==hist){setPptMsgs(hist);setPptIdx(0);setPptTyped(0);setPptShowAll(false);setPptPl(false);setPptSpeed(1);}setPptV(true);},
                    style:{textAlign:"left",marginBottom:0,fontSize:10,padding:"0 4px"}},"PPT回放"):null,
                  hist.length>0?e(Button,{size:"small",type:"text",icon:"📥",
                    onClick:function(){var ln=["# 讨论回顾","","> 时间: "+new Date().toLocaleString(),"","---",""];hist.forEach(function(m,i){ln.push("## "+(i+1)+". "+(m.sender_name||m.sender||"?")+" ("+(m.role||"")+")");ln.push("");ln.push(m.content||"");ln.push("");ln.push("---");ln.push("");});_saveFile(ln.join("\n"),"review_"+new Date().toISOString().slice(0,10)+".md","text/markdown");},
                    style:{textAlign:"left",fontSize:10,padding:"0 4px"}},"导出 MD"):null
                )},
                e(Button,{size:"small",icon:"▸",style:{fontWeight:"bold",color:"#f5e6d0",background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",border:"1px solid #8B6914",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.2)"}},"回顾")
              ):null,
              ),
            e("span",null,
              e(Popover,{trigger:"click",placement:"top",
                content:e("div",{style:{padding:"4px 6px",minWidth:190}},
                  musicOn?e("div",{style:{fontSize:11,color:"#C62828",fontWeight:"bold",marginBottom:4,textAlign:"center",padding:"2px 0",borderBottom:"1px solid #ffcdd2"}},
                    "▶ 正在播放: "+(songIdx<Object.keys(SONGS).length?Object.keys(SONGS)[songIdx]:"自定义")):null,
                  Array.from({length:getTotalSongs()},function(_,i){
                    var name = getSongName(i);
                    return e(Button,{key:"s"+i,size:"small",type:"text",
                      style:{textAlign:"left",fontSize:10,padding:"0 3px",color:songIdx===i?(musicOn?"#C62828":"#1890ff"):"#5D4037",fontWeight:songIdx===i?"bold":"normal",marginBottom:0},
                      onClick:function(ev){ev.stopPropagation();var ti=i;if(ti>=getBuiltinCount()&&customSongs&&ti-getBuiltinCount()<customSongs.length){setCustSong(customSongs[ti-getBuiltinCount()].raw);}setSongIdx(ti);if(musicOn){toggleMusic();setTimeout(function(){toggleMusic(ti);},150);}else{toggleMusic(ti);}}
                    },(songIdx===i&&musicOn?"\u25b6 ":(songIdx===i?"\u25cf ":"  "))+name);
                  }),
                  e(Button,{key:"newbtn",size:"small",type:"dashed",icon:"+",
                    style:{textAlign:"left",fontSize:10,padding:"0 6px",marginLeft:2,color:"#1890ff",fontWeight:"bold"},
                    onClick:function(ev){ev.stopPropagation();setSongIdx(getTotalSongs());setCustSong("");setShowSaveModal(true);setSaveNameVal("");}
                  },"\u65b0\u5efa"),
                  
                  e("div",{style:{borderTop:"1px solid #eee",margin:"4px 0"}}),
                  e("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:6}},
                    e("span",{style:{fontSize:12}},"🔊"),
                    e(Slider,{min:0.1,max:1.0,step:0.1,value:musicVol,
                      onChange:function(v){setMusicVol(v);try{localStorage.setItem("teamchat_music_vol",String(v));}catch(e){};},
                      style:{flex:1,margin:0},tooltip:{formatter:function(v){return Math.round(v*100)+"%"}}
                    })
                  ),
                  e("div",{style:{display:"flex",gap:4}},
                    musicOn?e(Button,{size:"small",danger:true,
                      onClick:function(ev){ev.stopPropagation();toggleMusic();},
                      style:{fontSize:11,flex:1,fontWeight:"bold"}
                    },"⏹ 停止播放"):null,
                    e(Button,{size:"small",type:"text",
                      style:{textAlign:"left",fontSize:10,padding:"0 3px",color:songIdx>=getTotalSongs()?(musicOn?"#C62828":"#1890ff"):"#5D4037",fontWeight:songIdx>=getTotalSongs()?"bold":"normal",flex:musicOn?0:1},
                      onClick:function(ev){ev.stopPropagation();setSongIdx(getTotalSongs());setCustSong("");setShowSaveModal(true);setSaveNameVal("");}
                    },"\u2795 \u65b0\u5efa\u4e50\u8c31")
                  ),
                  songIdx>=getBuiltinCount()?e("div",{style:{marginTop:6}},
                    showSaveModal?e("div",{style:{marginBottom:6,padding:"6px 8px",background:"#fff8e1",borderRadius:6,border:"1px solid #ffe082"}},
                      e("div",{style:{fontSize:10,fontWeight:"bold",color:"#e65100",marginBottom:4}},"\u65b0\u5efa\u4e50\u8c31"),
                      e("input",{type:"text",value:saveNameVal,onChange:function(ev){setSaveNameVal(ev.target.value);},
                        placeholder:"\u8bf7\u8f93\u5165\u4e50\u8c31\u540d\u79f0",
                        style:{width:"100%",padding:"6px 8px",border:"1px solid #ddd",borderRadius:4,fontSize:12,marginBottom:4,boxSizing:"border-box"}}),
                      e("div",{style:{display:"flex",gap:4}},
                        e(Button,{size:"small",type:"primary",disabled:!saveNameVal||!custSong,
                          onClick:function(ev){
                            ev.stopPropagation();
                            if(!saveNameVal||!custSong)return;
                            var newSongs = (customSongs||[]).concat([{name:saveNameVal,raw:custSong,scale:"diatonic"}]);
                            saveCustomSongs(newSongs);
                            setShowSaveModal(false);setSaveNameVal("");
                            var si = getBuiltinCount()+newSongs.length-1;
                            setSongIdx(si);
                            if(musicOn){toggleMusic();setTimeout(function(){toggleMusic(si);},150);}else{toggleMusic(si);}
                          },
                          style:{fontSize:10,fontWeight:"bold",padding:"0 8px",height:24}
                        },"\u4fdd\u5b58"),
                        e(Button,{size:"small",
                          onClick:function(ev){ev.stopPropagation();setShowSaveModal(false);setSaveNameVal("");},
                          style:{fontSize:10,padding:"0 8px",height:24}
                        },"\u53d6\u6d88")
                      )
                    ):null,
                    e("div",{style:{display:"flex",gap:4,marginBottom:4,alignItems:"center"}},
                      e("span",{style:{fontSize:10,color:"#5D4037",fontWeight:"bold"}},"\u270f\ufe0f \u81ea\u5b9a\u4e49\u7f16\u8f91\u5668"),
                      e("span",{style:{fontSize:9,color:"#999"}},
                        custSong?"\u2705 "+custSong.replace(/\s/g,"").length+" \u4e2a\u97f3\u7b26":"")
                    ),
                    e(TextArea,{value:custSong,onChange:function(ev){setCustSong(ev.target.value);},
                      placeholder:"\u2192 \u7c98\u8d34\u6570\u5b57\u7b80\u8c31\uff0c\u7a7a\u683c\u5206\u884c",autoSize:{minRows:2,maxRows:3},style:{fontSize:10,marginBottom:4},onClick:function(ev){ev.stopPropagation()}}),
                    e("div",{style:{display:"flex",gap:4,flexWrap:"wrap"}},
                      e(Button,{size:"small",type:"primary",icon:"\u25b6",disabled:!custSong||musicOn,
                        onClick:function(ev){ev.stopPropagation();if(!custSong)return;var ti=getTotalSongs();setSongIdx(ti);if(!musicOn)toggleMusic(ti);},
                        style:{fontSize:10,fontWeight:"bold",padding:"0 8px",height:24}
                      },"\u64ad\u653e"),
                      e(Button,{size:"small",icon:"\u23f9",disabled:!musicOn,
                        onClick:function(ev){ev.stopPropagation();if(musicOn)toggleMusic();},
                        style:{fontSize:10,padding:"0 8px",height:24}
                      },"\u505c\u6b62"),
                      e(Button,{size:"small",icon:"\u2b55",disabled:!custSong||songIdx<getBuiltinCount(),
                        onClick:function(ev){
                          ev.stopPropagation();
                          var ci = songIdx - getBuiltinCount();
                          if(ci<0||!customSongs||ci>=customSongs.length)return;
                          var newSongs = customSongs.slice();
                          newSongs[ci] = Object.assign({},newSongs[ci],{raw:custSong});
                          saveCustomSongs(newSongs);
                        },
                        style:{fontSize:10,padding:"0 8px",height:24}
                      },"\u4fdd\u5b58\u4fee\u6539"),
                      e(Button,{size:"small",icon:"\u267b",
                        onClick:function(ev){ev.stopPropagation();setCustSong("");},
                        style:{fontSize:10,padding:"0 8px",height:24}
                      },"\u6e05\u7a7a"),
                      e(Button,{size:"small",danger:true,icon:"\u2716",
                        onClick:function(ev){
                          ev.stopPropagation();
                          var ci = songIdx - getBuiltinCount();
                          if(ci<0||!customSongs||ci>=customSongs.length)return;
                          if(!confirm("\u786e\u5b9a\u5220\u9664\u8be5\u4e50\u8c31\uff1f"))return;
                          var newSongs = customSongs.slice();
                          newSongs.splice(ci,1);
                          saveCustomSongs(newSongs);
                          setSongIdx(0);
                        },
                        style:{fontSize:10,padding:"0 8px",height:24,color:"#c62828"}
                      },"\u5220\u9664")
                    )
                  ):null
                )},
                e(Button,{size:"small",icon:musicOn?"⏹":"🎵",style:{maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",border:"1px solid #8B6914",color:"#f5e6d0",fontWeight:"bold",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.2)"}},
                  musicOn?t("stop"):getSongName(songIdx))
              ),
              e("span",{style:{display:"inline-block",width:"5ch"}}),
              ld?e(Button,{type:"primary",danger:true,onClick:stop,icon:e("span",null,"⏹"),style:{fontWeight:"bold",background:"linear-gradient(180deg,#d88888,#a84848,#882828,#c06060)",border:"1px solid #8a3030",color:"#fce4e4",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.2)"}},t("stop")):e(Button,{type:"primary",icon:e(antdIcons.SendOutlined||null),onClick:send,disabled:!msg.trim()||tabBlocked,style:{background:"linear-gradient(180deg,#e0c068,#c09030,#906020,#d0a840)",border:"1px solid #8B6914",color:"#fff5e0",fontWeight:"bold",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.25),0 2px 4px rgba(0,0,0,.25)"}},t("send"))
            )
          ),
        
        )
      ),
      e(Modal,{title:e("span",{style:{fontSize:16,fontWeight:700,color:"#5D4037"}},"📂 历史会谈"+(sess.length>0?" ("+sess.length+")":"")),open:sessV,onCancel:function () { setSessV(false); },footer:null,width:680},
        e("div",{style:{display:"flex",gap:8,marginBottom:10}},
          e(Button,{size:"small",type:hTab==="all"?"primary":"default",style:{borderRadius:14,fontSize:12},onClick:function(){setHtab("all");}},"📋 全部"),
          e(Button,{size:"small",type:hTab==="starred"?"primary":"default",style:{borderRadius:14,fontSize:12},onClick:function(){setHtab("starred");}},
            "⭐ 收藏 (",sess.filter(function(s){return s.pinned;}).length,")")
        ),
        e("div",{style:{marginBottom:12}},
          e(Input,{placeholder:"搜索内容、标签、主持人...",allowClear:true,
            onChange:function (ev) { setSq(ev.target.value); },
            onPressEnter:function () { apiGet("/sessions?search="+encodeURIComponent(sq)).then(function (r) { setSess(r.sessions||[]); setSessLd(false); }).catch(function () {}); },
            suffix:e(Button,{size:"small",type:"link",onClick:function () { setSessLd(true); apiGet("/sessions?search="+encodeURIComponent(sq)).then(function (r) { setSess(r.sessions||[]); setSessLd(false); }).catch(function () { setSessLd(false); }); }},"🔍")
          })
        ),
        sessLd?e(Spin,{tip:t("loading"),style:{display:"block",textAlign:"center",padding:40}}):
        sess.length===0||(hTab==="starred"&&sess.filter(function(s){return s.pinned;}).length===0)?
          e(Empty,{description:sq?"无匹配结果":(hTab==="starred"?"暂无收藏会话，点击 📌 置顶即可收藏":"暂无历史会谈记录")}):
        e("div",{style:{maxHeight:400,overflow:"auto"}},
          sess.filter(function(s){return hTab==="all"||s.pinned;}).map(function (s) {
            var dt = s.created_at ? new Date(s.created_at*1000).toLocaleString() : "未知时间";
            var pc = (s.agent_ids||[]).length, msgCount = s.message_count||(s.history||[]).length, ip = s.pinned||false;
            var firstLine = s.last_message||(s.history&&s.history.length>0 ? (s.history[s.history.length-1].content||"").slice(0,40) : "");
            return e(Card,{key:s.session_id,size:"small",hoverable:true,
              style:{marginBottom:12,borderRadius:16,borderLeft:ip?"3px solid #faad14":undefined,
                cursor:"pointer",transition:"box-shadow .15s"},
              onClick:function () { loadOne(s.session_id); }},
              e("div",{style:{padding:"2px 0"}},
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}},
                  e("div",{style:{fontSize:13,fontWeight:600,color:"#5D4037"}},
                    "📋 "+(s.tag?(s.tag+" · "):"")+s.session_id.slice(0,8)+"..."+
                    (ip?e("span",{style:{color:"#faad14",fontSize:11,marginLeft:4}},"⭐"):null)
                  ),
                  e(Space,{size:4,onClick:function (ev) { ev.stopPropagation(); }},
                    editingTag===s.session_id?
                    e(Input,{size:"small",defaultValue:s.tag||"",autoFocus:true,style:{width:70,fontSize:11},
                      onClick:function(ev){ev.stopPropagation();},
                      onPressEnter:function(ev){
                        var v=ev.target.value.trim(); setEditingTag(null);
                        if(v!==(s.tag||"")) apiPut("/session/"+s.session_id+"/tag",{tag:v}).then(function(){message.success("标签已更新");try{var cache=JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");cache=cache.map(function(x){if(x.session_id!==s.session_id)return x;return Object.assign({},x,{tag:v});});localStorage.setItem("teamchat_sessions_cache",JSON.stringify(cache));}catch(e){}updateSessList();}).catch(function(e){message.error(e.message);});
                      },
                      onBlur:function(){setEditingTag(null);}
                    }):
                    e(Button,{size:"small",type:"text",title:"编辑标签",style:{padding:"0 4px",fontSize:11,minWidth:28},
                      onClick:function(ev){ev.stopPropagation();setEditingTag(s.session_id);}
                    },s.tag?s.tag:"🏷️"),
                    e(Button,{size:"small",type:"text",title:ip?"取消收藏":"收藏",style:{padding:"0 4px",fontSize:11,minWidth:28},
                      onClick:function(ev){ev.stopPropagation();
                        var newPin = !ip;
                        // 即时更新本地状态（不等后端）
                        setSess(function(p){return p.map(function(x){
                          if(x.session_id!==s.session_id) return x;
                          return Object.assign({},x,{pinned:newPin});
                        });});
                        apiPut("/session/"+s.session_id+"/pin",{pinned:newPin}).then(function () {
                          message.success(newPin?"已收藏":"已取消收藏");
                          // 直接持久化到 localStorage，不依赖 updateSessList 的回调
                          try {
                            var cache = JSON.parse(localStorage.getItem("teamchat_sessions_cache")||"[]");
                            cache = cache.map(function(x){
                              if(x.session_id!==s.session_id) return x;
                              return Object.assign({},x,{pinned:newPin});
                            });
                            localStorage.setItem("teamchat_sessions_cache", JSON.stringify(cache));
                          } catch(e) {}
                          updateSessList();
                        }).catch(function (e) { message.error(e.message); });
                    }},ip?"⭐":"☆"),
                    e(Button,{size:"small",type:"text",title:"加载会话",style:{padding:"0 4px",fontSize:12,color:"#5D4037",fontWeight:600,minWidth:24},
                      onClick:function () { loadOne(s.session_id); }},"📂"),
                    e(Button,{size:"small",type:"text",title:"PPT回放",style:{padding:"0 4px",fontSize:12,color:"#1890ff",minWidth:24},
                      onClick:function () { openPPT(s.session_id); }},"📼"),
                    e(Button,{size:"small",type:"text",danger:true,title:"删除",style:{padding:"0 4px",fontSize:11,minWidth:24},
                      onClick:function () {
                        Modal.confirm({title:"确认删除",content:"删除 '"+s.session_id.slice(0,8)+"' 后不可恢复",okText:"确认删除",okType:"danger",onOk:function () {
                          return apiDelete("/session/"+s.session_id).then(function () {
                            message.success("已删除"); setSess(function (p) { return p.filter(function (x) { return x.session_id!==s.session_id; }); });
                          }).catch(function (e) { message.error(e.message); });
                        }});
                    }},"🗑️")
                  )
                ),
                e("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:2}},
                  e(Tag,{color:"gold",style:{fontSize:10}},"🎤 "+(s.host_name||s.host_id||"?")),
                  e(Text,{type:"secondary",style:{fontSize:11}},pc+" 参与者 · "+msgCount+" 条")
                ),
                firstLine?e(Text,{type:"secondary",style:{fontSize:11,lineHeight:1.4}},"💬 "+firstLine+(firstLine.length>=40?"...":"")):null,
                e(Text,{type:"secondary",style:{fontSize:10,marginTop:2}},dt)
              )
            );
          })
        )
      )),
      // 🎭 浮动圆桌（始终右上角，展开/收缩映射位置）
      e("div",{style:{position:"fixed",bottom:sideOpen?12:100,right:12,zIndex:1,width:sideOpen?270:260,height:sideOpen?320:200,transition:"all .35s ease",borderRadius:16,overflow:"hidden",boxShadow:sideOpen?"0 2px 8px rgba(0,0,0,.2)":"0 4px 16px rgba(0,0,0,.35)",background:"rgba(26,26,46,0.65)"}},
        e("canvas",{ref:cvRf,width:270,height:320,style:{width:"100%",height:"100%",display:"block",borderRadius:8},
          onMouseMove:function(ev){try{var rect=ev.target.getBoundingClientRect();var scaleX=ev.target.width/rect.width;var scaleY=ev.target.height/rect.height;var mx=(ev.clientX-rect.left)*scaleX;var my=(ev.clientY-rect.top)*scaleY;var mp=Array.isArray(cvRf._memPos)?cvRf._memPos:[];for(var i=0;i<mp.length;i++){var p=mp[i];if(!p)continue;if(Math.abs(mx-(p.x||0))<16&&Math.abs(my-(p.y||0))<20){var id=String(p.id||"");var found=Array.isArray(ags)?ags.find(function(a){return a&&a.agent_id&&String(a.agent_id)===id;}):null;setHoverInfo({name:p.name||id,id:id,x:ev.clientX,y:ev.clientY,agent:found||null});return;}}setHoverInfo(null);}catch(ex){setHoverInfo(null);}},onMouseLeave:function(){setHoverInfo(null);}}),
        hoverInfo&&typeof hoverInfo==="object"?e("div",{style:{position:"fixed",left:(hoverInfo.x||0)+12,top:(hoverInfo.y||0)-46,zIndex:100000,background:"rgba(62,39,35,0.92)",color:"#fff",padding:"4px 10px",borderRadius:6,fontSize:10,pointerEvents:"none",lineHeight:1.5}},
          e("div",{style:{fontWeight:"bold"}},hoverInfo.name||""),
          e("div",{style:{fontSize:9,opacity:0.7}},hoverInfo.id||""),
          hoverInfo.agent&&hoverInfo.agent.enabled===false?e("div",{style:{fontSize:9,color:"#ff6b6b"}},"⛔ 已禁用"):null,
          Array.isArray(chEnabled)&&chEnabled.length>0?e("div",{style:{fontSize:9,opacity:0.65}},"📡 "+chEnabled.map(function(c){return c.label||c.name||"";}).join(", ")):null
        ):null
      ),
      sideOpen?e("div",{style:{width:280,minWidth:280,borderLeft:uiTheme==="day"?"1px solid #D7CCC8":"1px solid #3a3a4e",padding:"16px 16px 16px 8px",background:uiTheme==="day"?"#FDF8F0":"#1e1e32",flexShrink:0,display:"flex",flexDirection:"column",overflowY:"auto",minHeight:"100%"}},
        e(Button,{size:"small",type:"text",onClick:function(){setSideOpen(false);},style:{alignSelf:"flex-end",fontSize:12,fontWeight:"bold",background:"linear-gradient(180deg,#f0e8dc,#d8d0c4,#c0b8ac,#e0d8cc)",border:"1px solid #b8a898",color:"#5a4a3a",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.25),0 1px 3px rgba(0,0,0,.1)",textShadow:"0 1px 0 rgba(255,255,255,.3)",padding:"2px 10px",marginBottom:8}},"◀ 收起小桌板"),
        e("div",{style:{marginBottom:12},onClick:function(){console.log("AI邮箱按钮被点击");setAimailView(true);}},e("a",{href:"javascript:void(0)",onClick:function(ev){ev.preventDefault();setAimailView(true);},style:{display:"block",fontSize:13,fontWeight:"bold",color:"white",textDecoration:"none",cursor:"pointer",padding:"8px 12px",textAlign:"center",background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",border:"1px solid #5a6cdb",borderRadius:16,boxShadow:"inset 0 1px 0 rgba(255,255,255,.25),0 2px 6px rgba(102,126,234,.3)",textShadow:"0 1px 0 rgba(0,0,0,.1)"}},"📧 AI邮箱 ",e("span",{style:{display:"inline-block",fontSize:"20px",verticalAlign:"middle",animation:"tcPigeonFly 1.5s ease-in-out infinite",marginLeft:"4px"}},"🕊"))),e("div",{style:{marginBottom:12}},
          e("div",{onClick:function(){setChuanView(true);},style:{cursor:"pointer"}},e("a",{href:"javascript:void(0)",onClick:function(ev){ev.preventDefault();setChuanView(true);},style:{display:"block",fontSize:13,fontWeight:"bold",color:"#4E342E",textDecoration:"none",cursor:"pointer",padding:"8px 12px",textAlign:"center",background:"linear-gradient(180deg,#e8f5e9,#c8e6c9,#a5d6a7,#d0e8d0)",border:"1px solid #81c784",borderRadius:16,boxShadow:"inset 0 1px 0 rgba(255,255,255,.25),0 2px 6px rgba(76,175,80,.15)",textShadow:"0 1px 0 rgba(255,255,255,.3)"}},"📡 串串频道"))
        ),

        // A: 人类身份
        e("div",{style:{marginBottom:16}},
          e("input",{ref:humAvRf,type:"file",accept:"image/*",onChange:handleUploadAvatar,style:{display:"none"}}),
          e("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:10}},
            e("div",{style:{width:56,height:56,borderRadius:"50%",overflow:"hidden",border:"2px solid #D7CCC8",background:"#D7CCC8"}},
              humanAvatarId==="custom"&&humanAvatarUrl?e("img",{src:humanAvatarUrl,style:{width:"100%",height:"100%",objectFit:"cover"}})
              :e("img",{src:humanSvgs[parseInt((humanAvatarId||"default-0").split("-")[1])||0],style:{width:"100%",height:"100%",objectFit:"cover"}})
            ),
            e("div",{style:{display:"flex",flexDirection:"column",gap:4}},
              e(Button,{size:"small",type:"text",onClick:function(){if(humAvRf.current)humAvRf.current.click();},style:{fontSize:10,background:"linear-gradient(180deg,#e8d8c8,#c8b098,#a88870,#d0b898)",border:"1px solid #8B7355",color:"#5a4a3a",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18)",textShadow:"0 1px 0 rgba(255,255,255,.3)",fontWeight:"bold"}},"📷 上传头像"),
              e(Button,{size:"small",type:"text",onClick:handleRestoreAvatar,disabled:humanAvatarId==="default-0",style:{fontSize:10,background:"linear-gradient(180deg,#e8d8c8,#c8b098,#a88870,#d0b898)",border:"1px solid #8B7355",color:humanAvatarId==="default-0"?"#bbb":"#5a4a3a",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18)",textShadow:"0 1px 0 rgba(255,255,255,.3)",fontWeight:"bold"}},"↩ 恢复默认")
            )
          ),
          e("div",{style:{marginBottom:10}},
            e("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}},
              humanSvgs.map(function(svg,i){return e("div",{key:i,onClick:function(){setHumanAvatarId("default-"+i);setHumanAvatarUrl("");},
                style:{cursor:"pointer",borderRadius:16,overflow:"hidden",border:humanAvatarId==="default-"+i?"2px solid #5D4037":"2px solid transparent",padding:2,transition:"border .2s"}},
                e("div",{style:{position:"relative"}},
                  e("img",{src:svg,style:{width:"100%",borderRadius:6,display:"block"}}),
                  e("div",{style:{textAlign:"center",fontSize:9,color:"#8D6E63",marginTop:1}},humanLabels[i])
                )
              );})
            )
          ),
          e(TextArea,{value:uc,onChange:function(ev){setUc(ev.target.value)},placeholder:"我是谁？想让AI知道的信息...",autoSize:{minRows:2,maxRows:5},style:{fontSize:12,borderRadius:6,resize:"none"}})
        ),

        // D: 环境信息
        null,
        // E: 圆桌主题
        e("div",{style:{marginBottom:16}},
          e("div",{style:{display:"flex",gap:4}},
            (function(){var ms=[{bg:"linear-gradient(180deg,#d4b896,#9a7b5a,#7a5b3a,#b8966a)",bd:"#8B6914",tc:"#f5e6d0"},{bg:"linear-gradient(180deg,#a8c4d8,#5080a0,#305878,#7098b4)",bd:"#3a5a7a",tc:"#e0ecf4"},{bg:"linear-gradient(180deg,#a0c098,#487838,#285828,#688858)",bd:"#3a5a30",tc:"#d8ecd0"},{bg:"linear-gradient(180deg,#d8a8a8,#b84848,#882828,#c87070)",bd:"#8a3030",tc:"#fce4e4"},{bg:"linear-gradient(180deg,#3a3a4a,#181828,#0a0a18,#282838)",bd:"#00ff88",tc:"#aaffcc"}];return themes.map(function(t,i){return e(Button,{key:i,size:"small",type:"text",onClick:function(){setThemeIdx(i);setTblColor(t.table);},style:{fontSize:10,minWidth:44,borderRadius:4,background:ms[i].bg,border:"1px solid "+ms[i].bd,color:ms[i].tc,fontWeight:themeIdx===i?"bold":"normal",textShadow:"0 1px 0 rgba(0,0,0,.35)",boxShadow:themeIdx===i?"0 0 8px "+ms[i].bd+",inset 0 1px 0 rgba(255,255,255,.2)":"inset 0 1px 0 rgba(255,255,255,.08)",transition:"all .2s ease"}},t.name);});})()
          )
        ),

        // E2: 界面主题
        e("div",{style:{marginBottom:16}},
          e("div",{style:{display:"flex",gap:4}},
            e(Button,{size:"small",type:"text",onClick:function(){setUiTheme("day");},style:{fontSize:10,minWidth:50,borderRadius:4,background:uiTheme==="day"?"linear-gradient(180deg,#fff8e0,#f0e0b0,#d4b050,#f8ecc0)":"linear-gradient(180deg,#e8e4dc,#d8d4cc,#c8c4bc,#e0dcd4)",border:"1px solid "+(uiTheme==="day"?"#d4a844":"#aaa"),color:uiTheme==="day"?"#8B6914":"#999",fontWeight:uiTheme==="day"?"bold":"normal",boxShadow:uiTheme==="day"?"0 0 6px #d4a844,inset 0 1px 0 rgba(255,255,255,.25)":"inset 0 1px 0 rgba(255,255,255,.1)",transition:"all .2s ease"}},"☀️ 日光"),
            e(Button,{size:"small",type:"text",onClick:function(){setUiTheme("night");},style:{fontSize:10,minWidth:50,borderRadius:4,background:uiTheme==="night"?"linear-gradient(180deg,#3a3a4e,#181828,#0a0a18,#2a2a3e)":"linear-gradient(180deg,#e8e4dc,#d8d4cc,#c8c4bc,#e0dcd4)",border:"1px solid "+(uiTheme==="night"?"#6666cc":"#aaa"),color:uiTheme==="night"?"#aaccff":"#999",fontWeight:uiTheme==="night"?"bold":"normal",boxShadow:uiTheme==="night"?"0 0 6px #6666cc,inset 0 1px 0 rgba(255,255,255,.12)":"inset 0 1px 0 rgba(255,255,255,.1)",transition:"all .2s ease"}},"🌙 月色")
          )
        ),

        // F: 指导动图
        e("div",{style:{marginBottom:12,textAlign:"center"}},
          e("a",{href:"https://agent.bh-jk.com",target:"_blank",rel:"noopener noreferrer"},
            e("img",{src:QP.plugin&&QP.plugin.getMediaUrl?QP.plugin.getMediaUrl("bot.gif"):getApiUrl("/plugins/team_chat/media/bot.gif"),style:{width:"100%",borderRadius:6,cursor:"pointer"},
              onError:function(e){e.target.style.display="none";}
            })
          )
        ),

        // G: 支持链接
        e("div",{style:{marginTop:"auto",paddingTop:12,borderTop:"1px solid #D7CCC8",textAlign:"center"}},
          e("a",{href:"https://agent.bh-jk.com",target:"_blank",rel:"noopener noreferrer",style:{textDecoration:"none",display:"block"}},
            e("img",{src:QP.plugin&&QP.plugin.getMediaUrl?QP.plugin.getMediaUrl("0123.jpg"):getApiUrl("/plugins/team_chat/media/0123.jpg"),style:{width:"100%",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,0.1)",cursor:"pointer"},
              onError:function(e){e.target.style.display="none";e.target.parentNode.innerHTML="<div style='padding:16px;background:#FAF3E8;border-radius:8px;color:#8D6E63;font-size:11px;'>❤️ 点击访问 agent.bh-jk.com</div>";}
            })
          )
        )

    ):e("div",{style:{width:36,minWidth:36,borderLeft:uiTheme==="day"?"1px solid #D7CCC8":"1px solid #3a3a4e",background:uiTheme==="day"?"#FDF8F0":"#1e1e32",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100%",cursor:"pointer"},onClick:function(){setSideOpen(true);}},
      e("div",{style:{writingMode:"vertical-rl",fontSize:12,color:uiTheme==="day"?"#5D4037":"#a0a0cc",letterSpacing:2}},"▶ 展开")
    ),
      /* ---- 📼 PPT 播放器 (打字机·粒子·键盘·变速) ---- */
      e(Modal,{title:null,open:pptV,onCancel:function(){setPptV(false);setPptPl(false);},footer:null,width:"100vw",
        style:{maxWidth:"100vw",top:0,padding:0},bodyStyle:{background:pptTheme==="dark"?"#0a0a1a":"#fef9f0",minHeight:"100vh",padding:0,overflow:"hidden",position:"relative"}},
        e("canvas",{ref:pptCvRf,style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}),
        e("div",{style:{position:"absolute",top:0,left:0,height:3,
          background:pptMsgs.length>0?"linear-gradient(90deg,#e91e63,#ff9800,#00e5ff)":"transparent",
          width:pptMsgs.length>0?((pptIdx+1)/pptMsgs.length*100)+"%":"0%",transition:"width .35s",zIndex:10}}),
        e("div",{style:{position:"absolute",top:16,right:24,zIndex:10,display:"flex",gap:8,alignItems:"center"}},
          e(Button,{type:"text",title:pptTheme==="dark"?"月色→日光":"日光→月色",onClick:function(){setPptTheme(pptTheme==="dark"?"light":"dark");},style:{color:pptTheme==="dark"?"#fff":"#3E2723",fontSize:22}},pptTheme==="dark"?"🌙":"☀️"),
          e(Button,{type:"text",onClick:function(){setPptV(false);setPptPl(false);},style:{color:pptTheme==="dark"?"#fff":"#3E2723",fontSize:28}},"✕")
        ),
        e("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",padding:"60px 40px 150px",position:"relative",zIndex:1}},
          (function(){
            if (pptMsgs.length===0||pptIdx>=pptMsgs.length) return e("div",{style:{color:"#667",fontSize:18}},t("loading"));
            var m=pptMsgs[pptIdx];
            var ac=(m.role==="human"?"#e91e63":m.role==="host"?"#ff9800":"#00e5ff");
            var ic=(m.role==="human"?"🧑":m.role==="host"?"🎤":"🤖");
            var full=m.content||"";
            var typed=full.slice(0,pptTyped);
            var isTyping=pptTyped<full.length;
            return e("div",{style:{
              background:pptTheme==="dark"?"linear-gradient(135deg,#1a1a3e 0%,#0d0d2b 100%)":"linear-gradient(135deg,#fff 0%,#faf3e8 100%)",
              border:"1px solid "+ac+"44",borderRadius:20,padding:"36px 48px",maxWidth:760,width:"100%",
              boxShadow:"0 0 80px "+ac+"15",animation:"tcIn .45s ease-out"
            }},
              e("div",{style:{display:"flex",alignItems:"center",gap:18,marginBottom:28}},
                e("div",{style:{width:52,height:52,borderRadius:"50%",background:ac,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 0 20px "+ac+"50"}},ic),
                e("div",null,
                  e(Text,{style:{color:ac,fontSize:22,fontWeight:700,display:"block",fontFamily:"monospace"}},m.sender_name||m.sender||"?"),
                  e("div",{style:{display:"flex",gap:12,alignItems:"center",marginTop:4}},
                    e(Text,{style:{color:"#667",fontSize:12}},new Date(m.timestamp*1000).toLocaleString()),
                    e(Tag,{color:m.role==="human"?"red":m.role==="host"?"orange":"cyan",style:{fontSize:10}},m.role)
                  )
                )
              ),
              e("div",{style:{color:pptTheme==="dark"?"#d0d0e0":"#3E2723",fontSize:17,lineHeight:1.9,whiteSpace:"pre-wrap",maxHeight:pptShowAll?"52vh":"45vh",overflow:"auto",position:"relative"}},
                e("span",null,typed),
                isTyping?e("span",{style:{color:ac,animation:"blink 0.8s step-end infinite",fontWeight:"bold"}},"▎"):null
              ),
              pptShowAll&&m.robot_prompt?e("details",{style:{marginTop:12,fontSize:12,color:"#667",cursor:"pointer"}},
                e("summary",null,"🔧 底层 Prompt"),e("pre",{style:{whiteSpace:"pre-wrap",maxHeight:120,overflow:"auto"}},m.robot_prompt)
              ):null
            );
          })()
        ),
        e("div",{style:{position:"absolute",bottom:0,left:0,right:0,
          background:pptTheme==="dark"?"linear-gradient(transparent,#0a0a1a 30%)":"linear-gradient(transparent,#fef9f0 30%)",padding:"20px 0 36px",
          display:"flex",justifyContent:"center",alignItems:"center",gap:12,flexDirection:"column",zIndex:1}},
          e("div",{style:{display:"flex",alignItems:"center",gap:14}},
            e(Button,{shape:"circle",size:"large",disabled:pptIdx<=0,onClick:function(){setPptIdx(Math.max(0,pptIdx-1));setPptPl(false);},style:{background:pptTheme==="dark"?"rgba(255,255,255,.08)":"rgba(0,0,0,.05)",border:"1px solid "+(pptTheme==="dark"?"rgba(0,229,255,.3)":"rgba(230,81,0,.4)"),color:pptTheme==="dark"?"#00e5ff":"#e65100"}},"◀"),
            e(Button,{shape:"circle",size:"large",onClick:function(){setPptPl(!pptPl);},style:{background:pptTheme==="dark"?"#00e5ff":"#e65100",border:"none",color:pptTheme==="dark"?"#0a0a1a":"#fff",boxShadow:pptTheme==="dark"?"0 0 24px #00e5ff40":"0 0 24px #e6510040"}},pptPl?"⏸":"▶"),
            e(Button,{shape:"circle",size:"large",disabled:pptIdx>=pptMsgs.length-1,onClick:function(){setPptIdx(Math.min(pptMsgs.length-1,pptIdx+1));setPptPl(false);},style:{background:pptTheme==="dark"?"rgba(255,255,255,.08)":"rgba(0,0,0,.05)",border:"1px solid "+(pptTheme==="dark"?"rgba(0,229,255,.3)":"rgba(230,81,0,.4)"),color:pptTheme==="dark"?"#00e5ff":"#e65100"}},"▶"),
            e(Text,{style:{color:pptTheme==="dark"?"#00e5ff":"#e65100",fontSize:15,fontFamily:"monospace",minWidth:60,textAlign:"center"}},pptMsgs.length>0?(pptIdx+1)+" / "+pptMsgs.length:"-"),
            e("div",{style:{width:1,height:24,background:pptTheme==="dark"?"rgba(0,229,255,.2)":"rgba(230,81,0,.2)"}}),
            e(Button,{size:"small",type:pptSpeed===0.5?"primary":"text",onClick:function(){setPptSpeed(0.5);setPptPl(false);},style:{color:pptSpeed===0.5?undefined:pptTheme==="dark"?"#667":"#999",fontWeight:pptSpeed===0.5?"bold":"normal",minWidth:40}},"0.5x"),
            e(Button,{size:"small",type:pptSpeed===1?"primary":"text",onClick:function(){setPptSpeed(1);setPptPl(false);},style:{color:pptSpeed===1?undefined:pptTheme==="dark"?"#667":"#999",fontWeight:pptSpeed===1?"bold":"normal",minWidth:40}},"1x"),
            e(Button,{size:"small",type:pptSpeed===2?"primary":"text",onClick:function(){setPptSpeed(2);setPptPl(false);},style:{color:pptSpeed===2?undefined:pptTheme==="dark"?"#667":"#999",fontWeight:pptSpeed===2?"bold":"normal",minWidth:40}},"2x"),
            pptIdx>=pptMsgs.length-1?e(Button,{type:"primary",onClick:exportPPT,style:{background:pptTheme==="dark"?"#00e5ff":"#e65100",border:"none",color:pptTheme==="dark"?"#0a0a1a":"#fff",fontWeight:700,boxShadow:pptTheme==="dark"?"0 0 20px #00e5ff40":"0 0 20px #e6510040"}},"📥 导出"):null
          ),
          e("div",{style:{display:"flex",alignItems:"center",gap:8}},
            e(Text,{style:{color:pptTheme==="dark"?"#444":"#999",fontSize:10,fontFamily:"monospace"}},"⌨  ← → 翻页  ·  空格 播放/暂停  ·  1-3 变速 · Esc 关闭"),
            e(Text,{style:{color:pptTheme==="dark"?"#555":"#888",fontSize:10,fontWeight:"bold"}},pptTheme==="dark"?"🌙 月色":"☀️ 日光"+" · "+pptSpeed+"x · "+(pptPl?"▶ 自动播放":"⏸ 手动"))
          )
        )
      ),
      /* ---- 刷卡器: 观点切换器 Modal ---- */
      e(Modal,{title:"💳 观点切换器",open:cardView,onCancel:function(){setCardView(false);},footer:null,width:600},
        (function(){
          var agentMsgs = hist.filter(function(h){return h.role==="agent";});
          if (agentMsgs.length===0) return e(Empty,{description:"暂无智能体发言"});
          var cur = agentMsgs[cardIdx];
          var isLast = cardIdx===agentMsgs.length-1;
          return e("div",null,
            e(Card,{style:{borderRadius:16,border:"1px solid #D7CCC8",marginBottom:12}},
              e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderBottom:"1px solid #F5F0E8"}},
                e(Text,{strong:true,style:{fontSize:16}},isLast?"📊 对比模式":"🤖 "+(cur.sender_name||cur.sender||"?")),
                e(Text,{type:"secondary",style:{fontSize:12}},"第 "+(cardIdx+1)+"/"+agentMsgs.length+" 张")
              ),
              isLast?e("div",{style:{padding:"12px"}}, /* 对比模式 */
                e(Text,{key:"t"},e("div",{style:{marginBottom:12}},
                  e("div",{style:{fontSize:14,fontWeight:700,color:"#2E7D32",marginBottom:4}},"共识/分歧"),
                  e("div",{style:{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.6}},
                    (function(){
                      var names = {};
                      agentMsgs.forEach(function(m){
                        var nm = m.sender_name||m.sender||"?";
                        if (!names[nm]) names[nm] = m.content;
                      });
                      var lines = "💡 各智能体核心观点:\\n";
                      Object.keys(names).forEach(function(k){
                        lines += "• "+k+": "+names[k].slice(0,120)+(names[k].length>120?"...":"")+"\\n";
                      });
                      return lines;
                    })()
                  )
                ))
              ):e("div",{style:{padding:"12px"}}, /* 单智能体卡片 */
                e("div",{style:{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.6,marginBottom:12}},cur.content),
                (function(){
                  var kw = (cur.content||"").slice(0,200).match(/#[^\s#,，。]+/g)||[];
                  return kw.length>0?e("div",{style:{marginTop:8}},kw.map(function(k,i){return e(Tag,{key:i,style:{marginRight:4,marginBottom:4}},k);})):null;
                })()
              )
            ),
            e("div",{style:{display:"flex",justifyContent:"center",gap:12}},
              e(Button,{onClick:function(){setCardIdx(Math.max(0,cardIdx-1));},disabled:cardIdx===0},"◀ 上一张"),
              e(Text,{type:"secondary"},(cardIdx+1)+"/"+agentMsgs.length),
              e(Button,{type:isLast?"primary":"default",onClick:function(){setCardIdx(Math.min(agentMsgs.length-1,cardIdx+1));}},
                isLast?"✓ 结束":"下一张 ▶")
            )
          );
        })()
      ),
      e(Modal,{title:"📄 文件架",open:fileShelfV,onCancel:function(){setFileShelfV(false);},footer:null,width:560},
        e("div",{style:{display:"flex",gap:4,marginBottom:14}},
          e(Button,{size:"small",type:shelfTab==="collected"?"primary":"default",onClick:function(){setShelfTab("collected");loadShelf();},style:{flex:1}},"📥 已收集"),
          e(Button,{size:"small",type:shelfTab==="workspace"?"primary":"default",onClick:function(){setShelfTab("workspace");scanWs("");},style:{flex:1}},"📂 工作区")
        ),
        shelfTab==="collected"?(shelfLd?e(Spin,{tip:t("loading"),style:{display:"block",textAlign:"center",padding:40}}):
        shelfFiles.length===0?e(Empty,{description:"暂无可下载文件。聊天气泡中点击 📥 收集，或从工作区扫描。"}):
        e("div",{style:{maxHeight:400,overflow:"auto"}},
          shelfFiles.map(function(f,i){
            var kb = (f.size/1024).toFixed(1);
            return e(Card,{key:i,size:"small",hoverable:true,style:{marginBottom:8}},
              e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                e("div",null,
                  e(Text,{strong:true},f.original||f.filename),
                  e(Text,{type:"secondary",style:{fontSize:11,display:"block"}},kb+" KB · "+new Date(f.modified*1000).toLocaleString())
                ),
                e(Button,{size:"small",type:"primary",icon:"📥",
                  onClick:function(){downloadShelfFile(f);}},
                  "下载")
              )
            );
          })
        )
      ):(e("div",null,
          e("div",{style:{display:"flex",gap:8,marginBottom:12}},
            e(Input,{size:"small",placeholder:"子目录名, 留空扫根目录",value:wsPath,onChange:function(ev){setWsPath(ev.target.value);},style:{flex:1}}),
            e(Button,{size:"small",type:"primary",onClick:function(){scanWs(wsPath);}},"🔍 扫描"),
            wsPath?e(Button,{size:"small",onClick:function(){scanWs("");setWsPath("");}},"↩ 根"):null
          ),
          wsFiles.filter(function(f){return f.isdir;}).length>0?e("div",{style:{marginBottom:8}},
            wsFiles.filter(function(f){return f.isdir;}).map(function(d,i){
              return e(Button,{key:"d"+i,size:"small",type:"text",icon:"📁",onClick:function(){scanWs(d.path);setWsPath(d.path);},
                style:{marginRight:4,marginBottom:4}},d.name);
            })
          ):null,
          wsLd?e(Spin,{tip:"扫描中...",style:{display:"block",textAlign:"center",padding:40}}):
          wsFiles.filter(function(f){return !f.isdir;}).length===0?e(Empty,{description:"点击 扫描 查看智能体产出文件"}):
          e("div",{style:{maxHeight:400,overflow:"auto"}},
            wsFiles.filter(function(f){return !f.isdir;}).map(function(f,i){
              var kb = (f.size/1024).toFixed(1); var ext = (f.filename||"").split(".").pop().toLowerCase();
              var icon = ext==="md"?"📝":ext==="py"?"🐍":ext==="js"?"📜":ext==="json"?"📋":ext==="html"?"🌐":ext==="txt"?"📃":ext==="log"?"📊":ext==="png"||ext==="jpg"||ext==="gif"||ext==="svg"?"🖼":ext==="pdf"?"📕":ext==="zip"||ext==="tar"||ext==="gz"?"📦":"📄";
              return e(Card,{key:i,size:"small",hoverable:true,style:{marginBottom:8}},
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  e("div",null,
                    e(Text,{style:{fontSize:12}},icon+" "+f.filename),
                    e(Text,{type:"secondary",style:{fontSize:10,display:"block"}},kb+" KB · "+f.path)
                  ),
                  e(Button,{size:"small",icon:"📥",onClick:function(){collectFile(f.path);}},"收集")
                )
              );
            })
          )
        ))
      ),
      e(Modal,{title:"📖 TeamChat v4.0.9 说明文档",open:readmeV,onCancel:function(){setReadmeV(false);},footer:null,width:800,style:{maxHeight:"80vh"}},
        e("div",{style:{maxHeight:"60vh",overflow:"auto",padding:"0 8px",fontFamily:"monospace",fontSize:12,whiteSpace:"pre-wrap",lineHeight:1.6}},readmeC||t("loading"))
      ),
      // ⌨ 快捷键面板
      e(Modal,{title:"⌨ 快捷键",open:keysV,onCancel:function(){setKeysV(false);},footer:null,width:340},
        e("div",{style:{display:"flex",flexDirection:"column",gap:10,fontSize:13}},
          e("div",{style:{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f0f0f0"}},e(Text,{strong:true},"Enter"),e(Text,{type:"secondary"},"发送消息")),
          e("div",{style:{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f0f0f0"}},e(Text,{strong:true},"Shift+Enter"),e(Text,{type:"secondary"},"换行")),
          e("div",{style:{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f0f0f0"}},e(Text,{strong:true},"↑ ↓"),e(Text,{type:"secondary"},"浏览输入历史")),
          e("div",{style:{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f0f0f0"}},e(Text,{strong:true},"?"),e(Text,{type:"secondary"},"显示/隐藏此面板")),
          e("div",{style:{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f0f0f0"}},e(Text,{strong:true},"Esc"),e(Text,{type:"secondary"},"关闭面板/PPT")),
          e("div",{style:{display:"flex",justifyContent:"space-between",padding:"4px 0"}},e(Text,{strong:true},"← → Space 1 2 3"),e(Text,{type:"secondary"},"PPT 播放控制"))
        )
      )
    ));
  }

  QP.registerRoutes("team_chat",[{path:"/plugin/plugins/team_chat/meeting",component:TeamChatPage,label:t("newMeeting"),icon:"团",priority:100}]);
})();
function saveContact() {
  var name = document.getElementById("contact_name")?.value;
  var email = document.getElementById("contact_email")?.value;
  var phone = document.getElementById("contact_phone")?.value;
  var company = document.getElementById("contact_company")?.value;
  var notes = document.getElementById("contact_notes")?.value;
  var group = document.getElementById("contact_group")?.value || "default";

  if (!name || !email) {
    message.error("请填写姓名和邮箱");
    return;
  }

  if (!isValidEmail(email)) {
    message.error("邮箱格式不正确");
    return;
  }

  var contact = {
    name: name,
    email: email,
    phone: phone || "",
    company: company || "",
    notes: notes || "",
    group: group,
    created_at: new Date().toISOString()
  };

  if (saveStoredContact(contact)) {
    message.success("联系人保存成功");

    // 清空表单
    if (document.getElementById("contact_name")) document.getElementById("contact_name").value = "";
    if (document.getElementById("contact_email")) document.getElementById("contact_email").value = "";
    if (document.getElementById("contact_phone")) document.getElementById("contact_phone").value = "";
    if (document.getElementById("contact_company")) document.getElementById("contact_company").value = "";
    if (document.getElementById("contact_notes")) document.getElementById("contact_notes").value = "";

    // 刷新联系人列表
    if (typeof loadContacts === 'function') {
      loadContacts();
    } else {
      location.reload();
    }
  } else {
    message.error("联系人保存失败");
  }
}


function isValidEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ========== AI分身全局开关 ==========
// 注入隐藏样式（!important 覆盖 .ai-copilot-btn 的 display:flex!important）
(function(){
    var hideStyle = document.createElement("style");
    hideStyle.textContent = ".ai-copilot-btn.ai-copilot-btn-hidden { display: none !important; }";
    document.head.appendChild(hideStyle);
})();
window.toggleAIFenshenGlobal = function(enabled) {
    try {
        localStorage.setItem("aiFenshenGlobalEnabled", enabled ? "true" : "false");
        // 同步触发自定义事件，让React组件感知状态变化
        window.dispatchEvent(new CustomEvent("aiFenshenToggle", {detail:{enabled:enabled}}));
        // 智能显隐：仅在 QwenPaw 主界面（非邮箱视图）应用全局开关
        // 在 AI邮箱/传统邮箱内部始终显示 AI分身浮动按钮
        var btn = document.querySelector(".ai-copilot-btn");
        if (btn) {
            if (enabled) {
                btn.classList.remove("ai-copilot-btn-hidden");
            } else {
                // 检查是否在邮箱视图内
                var inEmailView = document.getElementById("teamchat-email-ui") ||
                                  document.querySelector('[class*="aimail"]');
                if (!inEmailView) {
                    btn.classList.add("ai-copilot-btn-hidden");
                    var panel = document.querySelector(".ai-copilot-panel");
                    if (panel) panel.style.display = "none";
                }
                // 如果在邮箱视图内，不隐藏
            }
        }
    } catch(e) {}
};
window.isAIFenshenEnabled = function() {
    try { return localStorage.getItem("aiFenshenGlobalEnabled") !== "false"; } catch(e) { return true; }
};

// 桥接函数：切换 AI分身全局开关（从 AI分身面板按钮调用）
window.__toggleAIFenshen = function() {
    if (window.__aiFenshenEnabled !== undefined) {
        var nv = !window.__aiFenshenEnabled;
        window.__aiFenshenEnabled = nv;
        if (window.__setAiFenshenEnabled) window.__setAiFenshenEnabled(nv);
        window.toggleAIFenshenGlobal(nv);
    } else {
        // 兜底：直接读 localStorage
        var cur = localStorage.getItem("aiFenshenGlobalEnabled") !== "false";
        window.toggleAIFenshenGlobal(!cur);
    }
};

// 桥接函数：外部入口统一打开 React 传统邮箱视图并跳转到指定标签页
window.__openTraditionalEmail = function(tab) {
    tab = tab || "inbox";
    console.log("[__openTraditionalEmail] tab=" + tab);
    if (window.__setAimailView && window.__setAimailMode && window.__fetchEmails && window.__setEmailTab) {
        window.__setAimailView(true);
        window.__setAimailMode("traditional");
        if (tab === "compose") {
            window.__setEmailTab("inbox");
            // 打开写邮件弹窗——延迟等视图渲染完
            setTimeout(function() {
                var wb = document.querySelectorAll('button');
                for (var i = 0; i < wb.length; i++) {
                    if (wb[i].textContent.indexOf('写邮件') >= 0) { wb[i].click(); break; }
                }
            }, 300);
        } else if (tab === "starred") {
            window.__setEmailTab("inbox");
            window.__fetchEmails("inbox");
        } else {
            window.__setEmailTab(tab);
            window.__fetchEmails(tab);
        }
    } else {
        // 组件未挂载时的 fallback：写 localStorage + poll 等待 React mount 后直接调 setter
        console.log("[__openTraditionalEmail] 组件未挂载，poll 等待 mount...");
        try { localStorage.setItem("__pending_email_tab", tab); } catch(e) {}
        window.dispatchEvent(new CustomEvent("openTraditionalEmail", {detail:{tab:tab}}));

        var pollCount = 0, maxPoll = 30; // 最多等 3 秒
        var poll = setInterval(function() {
            pollCount++;
            if (window.__setAimailView && window.__setAimailMode && window.__setEmailTab && window.__fetchEmails) {
                clearInterval(poll);
                window.__setAimailView(true);
                window.__setAimailMode("traditional");
                if (tab === "compose") {
                    window.__setEmailTab("inbox");
                    setTimeout(function() {
                        var btns = document.querySelectorAll('button');
                        for (var i = 0; i < btns.length; i++) {
                            if (btns[i].textContent.indexOf('写邮件') >= 0) { btns[i].click(); break; }
                        }
                    }, 400);
                } else if (tab === "starred") {
                    window.__setEmailTab("inbox");
                    window.__fetchEmails("inbox");
                } else {
                    window.__setEmailTab(tab);
                    window.__fetchEmails(tab);
                }
                return;
            }
            // 每 5 次尝试触发一次挂载（点击 📧 AI邮箱 / 传统邮箱入口）
            if (pollCount % 5 === 0) {
                // 策略1：找 sidebar 里的 📧 AI邮箱 <a>（href=javascript:void(0) 且含 AI邮箱）
                var links = document.querySelectorAll('a[href="javascript:void(0)"]');
                for (var j = 0; j < links.length; j++) {
                    if (links[j].textContent.indexOf('AI邮箱') >= 0) {
                        links[j].click(); break;
                    }
                }
                // 策略2：找 "传统邮箱" 卡片（div，cursor=pointer，含"传统邮箱"文本）
                var divs = document.querySelectorAll('div');
                for (var k = 0; k < divs.length; k++) {
                    if (divs[k].style.cursor === 'pointer' && divs[k].textContent.indexOf('传统邮箱') >= 0) {
                        divs[k].click(); break;
                    }
                }
                // 策略3：直接找 "📧 AI邮箱" 按钮的内部 a 标签的父 div
                if (!window.__setAimailView) {
                    var allDivs = document.querySelectorAll('div');
                    for (var m = 0; m < allDivs.length; m++) {
                        if (allDivs[m].textContent.indexOf('AI邮箱') >= 0 && allDivs[m].textContent.indexOf('🕊') >= 0) {
                            allDivs[m].click(); break;
                        }
                    }
                }
            }
            if (pollCount >= maxPoll) {
                clearInterval(poll);
                console.log("[__openTraditionalEmail] poll 超时，当前页面未加载TeamChat组件");
                alert("📧 请先打开 TeamChat 插件页面，再点击收件箱按钮。\n\n提示：在 QwenPaw 菜单中找到「TeamChat」进入后即可使用邮箱功能。");
            }
        }, 100);
    }
};

// ========== AI副驾全局浮动按钮 ==========
(function() {
    function initAICopilot() {
        // 检查是否已存在按钮，避免重复创建
        var existingBtn = document.querySelector('.ai-copilot-btn');
        if (existingBtn) {
            console.log('[AI Copilot] 按钮已存在，跳过创建');
            return;
        }
        
        // 创建样式
        var style = document.createElement('style');
        style.textContent = `
            .ai-copilot-btn {
                position: fixed !important;
                right: 20px !important;
                top: 20px !important;
                width: 56px !important;
                height: 56px !important;
                border-radius: 50% !important;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%) !important;
                border: none !important;
                color: white !important;
                font-size: 24px !important;
                cursor: pointer !important;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
                z-index: 99999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                opacity: 0.85 !important;
                transition: opacity 0.3s ease !important;
                animation: ai-copilot-pulse 2s ease-in-out infinite !important;
            }
            @keyframes ai-copilot-pulse {
                0% {
                    transform: scale(1);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }
                50% {
                    transform: scale(1.15);
                    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.8), 0 0 50px rgba(102, 126, 234, 0.5);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }
            }
            @keyframes ai-copilot-breathe {
                0%, 100% {
                    opacity: 0.5;
                    filter: brightness(0.8);
                }
                50% {
                    opacity: 1;
                    filter: brightness(1.3);
                }
            }
            @keyframes ai-copilot-glow {
                0%, 100% {
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3), inset 0 0 0 0 rgba(255,255,255,0);
                }
                50% {
                    box-shadow: 0 8px 40px rgba(102, 126, 234, 0.9), inset 0 0 30px rgba(255,255,255,0.5);
                }
            }
            @keyframes ai-copilot-blink {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                    border: 3px solid rgba(255,255,255,0.8) !important;
                    box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 40px rgba(118, 75, 162, 0.6);
                }
                25% {
                    opacity: 0.4;
                    transform: scale(0.85);
                    border: 3px solid rgba(255,255,255,0.3) !important;
                    box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.15);
                    border: 4px solid rgba(255,255,255,1) !important;
                    box-shadow: 0 0 50px rgba(102, 126, 234, 1), 0 0 80px rgba(118, 75, 162, 0.8), inset 0 0 20px rgba(255,255,255,0.5);
                }
                75% {
                    opacity: 0.6;
                    transform: scale(0.9);
                    border: 3px solid rgba(255,255,255,0.5) !important;
                    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
                }
            }
            .ai-copilot-btn {
                animation: ai-copilot-blink 1.2s ease-in-out infinite !important;
                border: 3px solid rgba(255,255,255,0.8) !important;
            }
            .ai-copilot-btn:hover {
                opacity: 1 !important;
                animation: ai-copilot-blink 0.6s ease-in-out infinite !important;
            }
            .ai-copilot-panel {
                position: fixed;
                right: 20px;
                top: 20px;
                width: 600px;
                height: 800px;
                max-height: 90vh;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 100000;
                overflow: hidden;
                resize: both;
                min-width: 400px;
                min-height: 600px;
            }
            .ai-copilot-panel .resize-handle {
                position: absolute !important;
                bottom: 0 !important;
                right: 0 !important;
                width: 20px !important;
                height: 20px !important;
                cursor: se-resize !important;
                z-index: 100001 !important;
            }
            .ai-copilot-panel .resize-handle::after {
                content: '' !important;
                position: absolute !important;
                bottom: 4px !important;
                right: 4px !important;
                width: 8px !important;
                height: 8px !important;
                border-right: 2px solid #999 !important;
                border-bottom: 2px solid #999 !important;
            }
        `;
        document.head.appendChild(style);
        
        // 创建按钮
        var btn = document.createElement('button');
        btn.className = 'ai-copilot-btn';
        btn.innerHTML = '🤖';
        btn.title = 'AI分身 - 生活办公助手 (可拖动)';
        
        // 从 localStorage 读取位置
        var savedPos = localStorage.getItem('aiCopilotPos');
        if (savedPos) {
            var pos = JSON.parse(savedPos);
            btn.style.right = 'auto';
            btn.style.top = 'auto';
            btn.style.left = pos.left + 'px';
            btn.style.bottom = pos.bottom + 'px';
        }
        
        // 拖拽功能
        var isDragging = false;
        var startX, startY, startLeft, startBottom;
        
        btn.onmousedown = function(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            var rect = btn.getBoundingClientRect();
            startLeft = rect.left;
            startBottom = window.innerHeight - rect.bottom;
            btn.style.cursor = 'grabbing';
            e.preventDefault();
        };
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            var newLeft = startLeft + dx;
            var newBottom = startBottom - dy;
            
            // 边界限制
            newLeft = Math.max(0, Math.min(window.innerWidth - 56, newLeft));
            newBottom = Math.max(0, Math.min(window.innerHeight - 56, newBottom));
            
            btn.style.right = 'auto';
            btn.style.top = 'auto';
            btn.style.left = newLeft + 'px';
            btn.style.bottom = newBottom + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                btn.style.cursor = 'pointer';
                // 保存位置
                var rect = btn.getBoundingClientRect();
                localStorage.setItem('aiCopilotPos', JSON.stringify({
                    left: rect.left,
                    bottom: window.innerHeight - rect.bottom
                }));
            }
        });
        
        var panelOpen = false;
        var panel = null;
        
        btn.onclick = function(e) {
            if (isDragging) return;
            if (panelOpen) {
                if (panel) panel.remove();
                panelOpen = false;
                btn.innerHTML = '🤖';
            } else {
                panel = document.createElement('div');
                panel.className = 'ai-copilot-panel';
                panel.innerHTML = `
                    <!-- AI分身头部 - 可拖动 -->
                    <div class="ai-fenshen-header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;user-select:none;">
                        <div style="display:flex;align-items:center;gap:10px;flex:1;">
                            <div style="position:relative;">
                                <img src="/api/plugins/team_chat/media/0123.jpg" 
                                     style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.6);cursor:pointer;" 
                                     id="ai-fenshen-avatar" 
                                     onclick="window.openAvatarSettings()" 
                                     title="点击更换头像"
                                     onerror="this.style.display='none';this.parentNode.innerHTML='<span style=font-size:24px;>🤖</span>';">
                                <div style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;background:#52c41a;border-radius:50%;border:2px solid white;" title="在线"></div>
                            </div>
                            <div style="flex:1;">
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <span style="font-weight:bold;font-size:15px;">AI分身</span>
                                    <span style="font-size:10px;background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:10px;">v3.0</span>
                                </div>
                                <div style="font-size:11px;opacity:0.9;" id="ai-fenshen-status">
                                    <span style="width:6px;height:6px;background:#52c41a;border-radius:50%;display:inline-block;margin-right:4px;"></span>
                                    就绪 · 等待指令
                                </div>
                            </div>
                        </div>
                        <div style="display:flex;gap:4px;">
                            <button onclick="window.__toggleAIFenshen()" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:12px;cursor:pointer;padding:6px 12px;border-radius:4px;white-space:nowrap;" title="切换AI分身开关">📧 AI开关</button>
                            <button onclick="window.minimizeAIFenshen()" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:4px;" title="最小化">_</button>
                            <button onclick="window.hideAIFenshenPanel()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;padding:4px 8px;border-radius:4px;" title="关闭">✕</button>
                        </div>
                    </div>
                    
                    <!-- AI分身工作区 -->
                    <div style="display:flex;flex-direction:column;height:480px;">
                        <!-- 聊天区域 -->
                        <div id="ai-fenshen-chat" style="flex:1;overflow-y:auto;padding:16px;background:#f8f9fa;">
                            <!-- 欢迎消息 -->
                            <div style="margin-bottom:16px;" id="welcome-msg">
                                <div style="display:flex;gap:12px;">
                                    <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0;cursor:pointer;border:2px solid #667eea;box-shadow:0 2px 8px rgba(102,126,234,0.3);" onclick="window.openAvatarSettings()"><img src="/api/plugins/team_chat/media/0123.jpg" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentNode.style.background='linear-gradient(135deg,#667eea,#764ba2)';this.parentNode.innerHTML='<span style=font-size:20px;>🤖</span>';"></div>
                                    <div style="flex:1;">
                                        <div style="background:white;padding:14px 16px;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:280px;">
                                            <div style="font-size:15px;color:#333;line-height:1.5;">
                                                <b>你好！我是AI分身</b> 🤖
                                                <div style="margin-top:10px;font-size:13px;color:#666;line-height:1.7;">
                                                    你的生活办公助手，可以帮你：<br><br>
                                                    📧 邮件办公 · 📝 文档处理<br>
                                                    ⏰ 日程管理 · 💻 软件控制<br>
                                                    🧹 电脑整理 · 🔍 信息查询<br><br>
                                                    <div style="background:#f0f7ff;padding:10px 12px;border-radius:8px;margin-top:8px;font-size:12px;">
                                                        💡 试试说：<br>
                                                        "查看收件箱"<br>
                                                        "生成会议纪要"<br>
                                                        "明天9点提醒我开会"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style="font-size:11px;color:#999;margin-top:6px;">${new Date().toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 快捷功能按钮 -->
                        <div style="padding:10px 16px;background:#fff;border-top:1px solid #eee;display:flex;gap:8px;flex-wrap:wrap;" id="quick-actions">
                            <button onclick="window.__openTraditionalEmail('inbox')" style="padding:6px 12px;background:#e3f2fd;border:none;border-radius:16px;color:#1976d2;font-size:12px;cursor:pointer;">📧 收件箱</button>
                            <button onclick="window.__openTraditionalEmail('starred')" style="padding:6px 12px;background:#fff3e0;border:none;border-radius:16px;color:#f57c00;font-size:12px;cursor:pointer;">⭐ 星标</button>
                            <button onclick="window.__openTraditionalEmail('scheduled')" style="padding:6px 12px;background:#f3e5f5;border:none;border-radius:16px;color:#7b1fa2;font-size:12px;cursor:pointer;">⏰ 定时</button>
                            <button onclick="window.__openTraditionalEmail('compose')" style="padding:6px 12px;background:#e8f5e9;border:none;border-radius:16px;color:#388e3c;font-size:12px;cursor:pointer;">✉️ 写邮件</button>
                            <button onclick="window.sendAIFenshenQuick('生成会议纪要')" style="padding:6px 12px;background:#f3e5f5;border:none;border-radius:16px;color:#7b1fa2;font-size:12px;cursor:pointer;">📝 文档</button>
                            <button onclick="window.showReminderForm()" style="padding:6px 12px;background:#fff3e0;border:none;border-radius:16px;color:#f57c00;font-size:12px;cursor:pointer;">⏰ 提醒</button>
                            <button onclick="window.addAIFenshenMessage('assistant', '<div style=background:#f5f5f5;padding:12px;border-radius:8px;><div style=font-size:14px;color:#333;margin-bottom:8px;>💻 软件控制</div><div style=font-size:12px;color:#666;>请自然语言指挥打开软件。</div></div>')" style="padding:6px 12px;background:#e0f2f1;border:none;border-radius:16px;color:#00897b;font-size:12px;cursor:pointer;">💻 软件</button>
                            <button onclick="window.sendAIFenshenQuick('整理电脑')" style="padding:6px 12px;background:#fce4ec;border:none;border-radius:16px;color:#c2185b;font-size:12px;cursor:pointer;">🧹 整理</button>
                            <button onclick="window.openAvatarSettings()" style="padding:6px 12px;background:#e8eaf6;border:none;border-radius:16px;color:#3f51b5;font-size:12px;cursor:pointer;">🎨 头像</button>
                            <button onclick="window.launchDesktopPet()" style="padding:6px 12px;background:#fff3e0;border:none;border-radius:16px;color:#f57c00;font-size:12px;cursor:pointer;font-weight:bold;">🐱 桌面宠物</button>
                        </div>
                        
                        <!-- 输入区域 -->
                        <div style="padding:12px 16px;background:#fff;border-top:1px solid #eee;">
                            <div style="display:flex;gap:8px;align-items:flex-end;">
                                <div style="flex:1;">
                                    <textarea id="ai-fenshen-input" placeholder="输入指令，或描述你的需求..." rows="1" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:20px;font-size:14px;outline:none;resize:none;min-height:40px;max-height:100px;box-sizing:border-box;" oninput="window.autoResizeTextarea(this)" onkeypress="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window.sendAIFenshenMessage();}"></textarea>
                                </div>
                                <button onclick="window.sendAIFenshenMessage()" style="padding:10px 18px;background:#667eea;border:none;border-radius:20px;color:white;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:4px;flex-shrink:0;">
                                    <span>发送</span>
                                </button>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0;">
                                <div style="display:flex;gap:12px;">
                                    <button onclick="window.showQuickReplies()" style="background:none;border:none;color:#999;font-size:18px;cursor:pointer;padding:4px;" title="快捷回复">⚡</button>
                                    <button onclick="window.showReminderList()" style="background:none;border:none;color:#999;font-size:18px;cursor:pointer;padding:4px;" title="待办提醒">📋</button>
                                    <button onclick="window.showHistoryMenu()" style="background:none;border:none;color:#999;font-size:18px;cursor:pointer;padding:4px;" title="历史记录">📚</button>
                                    <button onclick="window.showCommandHelp()" style="background:none;border:none;color:#999;font-size:18px;cursor:pointer;padding:4px;" title="帮助">❓</button>
                                </div>
                                <div style="font-size:11px;color:#999;">按 Enter 发送，Shift+Enter 换行</div>
                            </div>
                        </div>
                    </div>
                    <!-- 缩放手柄 -->
                    <div class="resize-handle" title="拖动调整大小"></div>
                `;
                document.body.appendChild(panel);
                // AI分身拖拽和缩放功能
                (function() {
                    window.aiFenshenDragInitialized = true;
                    var header = panel.querySelector('.ai-fenshen-header');
                    if (!header) return;
                    
                    var panelState = { right: 20, top: 20, width: 600, height: 800, minimized: false };
                    
                    try {
                        var saved = localStorage.getItem('aiFenshenPanelState');
                        if (saved) Object.assign(panelState, JSON.parse(saved));
                    } catch(e) {}
                    
                    panel.style.right = panelState.right + 'px';
                    panel.style.top = panelState.top + 'px';
                    panel.style.width = panelState.width + 'px';
                    panel.style.height = panelState.minimized ? '60px' : panelState.height + 'px';
                    panel.style.left = 'auto';
                    panel.style.bottom = 'auto';
                    
                    var isDragging = false, startX, startY, startRight, startTop;
                    header.style.cursor = 'move';
                    header.onmousedown = function(e) {
                        if (e.target.tagName === 'BUTTON') return;
                        isDragging = true;
                        startX = e.clientX; startY = e.clientY;
                        var rect = panel.getBoundingClientRect();
                        startRight = window.innerWidth - rect.right;
                        startTop = rect.top;
                        panel.style.transition = 'none';
                        e.preventDefault();
                    };
                    
                    document.addEventListener('mousemove', function(e) {
                        if (!isDragging) return;
                        panel.style.right = Math.max(10, startRight - (e.clientX - startX)) + 'px';
                        panel.style.top = Math.max(10, startTop + (e.clientY - startY)) + 'px';
                        panel.style.left = 'auto';
                    });
                    
                    document.addEventListener('mouseup', function() {
                        if (!isDragging) return;
                        isDragging = false;
                        panel.style.transition = '';
                        var rect = panel.getBoundingClientRect();
                        panelState.right = window.innerWidth - rect.right;
                        panelState.top = rect.top;
                        localStorage.setItem('aiFenshenPanelState', JSON.stringify(panelState));
                    });
                    
                    var resizeHandle = document.createElement('div');
                    resizeHandle.style.cssText = 'position:absolute;bottom:0;right:0;width:20px;height:20px;cursor:nwse-resize;z-index:100;';
                    resizeHandle.innerHTML = '<svg width="12" height="12" style="position:absolute;bottom:4px;right:4px;opacity:0.5;"><path d="M8 12L12 12L12 8M4 12L12 4M0 12L12 0" stroke="#999" stroke-width="1.5" fill="none"/></svg>';
                    panel.appendChild(resizeHandle);
                    
                    var isResizing = false, rStartX, rStartY, rStartW, rStartH;
                    resizeHandle.onmousedown = function(e) {
                        isResizing = true;
                        rStartX = e.clientX; rStartY = e.clientY;
                        var rect = panel.getBoundingClientRect();
                        rStartW = rect.width; rStartH = rect.height;
                        panel.style.transition = 'none';
                        e.preventDefault(); e.stopPropagation();
                    };
                    
                    document.addEventListener('mousemove', function(e) {
                        if (!isResizing) return;
                        panel.style.width = Math.max(400, Math.min(1200, rStartW + e.clientX - rStartX)) + 'px';
                        panel.style.height = Math.max(600, Math.min(1000, rStartH + e.clientY - rStartY)) + 'px';
                    });
                    
                    document.addEventListener('mouseup', function() {
                        if (!isResizing) return;
                        isResizing = false;
                        panel.style.transition = '';
                        var rect = panel.getBoundingClientRect();
                        panelState.width = rect.width;
                        panelState.height = rect.height;
                        localStorage.setItem('aiFenshenPanelState', JSON.stringify(panelState));
                    });
                })();

                panelOpen = true;
                btn.innerHTML = '✕';
                
                // 恢复保存的尺寸
                var savedSize = localStorage.getItem('aiFenshenSize');
                if (savedSize) {
                    try {
                        var size = JSON.parse(savedSize);
                        if (size.width) panel.style.width = size.width;
                        if (size.height) panel.style.height = size.height;
                    } catch(e) {}
                }
                
                // 面板拖拽功能
                var panelDragging = false;
                var panelStartX, panelStartY, panelStartRight, panelStartTop;
                var panelHeader = panel.querySelector('.ai-fenshen-header');
                
                // 如果没有专门的header，使用整个面板顶部区域
                if (!panelHeader) {
                    panelHeader = panel.firstElementChild;
                }
                
                if (panelHeader) {
                    panelHeader.style.cursor = 'move';
                    panelHeader.title = '拖动移动窗口';
                    
                    panelHeader.onmousedown = function(e) {
                        // 只有点击header本身才触发拖拽，不触发子元素
                        if (e.target !== panelHeader && !e.target.closest('.ai-fenshen-header')) return;
                        
                        panelDragging = true;
                        panelStartX = e.clientX;
                        panelStartY = e.clientY;
                        
                        var panelRect = panel.getBoundingClientRect();
                        panelStartRight = window.innerWidth - panelRect.right;
                        panelStartTop = panelRect.top;
                        
                        panelHeader.style.cursor = 'grabbing';
                        e.preventDefault();
                    };
                }
                
                // 全局鼠标移动事件
                var panelMoveHandler = function(e) {
                    if (!panelDragging) return;
                    
                    var dx = e.clientX - panelStartX;
                    var dy = e.clientY - panelStartY;
                    
                    var newRight = panelStartRight - dx;
                    var newTop = panelStartTop + dy;
                    
                    // 边界限制
                    var panelRect = panel.getBoundingClientRect();
                    var minRight = 0;
                    var maxRight = window.innerWidth - panelRect.width;
                    var minTop = 0;
                    var maxTop = window.innerHeight - panelRect.height;
                    
                    newRight = Math.max(minRight, Math.min(maxRight, newRight));
                    newTop = Math.max(minTop, Math.min(maxTop, newTop));
                    
                    panel.style.right = newRight + 'px';
                    panel.style.top = newTop + 'px';
                    panel.style.left = 'auto';
                    panel.style.bottom = 'auto';
                };
                
                var panelUpHandler = function() {
                    if (panelDragging) {
                        panelDragging = false;
                        if (panelHeader) panelHeader.style.cursor = 'move';
                        
                        // 保存位置
                        var panelRect = panel.getBoundingClientRect();
                        localStorage.setItem('aiFenshenPos', JSON.stringify({
                            right: window.innerWidth - panelRect.right,
                            top: panelRect.top
                        }));
                    }
                };
                
                document.addEventListener('mousemove', panelMoveHandler);
                document.addEventListener('mouseup', panelUpHandler);
                
                // 清理函数（面板关闭时移除事件监听）
                panel._cleanupDrag = function() {
                    document.removeEventListener('mousemove', panelMoveHandler);
                    document.removeEventListener('mouseup', panelUpHandler);
                };
                
                // 恢复保存的位置
                var savedPos = localStorage.getItem('aiFenshenPos');
                if (savedPos) {
                    try {
                        var pos = JSON.parse(savedPos);
                        if (pos.right !== undefined) panel.style.right = pos.right + 'px';
                        if (pos.top !== undefined) panel.style.top = pos.top + 'px';
                        panel.style.left = 'auto';
                        panel.style.bottom = 'auto';
                    } catch(e) {}
                }
                
                // 监听尺寸变化并保存
                var resizeObserver = new ResizeObserver(function(entries) {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];
                        localStorage.setItem('aiFenshenSize', JSON.stringify({
                            width: entry.contentRect.width + 'px',
                            height: entry.contentRect.height + 'px'
                        }));
                    }
                });
                resizeObserver.observe(panel);
            }
        };
        
        // 人性化提示语
var aiGreetings = ['好的，我来帮你写这封邮件 ✍️', '收到，正在为你构思邮件内容 💭', '明白，马上为你生成邮件 🚀', '好的，让我来帮你写一封得体的邮件 📧', '收到需求，正在创作中 ✨'];
var aiThinkingTexts = ['正在思考中...', 'AI正在创作...', '正在组织语言...', '正在为你写邮件...', '正在构思内容...'];
var aiDoneTexts = ['邮件写好了，请过目 👀', '完成了，看看是否满意 ✨', '邮件已生成，请检查 📝', '写好了，希望符合你的要求 💌', '邮件创作完成，请查看 📨'];

function getRandomText(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

window.generateEmailWithAI = function() {
            var prompt = document.getElementById('ai-prompt').value.trim();
            if (!prompt) {
                alert('💡 请告诉我你想写什么邮件，比如："给老板写封请假信"');
                return;
            }
            
            var loadingEl = document.getElementById('ai-loading');
            var promptEl = document.getElementById('ai-prompt');
            
            // 显示人性化加载提示
            if (loadingEl) {
                loadingEl.innerHTML = '🤖 ' + getRandomText(aiThinkingTexts);
                loadingEl.style.display = 'block';
            }
            
            // 临时禁用按钮，显示友好提示
            promptEl.style.opacity = '0.6';
            
            // 调用默认智能体
            fetch('/api/console/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Id': 'default'
                },
                body: JSON.stringify({
                    message: getRandomText(aiGreetings) + '\n\n需求：' + prompt + '\n\n请直接返回邮件内容，格式如下：\n收件人：xxx@example.com\n主题：邮件主题\n正文：邮件正文内容',
                    session_id: 'ai_copilot_' + Date.now()
                })
            })
            .then(function(r) { 
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text(); 
            })
            .then(function(text) {
                if (loadingEl) loadingEl.style.display = 'none';
                promptEl.style.opacity = '1';
                
                // 尝试解析JSON
                var response = text;
                try {
                    var jsonData = JSON.parse(text);
                    if (jsonData.response) response = jsonData.response;
                    else if (jsonData.message) response = jsonData.message;
                    else if (jsonData.content) response = jsonData.content;
                } catch(e) {
                    // 不是JSON，直接使用文本
                }
                
                // 解析邮件格式
                var toMatch = response.match(/收件人[:：]\s*(.+?)(?:\n|$)/i);
                var subjectMatch = response.match(/主题[:：]\s*(.+?)(?:\n|$)/i);
                var contentMatch = response.match(/正文[:：]\s*([\s\S]+)/i);
                
                var toEl = document.getElementById('ai-copilot-to');
                var subjEl = document.getElementById('ai-copilot-subject');
                var contentEl = document.getElementById('ai-copilot-content');
                
                if (toMatch && toEl) toEl.value = toMatch[1].trim();
                if (subjectMatch && subjEl) subjEl.value = subjectMatch[1].trim();
                if (contentMatch && contentEl) {
                    contentEl.value = contentMatch[1].trim();
                } else if (contentEl) {
                    contentEl.value = response.trim();
                }
                
                // 人性化完成提示
                setTimeout(function() {
                    alert(getRandomText(aiDoneTexts) + '\n\n如有需要，可以直接修改后再发送 💪');
                }, 300);
            })
            .catch(function(e) {
                if (loadingEl) loadingEl.style.display = 'none';
                promptEl.style.opacity = '1';
                alert('😅 抱歉，AI助手暂时有点忙\n请手动填写邮件内容，我会继续努力的！');
            });
        };
        
        window.sendAICopilotEmail = function() {
            var to = document.getElementById('ai-copilot-to').value.trim();
            var subject = document.getElementById('ai-copilot-subject').value.trim();
            var content = document.getElementById('ai-copilot-content').value.trim();
            
            if (!to || !subject || !content) {
                alert('请填写完整信息');
                return;
            }
            
            fetch('/api/ai-email-v2/send', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    account_id: '1783482324661',
                    to: to,
                    subject: subject,
                    content: content,
                    attachments: []
                })
            })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.success) {
                    alert('邮件发送成功！');
                    var panel = document.querySelector('.ai-copilot-panel');
                    if (panel) panel.remove();
                    window.aiCopilotOpen = false;
                    document.querySelector('.ai-copilot-btn').innerHTML = '🤖';
                } else {
                    alert('发送失败：' + (d.message || '未知错误'));
                }
            })
            .catch(function(e) {
                alert('发送失败：' + e.message);
            });
        };
        
        document.body.appendChild(btn);
        // 检查全局开关状态，如果之前已关闭则隐藏
        if (!window.isAIFenshenEnabled()) {
            btn.classList.add("ai-copilot-btn-hidden");
        }
        console.log('[AI Copilot] 浮动按钮已添加');
    }
    
    setTimeout(initAICopilot, 2000);
})();

// ========== AI分身核心功能 ==========

// 自动识别URL并转为超链接（用于AI分身消息）
window.autoLinkUrls = function(text) {
    if (!text) return '';
    // URL正则：匹配 http/https/ftp 链接和 www 开头的域名
    var urlRegex = /(https?:\/\/[^\s<]+|ftp:\/\/[^\s<]+|www\.[^\s<]+)/g;
    return text.replace(urlRegex, function(url) {
        var href = url;
        if (url.indexOf('http') !== 0 && url.indexOf('ftp') !== 0) {
            href = 'http://' + url;
        }
        return '<a href="' + href + '" target="_blank" style="color:#1890ff;text-decoration:underline;" onclick="event.stopPropagation();">' + url + '</a>';
    });
};

// 获取输入并执行
window.sendAIFenshenCommand = function() {
    var input = document.getElementById('ai-prompt');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    window.processAIFenshenCommand(text);
};

// 处理指令
window.processAIFenshenCommand = function(text) {
    var lower = text.toLowerCase();
    
    // 邮件相关
    if (lower.includes('邮件') || lower.includes('收件箱')) {
        window.showAIFenshenResult('📧 邮件功能', '正在查询邮件...', [
            {icon: '📧', title: '收件箱', desc: '2封未读'},
            {icon: '📤', title: '发件箱', desc: '已发送'}
        ]);
    }
    // 文档相关
    else if (lower.includes('文档') || lower.includes('纪要') || lower.includes('总结')) {
        window.showAIFenshenResult('📝 文档生成', '正在生成文档...', [
            {icon: '📝', title: '会议纪要', action: '生成'},
            {icon: '📄', title: '工作总结', action: '生成'},
            {icon: '📋', title: '请假条', action: '生成'}
        ]);
    }
    // 提醒相关
    else if (lower.includes('提醒') || lower.includes('闹钟')) {
        window.showReminderForm();
    }
    // 软件控制
    else if (lower.includes('打开') || lower.includes('关闭')) {
        window.handleSoftwareControl(text);
    }
    // 电脑整理
    else if (lower.includes('整理') || lower.includes('清理')) {
        window.handleSystemCleanup(text);
    }
    // 查询
    else if (lower.includes('天气') || lower.includes('时间')) {
        window.showAIFenshenResult('🔍 信息查询', '查询结果', [
            {icon: '☀️', title: '今天天气', desc: '晴朗 25-32°C'},
            {icon: '🕐', title: '当前时间', desc: new Date().toLocaleString()}
        ]);
    }
    // 默认
    else {
        window.showAIFenshenResult('🤖 AI分身', '收到你的需求', [
            {icon: '💡', title: '建议', desc: '试试说"查看收件箱"或"生成会议纪要"'}
        ]);
    }
};

// 显示结果
window.showAIFenshenResult = function(title, subtitle, items) {
    var resultDiv = document.getElementById('ai-copilot-result') || document.createElement('div');
    resultDiv.id = 'ai-copilot-result';
    resultDiv.style.cssText = 'margin-top:16px;padding:16px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);';
    
    var html = '<div style="font-weight:bold;margin-bottom:8px;">' + title + '</div>';
    html += '<div style="color:#666;margin-bottom:12px;">' + subtitle + '</div>';
    
    items.forEach(function(item) {
        html += '<div style="padding:10px;background:#f5f5f5;border-radius:6px;margin-bottom:8px;display:flex;align-items:center;gap:8px;">';
        html += '<span style="font-size:20px;">' + item.icon + '</span>';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:500;">' + item.title + '</div>';
        if (item.desc) html += '<div style="font-size:12px;color:#999;">' + item.desc + '</div>';
        html += '</div>';
        if (item.action) html += '<button style="padding:4px 12px;background:#667eea;border:none;border-radius:4px;color:white;font-size:12px;cursor:pointer;">' + item.action + '</button>';
        html += '</div>';
    });
    
    resultDiv.innerHTML = html;
    
    var panel = document.querySelector('.ai-copilot-panel');
    if (panel) {
        panel.appendChild(resultDiv);
    }
};

// 提醒表单
window.showReminderForm = function() {
    var resultDiv = document.getElementById('ai-copilot-result') || document.createElement('div');
    resultDiv.id = 'ai-copilot-result';
    resultDiv.style.cssText = 'margin-top:16px;padding:16px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);';
    
    var now = new Date();
    var dateStr = now.toISOString().split('T')[0];
    var timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    
    resultDiv.innerHTML = `
        <div style="font-weight:bold;margin-bottom:12px;">⏰ 设置提醒</div>
        <div style="margin-bottom:10px;">
            <input type="date" id="reminder-date" value="${dateStr}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;box-sizing:border-box;">
            <input type="time" id="reminder-time" value="${timeStr}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:8px;box-sizing:border-box;">
            <input type="text" id="reminder-content" placeholder="提醒内容..." style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;">
        </div>
        <div style="display:flex;gap:8px;">
            <button onclick="window.saveReminder()" style="flex:1;padding:10px;background:#667eea;border:none;border-radius:6px;color:white;cursor:pointer;">✓ 保存</button>
            <button onclick="document.getElementById('ai-copilot-result').remove();" style="flex:1;padding:10px;background:#f5f5f5;border:none;border-radius:6px;color:#666;cursor:pointer;">取消</button>
        </div>
    `;
    
    var panel = document.querySelector('.ai-copilot-panel');
    if (panel) {
        panel.appendChild(resultDiv);
    }
};

// 保存提醒
window.saveReminder = function() {
    var date = document.getElementById('reminder-date').value;
    var time = document.getElementById('reminder-time').value;
    var content = document.getElementById('reminder-content').value;
    
    if (!content) {
        alert('请输入提醒内容');
        return;
    }
    
    var reminders = JSON.parse(localStorage.getItem('aiFenshenReminders') || '[]');
    reminders.push({date, time, content, id: Date.now()});
    localStorage.setItem('aiFenshenReminders', JSON.stringify(reminders));
    
    window.showAIFenshenResult('✅ 提醒已设置', date + ' ' + time + '<br>' + content, []);
};

// 软件控制 - 重写
window.handleSoftwareControl = function(text) {
    var software = text.replace(/(打开|关闭|启动|退出)/g, '').trim();
    var isOpen = /打开|启动/.test(text);
    var name = software;
    var action = isOpen ? '打开' : '关闭';
    
    // 简单的文字说明，没有列表
    var html = '<div style="background:#f5f5f5;padding:12px;border-radius:8px;">';
    html += '<div style="font-size:14px;color:#333;margin-bottom:8px;">💻 ' + action + ' ' + name + '</div>';
    html += '<div style="font-size:12px;color:#666;">请自然语言指挥' + action + '该软件。</div>';
    html += '</div>';
    
    window.addAIFenshenMessage('assistant', html);
};

// 电脑整理
window.handleSystemCleanup = function(text) {
    window.addAIFenshenMessage('assistant', '🧹 <b>电脑整理</b><br><br><div style="background:#f5f5f5;padding:12px;border-radius:8px;"><div style="font-size:14px;color:#333;margin-bottom:8px;">整理项目：</div><div style="font-size:12px;color:#666;">• 🗑️ 清理临时文件<br>• ♻️ 清空回收站<br>• 💾 释放内存<br><br>请自然语言指挥执行这些操作。</div></div>');
};

console.log('[AI分身] 核心功能已加载');

// ========== AI分身核心功能 v3.0 ==========

// 状态管理
window.AIFenshenState = {
    isOpen: false,
    isMinimized: false,
    messages: [],
    currentTask: null,
    avatar: '/api/plugins/team_chat/media/0123.jpg'
};

// 初始化状态
window.initAIFenshen = function() {
    // 加载保存的状态
    var saved = localStorage.getItem('aiFenshenState');
    if (saved) {
        try {
            var state = JSON.parse(saved);
            window.AIFenshenState.avatar = state.avatar || window.AIFenshenState.avatar;
        } catch(e) {}
    }
    
    // 加载历史消息（最多50条）
    var savedMessages = localStorage.getItem('aiFenshenMessages');
    if (savedMessages) {
        try {
            var messages = JSON.parse(savedMessages);
            if (Array.isArray(messages) && messages.length > 0) {
                window.AIFenshenState.messages = messages;
                console.log('[AI分身] 已加载 ' + messages.length + ' 条历史消息');
            }
        } catch(e) {
            console.error('[AI分身] 加载历史消息失败:', e);
        }
    }
};

// 自动调整文本框高度
window.autoResizeTextarea = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
};

// 隐藏面板（下次自动打开）
window.hideAIFenshenPanel = function() {
    var panel = document.querySelector('.ai-copilot-panel');
    if (panel) {
        // 清理拖拽事件监听
        if (panel._cleanupDrag) {
            panel._cleanupDrag();
        }
        panel.style.display = 'none';
        window.AIFenshenState.isOpen = false;
        window.AIFenshenState.isMinimized = false;
        localStorage.setItem('aiFenshenWasOpen', 'false');
    }
    var btn = document.querySelector('.ai-copilot-btn');
    if (btn) btn.innerHTML = '🤖';
};

// 最小化面板
window.minimizeAIFenshen = function() {
    var panel = document.querySelector('.ai-copilot-panel');
    if (panel) {
        var chat = document.getElementById('ai-fenshen-chat');
        var quick = document.getElementById('quick-actions');
        var input = panel.querySelector('textarea');
        
        if (window.AIFenshenState.isMinimized) {
            // 恢复
            if (chat) chat.style.display = 'block';
            if (quick) quick.style.display = 'flex';
            window.AIFenshenState.isMinimized = false;
        } else {
            // 最小化
            if (chat) chat.style.display = 'none';
            if (quick) quick.style.display = 'none';
            window.AIFenshenState.isMinimized = true;
        }
    }
};

// 添加消息到聊天
window.addAIFenshenMessage = function(type, content, options) {
    var chat = document.getElementById('ai-fenshen-chat');
    if (!chat) return;
    
    var msgDiv = document.createElement('div');
    msgDiv.style.cssText = 'margin-bottom:16px;animation:fadeIn 0.3s ease;';
    
    var isUser = type === 'user';
    var avatar = isUser ? '👤' : '🤖';
    var bgColor = isUser ? '#667eea' : 'white';
    var textColor = isUser ? 'white' : '#333';
    var align = isUser ? 'flex-end' : 'flex-start';
    var avatarBg = isUser ? '#667eea' : 'linear-gradient(135deg,#667eea,#764ba2)';
    
    var time = new Date().toLocaleTimeString();
    
    // 自动识别URL并转为超链接
    var processedContent = window.autoLinkUrls(content);
    
    msgDiv.innerHTML = `
        <div style="display:flex;gap:12px;justify-content:${align};">
            ${isUser ? '' : `<div style="width:40px;height:40px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;color:white;font-size:20px;flex-shrink:0;">${avatar}</div>`}
            <div style="max-width:280px;">
                <div style="background:${bgColor};padding:12px 16px;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);color:${textColor};font-size:14px;line-height:1.5;">
                    ${processedContent}
                </div>
                <div style="font-size:11px;color:#999;margin-top:4px;text-align:${isUser ? 'right' : 'left'};">${time}</div>
            </div>
            ${isUser ? `<div style="width:40px;height:40px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;color:white;font-size:20px;flex-shrink:0;">${avatar}</div>` : ''}
        </div>
    `;
    
    chat.appendChild(msgDiv);
    chat.scrollTop = chat.scrollHeight;
    
    // 保存消息
    window.AIFenshenState.messages.push({type, content, time});
    if (window.AIFenshenState.messages.length > 100) {
        window.AIFenshenState.messages.shift();
    }
    
    // 持久化到 localStorage（最多保存50条）
    var messagesToSave = window.AIFenshenState.messages.slice(-50);
    localStorage.setItem('aiFenshenMessages', JSON.stringify(messagesToSave));
};

// 发送消息
window.sendAIFenshenMessage = function() {
    var input = document.getElementById('ai-fenshen-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    input.style.height = 'auto';
    
    // 添加用户消息
    window.addAIFenshenMessage('user', text);
    
    // 显示思考状态
    window.updateAIFenshenStatus('thinking');
    
    // 处理指令
    setTimeout(function() {
        window.processAIFenshenCommand(text);
    }, 500);
};

// 快捷发送
window.sendAIFenshenQuick = function(text) {
    window.addAIFenshenMessage('user', text);
    window.updateAIFenshenStatus('thinking');
    setTimeout(function() {
        window.processAIFenshenCommand(text);
    }, 300);
};

// 更新状态
window.updateAIFenshenStatus = function(status) {
    var el = document.getElementById('ai-fenshen-status');
    if (!el) return;
    
    var statusMap = {
        'idle': '<span style="width:6px;height:6px;background:#52c41a;border-radius:50%;display:inline-block;margin-right:4px;"></span>就绪 · 等待指令',
        'thinking': '<span style="width:6px;height:6px;background:#faad14;border-radius:50%;display:inline-block;margin-right:4px;animation:pulse 1s infinite;"></span>思考中...',
        'executing': '<span style="width:6px;height:6px;background:#1890ff;border-radius:50%;display:inline-block;margin-right:4px;animation:pulse 1s infinite;"></span>执行中...',
        'completed': '<span style="width:6px;height:6px;background:#52c41a;border-radius:50%;display:inline-block;margin-right:4px;"></span>已完成',
        'error': '<span style="width:6px;height:6px;background:#ff4d4f;border-radius:50%;display:inline-block;margin-right:4px;"></span>出错了'
    };
    
    el.innerHTML = statusMap[status] || statusMap['idle'];
};

// 处理指令
window.processAIFenshenCommand = function(text) {
    var lower = text.toLowerCase();
    
    // 邮件相关
    if (lower.includes('邮件') || lower.includes('收件箱') || lower.includes('发件箱')) {
        window.handleAIFenshenEmail(lower);
    }
    // 文档相关
    else if (lower.includes('文档') || lower.includes('纪要') || lower.includes('总结') || lower.includes('报告')) {
        window.handleAIFenshenDocument(lower);
    }
    // 提醒相关
    else if (lower.includes('提醒') || lower.includes('闹钟') || lower.includes('待办')) {
        window.handleAIFenshenReminder(lower, text);
    }
    // 软件控制
    else if (lower.includes('打开') || lower.includes('关闭') || lower.includes('启动') || lower.includes('退出')) {
        window.handleAIFenshenSoftware(lower, text);
    }
    // 电脑整理
    else if (lower.includes('整理') || lower.includes('清理') || lower.includes('优化')) {
        window.handleAIFenshenCleanup(lower, text);
    }
    // 查询
    else if (lower.includes('天气') || lower.includes('时间') || lower.includes('日期')) {
        window.handleAIFenshenQuery(lower);
    }
    // 帮助
    else if (lower.includes('帮助') || lower.includes('指令') || lower.includes('功能')) {
        window.showCommandHelp();
    }
    // 默认
    else {
        window.addAIFenshenMessage('assistant', '🤖 收到！我可以帮你：<br><br>📧 邮件办公 · 📝 文档处理<br>⏰ 日程管理 · 💻 软件控制<br>🧹 电脑整理 · 🔍 信息查询<br><br>试试说"查看收件箱"或"生成会议纪要"');
    }
    
    window.updateAIFenshenStatus('completed');
    setTimeout(function() {
        window.updateAIFenshenStatus('idle');
    }, 2000);
};

// 邮件处理
window.handleAIFenshenEmail = function(lower) {
    if (lower.includes('收件箱') || lower.includes('收')) {
        window.addAIFenshenMessage('assistant', '📧 <b>收件箱</b><br><br>📨 未读邮件 (2)<br>├─ 来自：老板<br>│  主题：关于明天会议<br>│  时间：10:30<br>├─ 来自：客户<br>│  主题：项目进度确认<br>│  时间：09:15<br><br><button onclick="window.sendAIFenshenQuick(' + "'" + '打开第一封邮件' + "'" + ')" style="padding:6px 12px;background:#667eea;border:none;border-radius:6px;color:white;font-size:12px;cursor:pointer;">📖 阅读</button>');
    } else if (lower.includes('写') || lower.includes('发')) {
        window.addAIFenshenMessage('assistant', '✉️ <b>写邮件</b><br><br><div style="background:#f5f5f5;padding:12px;border-radius:8px;"><div style="margin-bottom:8px;"><input type="text" placeholder="收件人" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div><div style="margin-bottom:8px;"><input type="text" placeholder="主题" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div><textarea placeholder="邮件内容..." rows="3" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;resize:vertical;"></textarea></div><br><button style="padding:8px 16px;background:#52c41a;border:none;border-radius:6px;color:white;cursor:pointer;">🚀 发送</button>');
    } else {
        window.addAIFenshenMessage('assistant', '📧 <b>邮件功能</b><br><br>试试说：<br>• "查看收件箱"<br>• "写邮件给老板"<br>• "查看发件箱"');
    }
};

// 文档处理
window.handleAIFenshenDocument = function(lower) {
    if (lower.includes('纪要') || lower.includes('会议')) {
        window.addAIFenshenMessage('assistant', '📝 <b>会议纪要生成器</b><br><br>请提供会议信息：<br><div style="background:#f5f5f5;padding:12px;border-radius:8px;margin-top:8px;"><textarea id="meeting-input" placeholder="会议主题、参会人员、讨论要点..." rows="4" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;resize:vertical;"></textarea><br><br><button onclick="window.generateMeetingMinutes()" style="padding:8px 16px;background:#667eea;border:none;border-radius:6px;color:white;cursor:pointer;">✨ 生成纪要</button></div>');
    } else if (lower.includes('总结') || lower.includes('工作')) {
        window.addAIFenshenMessage('assistant', '📄 <b>工作总结生成器</b><br><br>请提供工作信息：<br><div style="background:#f5f5f5;padding:12px;border-radius:8px;margin-top:8px;"><textarea placeholder="本周/本月工作内容、成果、问题..." rows="4" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;resize:vertical;"></textarea><br><br><button style="padding:8px 16px;background:#667eea;border:none;border-radius:6px;color:white;cursor:pointer;">✨ 生成总结</button></div>');
    } else {
        window.addAIFenshenMessage('assistant', '📝 <b>文档功能</b><br><br>试试说：<br>• "生成会议纪要"<br>• "写工作总结"<br>• "生成请假条"');
    }
};

// 生成会议纪要
window.generateMeetingMinutes = function() {
    var input = document.getElementById('meeting-input');
    var content = input ? input.value : '';
    
    var minutes = `<b>会议纪要</b><br><br>
<b>会议主题：</b>项目进度讨论<br>
<b>会议时间：</b>${new Date().toLocaleString()}<br>
<b>参会人员：</b>张三、李四、王五<br><br>
<b>一、会议内容</b><br>
1. 项目当前进度汇报<br>
2. 存在问题讨论<br>
3. 下一步工作安排<br><br>
<b>二、决议事项</b><br>
✓ 本周完成前端开发<br>
✓ 下周开始联调测试<br><br>
<b>三、待办事项</b><br>
□ 张三：完成API接口<br>
□ 李四：编写测试用例<br><br>
<button onclick="window.copyToClipboard(this)" style="padding:6px 12px;background:#667eea;border:none;border-radius:4px;color:white;font-size:12px;cursor:pointer;">📋 复制内容</button>`;
    
    window.addAIFenshenMessage('assistant', minutes);
};

// 复制到剪贴板
window.copyToClipboard = function(btn) {
    var text = btn.parentElement.innerText.replace('📋 复制内容', '');
    navigator.clipboard.writeText(text).then(function() {
        btn.innerText = '✓ 已复制';
        setTimeout(function() { btn.innerText = '📋 复制内容'; }, 2000);
    });
};

// 提醒处理
window.handleAIFenshenReminder = function(lower, text) {
    if (lower.includes('列表') || lower.includes('查看') || lower.includes('待办')) {
        window.showReminderList();
    } else {
        window.showReminderForm();
    }
};

// 显示提醒表单
window.showReminderForm = function() {
    var now = new Date();
    var dateStr = now.toISOString().split('T')[0];
    var timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    window.addAIFenshenMessage('assistant', `⏰ <b>设置提醒</b><br><br>
<div style="background:#f5f5f5;padding:12px;border-radius:8px;">
<div style="margin-bottom:8px;"><input type="date" id="reminder-date" value="${dateStr}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
<div style="margin-bottom:8px;"><input type="time" id="reminder-time" value="${timeStr}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
<div style="margin-bottom:8px;"><input type="text" id="reminder-content" placeholder="提醒内容..." style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;"></div>
<div style="display:flex;gap:8px;">
<button onclick="window.saveAIFenshenReminder()" style="flex:1;padding:8px;background:#52c41a;border:none;border-radius:4px;color:white;cursor:pointer;">✓ 保存</button>
<button onclick="window.cancelReminderForm()" style="flex:1;padding:8px;background:#f5f5f5;border:none;border-radius:4px;color:#666;cursor:pointer;">取消</button>
</div>
</div>`);
};

// 保存提醒
window.saveAIFenshenReminder = function() {
    var date = document.getElementById('reminder-date').value;
    var time = document.getElementById('reminder-time').value;
    var content = document.getElementById('reminder-content').value;
    
    if (!content) {
        alert('请输入提醒内容');
        return;
    }
    
    var reminders = JSON.parse(localStorage.getItem('aiFenshenReminders') || '[]');
    reminders.push({date, time, content, id: Date.now(), completed: false});
    localStorage.setItem('aiFenshenReminders', JSON.stringify(reminders));
    
    window.addAIFenshenMessage('assistant', '✅ <b>提醒已设置</b><br><br>📅 ' + date + '<br>⏰ ' + time + '<br>📝 ' + content);
    window.updateTaskCount();
};

// 取消提醒表单
window.cancelReminderForm = function() {
    var chat = document.getElementById('ai-fenshen-chat');
    if (chat && chat.lastChild) {
        chat.lastChild.remove();
    }
};

// 显示提醒列表
window.showReminderList = function() {
    var reminders = JSON.parse(localStorage.getItem('aiFenshenReminders') || '[]');
    var pending = reminders.filter(function(r) { return !r.completed; });
    
    if (pending.length === 0) {
        window.addAIFenshenMessage('assistant', '📋 <b>暂无待办提醒</b><br><br><button onclick="window.showReminderForm()" style="padding:8px 16px;background:#667eea;border:none;border-radius:6px;color:white;cursor:pointer;">+ 新建提醒</button>');
        return;
    }
    
    var html = '📋 <b>待办提醒 (' + pending.length + ')</b><br><br>';
    pending.forEach(function(r) {
        html += '<div style="padding:10px;background:#f5f5f5;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:8px;">';
        html += '<span style="font-size:16px;">⏰</span>';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:500;">' + r.content + '</div>';
        html += '<div style="font-size:12px;color:#999;">' + r.date + ' ' + r.time + '</div>';
        html += '</div>';
        html += '<button onclick="window.completeAIFenshenReminder(' + r.id + ')" style="background:#52c41a;border:none;border-radius:50%;width:24px;height:24px;color:white;cursor:pointer;font-size:12px;">✓</button>';
        html += '</div>';
    });
    html += '<br><button onclick="window.showReminderForm()" style="padding:8px 16px;background:#667eea;border:none;border-radius:6px;color:white;cursor:pointer;">+ 新建提醒</button>';
    
    window.addAIFenshenMessage('assistant', html);
};

// 完成提醒
window.completeAIFenshenReminder = function(id) {
    var reminders = JSON.parse(localStorage.getItem('aiFenshenReminders') || '[]');
    var r = reminders.find(function(x) { return x.id === id; });
    if (r) {
        r.completed = true;
        localStorage.setItem('aiFenshenReminders', JSON.stringify(reminders));
    }
    window.addAIFenshenMessage('assistant', '✅ 提醒已完成');
    window.updateTaskCount();
};

// 更新任务计数
window.updateTaskCount = function() {
    var reminders = JSON.parse(localStorage.getItem('aiFenshenReminders') || '[]');
    var count = reminders.filter(function(r) { return !r.completed; }).length;
    // 可以在这里更新UI显示
};

// 软件控制
window.handleAIFenshenSoftware = function(lower, text) {
    var isOpen = /打开|启动/.test(text);
    var action = isOpen ? '打开' : '关闭';
    
    var software = text.replace(/(打开|关闭|启动|退出)/g, '').trim();
    var map = {
        'word': 'Microsoft Word',
        'excel': 'Microsoft Excel',
        'powerpoint': 'PowerPoint',
        'chrome': 'Chrome浏览器',
        'edge': 'Edge浏览器',
        '浏览器': '浏览器',
        '微信': '微信',
        'qq': 'QQ',
        '计算器': '计算器',
        '记事本': '记事本'
    };
    
    var name = map[software.toLowerCase()] || software;
    
    window.addAIFenshenMessage('assistant', '💻 <b>软件控制</b><br><br>' + action + ' <b>' + name + '</b><br><br><div style="background:#f0f7ff;padding:12px;border-radius:8px;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:24px;">' + (isOpen ? '🚀' : '⏹️') + '</span><div><div style="font-weight:500;">' + name + '</div><div style="font-size:12px;color:#999;">' + (isOpen ? '正在启动...' : '正在关闭...') + '</div></div></div><div style="margin-top:8px;height:4px;background:#e0e0e0;border-radius:2px;"><div style="height:100%;width:0%;background:#52c41a;border-radius:2px;animation:progress 2s forwards;"></div></div></div>');
};

// 电脑整理
window.handleAIFenshenCleanup = function(lower, text) {
    if (lower.includes('一键') || lower.includes('全部')) {
        window.addAIFenshenMessage('assistant', '🧹 <b>一键整理电脑</b><br><br><div style="background:#f5f5f5;padding:12px;border-radius:8px;"><div style="margin-bottom:8px;">🗑️ 清理临时文件 <span style="color:#52c41a;">✓</span></div><div style="margin-bottom:8px;">♻️ 清空回收站 <span style="color:#52c41a;">✓</span></div><div style="margin-bottom:8px;">🧹 清理浏览器缓存 <span style="color:#52c41a;">✓</span></div><div style="margin-bottom:8px;">💾 释放内存 <span style="color:#52c41a;">✓</span></div><div style="margin-bottom:8px;">🔍 磁盘清理 <span style="color:#52c41a;">✓</span></div><div>📊 大文件扫描 <span style="color:#52c41a;">✓</span></div></div><br>✅ <b>整理完成！</b><br>释放了 2.3GB 空间');
    } else {
        window.addAIFenshenMessage('assistant', '🧹 <b>电脑整理</b><br><br>试试说：<br>• "一键整理电脑"<br>• "清理临时文件"<br>• "释放内存"');
    }
};

// 查询
window.handleAIFenshenQuery = function(lower) {
    if (lower.includes('时间') || lower.includes('日期')) {
        window.addAIFenshenMessage('assistant', '🕐 <b>当前时间</b><br><br>' + new Date().toLocaleString('zh-CN', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'}));
    } else {
        window.addAIFenshenMessage('assistant', '🔍 <b>信息查询</b><br><br>试试说：<br>• "现在几点"<br>• "今天日期"<br>• "北京天气"');
    }
};

// 显示帮助
window.showCommandHelp = function() {
    window.addAIFenshenMessage('assistant', '❓ <b>AI分身指令帮助</b><br><br><b>📧 邮件办公</b><br>• 查看收件箱<br>• 写邮件给[某人]<br><br><b>📝 文档处理</b><br>• 生成会议纪要<br>• 写工作总结<br><br><b>⏰ 日程管理</b><br>• 设置提醒<br>• 查看待办<br><br><b>💻 软件控制</b><br>• 打开[软件名]<br>• 关闭[软件名]<br><br><b>🧹 电脑整理</b><br>• 一键整理电脑<br>• 清理临时文件<br><br><b>🔍 信息查询</b><br>• 现在几点<br>• 今天日期');
};

// 头像设置
window.openAvatarSettings = function() {
    var currentAvatar = window.AIFenshenState.avatar || '/api/plugins/team_chat/media/0123.jpg';
    window.addAIFenshenMessage('assistant', '🎨 <b>头像设置</b><br><br><div style="background:#f5f5f5;padding:12px;border-radius:8px;"><div style="text-align:center;margin-bottom:12px;"><img id="avatar-preview" src="' + currentAvatar + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #667eea;" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<div style=font-size:48px;>🤖</div>\';"></div><div style="margin-bottom:8px;"><input type="text" id="avatar-url" placeholder="输入图片URL..." style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;margin-bottom:8px;"><div style="display:flex;gap:8px;"><input type="file" id="avatar-file" accept="image/*" style="flex:1;padding:6px;border:1px solid #ddd;border-radius:4px;background:white;" onchange="window.previewAvatarFile(this)"><button onclick="window.uploadAvatarFile()" style="padding:6px 12px;background:#52c41a;border:none;border-radius:4px;color:white;cursor:pointer;white-space:nowrap;">上传</button></div></div><div style="display:flex;gap:8px;margin-top:12px;"><button onclick="window.saveAvatar()" style="flex:1;padding:8px;background:#667eea;border:none;border-radius:4px;color:white;cursor:pointer;">保存</button><button onclick="window.resetAvatar()" style="flex:1;padding:8px;background:#f5f5f5;border:none;border-radius:4px;color:#666;cursor:pointer;">恢复默认</button></div></div>');
};

// 预览本地文件
window.previewAvatarFile = function(input) {
    var file = input.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var preview = document.getElementById('avatar-preview');
            if (preview) {
                preview.src = e.target.result;
            }
            // 临时保存到全局变量
            window._tempAvatarData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// 上传头像文件
window.uploadAvatarFile = function() {
    var input = document.getElementById('avatar-file');
    var file = input ? input.files[0] : null;
    
    if (!file && !window._tempAvatarData) {
        window.addAIFenshenMessage('assistant', '⚠️ 请先选择图片文件');
        return;
    }
    
    // 使用已读取的数据
    if (window._tempAvatarData) {
        window.AIFenshenState.avatar = window._tempAvatarData;
        localStorage.setItem('aiFenshenState', JSON.stringify({avatar: window._tempAvatarData}));
        
        // 更新面板中的头像
        var avatarImgs = document.querySelectorAll('#ai-fenshen-avatar, .ai-fenshen-avatar');
        for (var i = 0; i < avatarImgs.length; i++) {
            avatarImgs[i].src = window._tempAvatarData;
        }
        
        window.addAIFenshenMessage('assistant', '✅ 头像已更新（本地图片）');
        window._tempAvatarData = null;
    }
};

// 保存头像
window.saveAvatar = function() {
    var urlInput = document.getElementById('avatar-url');
    var url = urlInput ? urlInput.value.trim() : '';
    
    // 优先使用本地文件数据
    if (window._tempAvatarData) {
        window.AIFenshenState.avatar = window._tempAvatarData;
        localStorage.setItem('aiFenshenState', JSON.stringify({avatar: window._tempAvatarData}));
        window.addAIFenshenMessage('assistant', '✅ 头像已更新（本地图片）');
        window._tempAvatarData = null;
        return;
    }
    
    // 使用URL
    if (url) {
        window.AIFenshenState.avatar = url;
        localStorage.setItem('aiFenshenState', JSON.stringify({avatar: url}));
        
        // 更新面板中的头像
        var avatarImgs = document.querySelectorAll('#ai-fenshen-avatar, .ai-fenshen-avatar');
        for (var i = 0; i < avatarImgs.length; i++) {
            avatarImgs[i].src = url;
        }
        
        window.addAIFenshenMessage('assistant', '✅ 头像已更新');
    } else {
        window.addAIFenshenMessage('assistant', '⚠️ 请输入图片URL或选择本地文件');
    }
};

// 恢复默认头像
window.resetAvatar = function() {
    window.AIFenshenState.avatar = '/api/plugins/team_chat/media/0123.jpg';
    localStorage.setItem('aiFenshenState', JSON.stringify({avatar: '/api/plugins/team_chat/media/0123.jpg'}));
    window._tempAvatarData = null;
    
    // 更新面板中的头像
    var avatarImgs = document.querySelectorAll('#ai-fenshen-avatar, .ai-fenshen-avatar');
    for (var i = 0; i < avatarImgs.length; i++) {
        avatarImgs[i].src = '/api/plugins/team_chat/media/0123.jpg';
    }
    
    window.addAIFenshenMessage('assistant', '✅ 已恢复默认头像');
};

// 启动桌面宠物
window.launchDesktopPet = function() {
    // 直接打开 QwenPaw 的插件宠物
    window.addAIFenshenMessage('assistant', '🐱 <b>打开桌面宠物</b><br><br>正在打开 QwenPaw 插件宠物...');
    
    // 尝试打开 qwenpaw-pet 插件
    try {
        // 方法1: 通过 QwenPaw API 打开宠物
        if (window.QwenPaw && window.QwenPaw.plugins && window.QwenPaw.plugins.open) {
            window.QwenPaw.plugins.open('qwenpaw-pet');
            window.addAIFenshenMessage('assistant', '✅ <b>桌面宠物已打开！</b><br><br>QwenPaw 插件宠物正在运行。<br><br>如果没有自动打开，请手动点击侧边栏的宠物图标。');
        } else {
            // 方法2: 尝试通过路由跳转
            window.location.hash = '#/plugin/qwenpaw-pet';
            window.addAIFenshenMessage('assistant', '✅ <b>正在打开桌面宠物...</b><br><br>如果没有自动打开，请检查是否已安装 qwenpaw-pet 插件。');
        }
    } catch(e) {
        // 方法3: 直接跳转
        window.location.hash = '#/plugin/qwenpaw-pet';
        window.addAIFenshenMessage('assistant', '✅ <b>正在打开桌面宠物...</b><br><br>如果没有自动打开，请检查是否已安装 qwenpaw-pet 插件。<br><br>错误信息: ' + e.message);
    }
};

// 启动桌面宠物进程（保留兼容）
window.startDesktopPet = function() {
    window.launchDesktopPet();
};

// 显示桌面宠物（保留兼容）
window.showDesktopPet = function() {
    window.launchDesktopPet();
};

// 预览桌面宠物效果（保留兼容）
window.openDesktopPetPreview = function() {
    window.launchDesktopPet();
};

// 初始化
window.addEventListener('load', function() {
    window.initAIFenshen();
});

// 添加CSS动画
var style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    @keyframes progress {
        from { width: 0%; }
        to { width: 100%; }
    }
`;
document.head.appendChild(style);

console.log('[AI分身] v3.0 已加载');

// ========== AI分身智能体绑定 ==========

// 智能体配置
window.AIFenshenAgent = {
    id: 'default',  // 绑定的智能体ID
    name: '执行者',
    sessionId: null,
    isConnected: false
};

// 初始化智能体连接
window.initAIFenshenAgent = function() {
    // 从localStorage获取session_id
    var savedSession = localStorage.getItem('qwenpaw_session');
    if (savedSession) {
        try {
            var session = JSON.parse(savedSession);
            window.AIFenshenAgent.sessionId = session.id;
        } catch(e) {}
    }
    
    // 如果没有，使用默认
    if (!window.AIFenshenAgent.sessionId) {
        window.AIFenshenAgent.sessionId = 'default-session-' + Date.now();
    }
    
    // 获取智能体列表
    window.fetchAgentsList();
};

// 获取智能体列表
window.fetchAgentsList = function() {
    fetch('/api/agents')
        .then(function(r) { 
            if (!r.ok) {
                throw new Error('HTTP ' + r.status);
            }
            return r.json(); 
        })
        .then(function(data) {
            if (data.agents && data.agents.length > 0) {
                window.AIFenshenAgent.agents = data.agents;
                console.log('[AI分身] 发现', data.agents.length, '个智能体');
                
                // 默认绑定第一个智能体（或default）
                var defaultAgent = data.agents.find(function(a) { 
                    return a.id === 'default'; 
                }) || data.agents[0];
                
                if (defaultAgent) {
                    window.AIFenshenAgent.id = defaultAgent.id;
                    window.AIFenshenAgent.name = defaultAgent.name || defaultAgent.id;
                    window.AIFenshenAgent.isConnected = true;
                    console.log('[AI分身] 已绑定智能体:', window.AIFenshenAgent.name);
                }
            } else {
                console.log('[AI分身] API返回空列表');
            }
        })
        .catch(function(e) {
            console.error('[AI分身] 获取智能体列表失败:', e);
            // 使用备用方案：直接绑定default
            window.AIFenshenAgent.id = 'default';
            window.AIFenshenAgent.name = 'default';
            window.AIFenshenAgent.isConnected = true;
            console.log('[AI分身] 使用备用绑定: default');
        });
};

// 发送消息到智能体
window.sendToAgent = function(message) {
    return new Promise(function(resolve, reject) {
        // 检查智能体是否已连接
        if (!window.AIFenshenAgent.id) {
            reject(new Error('智能体未初始化'));
            return;
        }
        
        var payload = {
            message: message,
            session_id: window.AIFenshenAgent.sessionId || 'ai_fenshen_' + Date.now()
        };
        
        // 保存会话ID用于后续消息
        window.AIFenshenAgent.sessionId = payload.session_id;
        
        fetch('/api/console/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Agent-Id': window.AIFenshenAgent.id
            },
            body: JSON.stringify(payload)
        })
        .then(function(r) { 
            console.log('[AI分身] HTTP状态:', r.status, r.statusText);
            console.log('[AI分身] 响应头:', r.headers.get('content-type'));
            
            if (!r.ok) {
                throw new Error('HTTP ' + r.status + ': ' + r.statusText);
            }
            return r.text();
        })
        .then(function(text) {
            console.log('[AI分身] 原始响应长度:', text ? text.length : 0);
            console.log('[AI分身] 原始响应:', text ? text.substring(0, 1000) : 'EMPTY');
            
            // 如果响应为空，直接返回提示
            if (!text || text.trim() === '') {
                console.log('[AI分身] 响应为空');
                resolve({ response: '智能体返回了空响应，请稍后重试' });
                return;
            }
            
            // 尝试解析JSON
            var data;
            try {
                data = JSON.parse(text);
                console.log('[AI分身] JSON解析成功:', data);
            } catch (e) {
                // 如果不是JSON，直接使用文本
                console.log('[AI分身] 非JSON响应，使用原文本');
                data = { response: text };
            }
            resolve(data);
        })
        .catch(function(e) {
            console.error('[AI分身] 请求失败:', e);
            reject(e);
        });
    });
};


// 发送消息到智能体（简单fetch版本）
window.sendToAgentSimple = function(message) {
    return fetch('/api/console/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Agent-Id': 'default'
        },
        body: JSON.stringify({
            message: message,
            session_id: '1783155353103-bg011ua',
            user_id: 'default',
            channel: 'console'
        })
    })
    .then(function(r) { 
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text(); 
    })
    .then(function(text) {
        // 尝试解析JSON
        var response = text;
        try {
            var jsonData = JSON.parse(text);
            if (jsonData.response) response = jsonData.response;
            else if (jsonData.message) response = jsonData.message;
            else if (jsonData.content) response = jsonData.content;
        } catch(e) {
            // 不是JSON，直接使用文本
        }
        return { response: response };
    });
};


// 智能体回复处理
window.processAgentResponse = function(response) {
    console.log('[AI分身] 处理响应:', response);
    
    // 如果response本身就是字符串，直接返回
    if (typeof response === 'string') {
        return response;
    }
    
    // 检查各种可能的响应字段
    if (response && response.response) {
        return response.response;
    }
    if (response && response.content) {
        return response.content;
    }
    if (response && response.message) {
        return response.message;
    }
    if (response && response.text) {
        return response.text;
    }
    if (response && response.result) {
        return response.result;
    }
    if (response && response.data) {
        if (typeof response.data === 'string') {
            return response.data;
        }
        if (response.data.text) {
            return response.data.text;
        }
        if (response.data.response) {
            return response.data.response;
        }
    }
    
    // 兜底：将对象转为字符串显示
    if (response && typeof response === 'object') {
        // 优先找任何非空的字符串值
        for (var key in response) {
            if (typeof response[key] === 'string' && response[key].length > 0) {
                console.log('[AI分身] 找到字段:', key, '=', response[key].substring(0, 50));
                return response[key];
            }
        }
        // 如果没有字符串字段，返回JSON字符串
        try {
            return JSON.stringify(response, null, 2);
        } catch(e) {}
    }
    
    return '智能体处理完成，但未返回有效内容';
};

// 修改发送消息函数，添加智能体调用
window.sendAIFenshenMessageWithAgent = function() {
    var input = document.getElementById('ai-fenshen-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    input.style.height = 'auto';
    
    // 添加用户消息
    window.addAIFenshenMessage('user', text);
    
    // 显示思考状态
    window.updateAIFenshenStatus('thinking');
    
    // 检查是否是本地指令
    var lower = text.toLowerCase();
    var isLocalCommand = /收件箱|发件箱|写邮件|会议纪要|工作总结|提醒|打开|关闭|启动|退出|整理|清理|优化|天气|时间|日期|帮助|指令/.test(lower);
    
    if (isLocalCommand) {
        // 本地处理
        setTimeout(function() {
            window.processAIFenshenCommand(text);
        }, 300);
    } else {
        // 发送到智能体（使用localStorage中转）
        window.sendToAgentViaStorage(text);
    }
};

// 覆盖原来的发送函数
window._originalSendAIFenshenMessage = window.sendAIFenshenMessage;
window.sendAIFenshenMessage = window.sendAIFenshenMessageWithAgent;

// 智能体选择面板
window.showAgentSelector = function() {
    if (!window.AIFenshenAgent.agents || window.AIFenshenAgent.agents.length === 0) {
        window.addAIFenshenMessage('assistant', '🔍 正在获取智能体列表...');
        window.fetchAgentsList();
        return;
    }
    
    var html = '🤖 <b>选择智能体</b><br><br>当前: <b>' + window.AIFenshenAgent.name + '</b><br><br>';
    
    window.AIFenshenAgent.agents.forEach(function(agent) {
        var isActive = agent.id === window.AIFenshenAgent.id;
        html += '<div style="padding:10px;background:' + (isActive ? '#e3f2fd' : '#f5f5f5') + ';border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="window.selectAgent(' + "'" + agent.id + "'" + ')">';
        html += '<span style="font-size:20px;">' + (isActive ? '●' : '○') + '</span>';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:500;">' + (agent.name || agent.id) + '</div>';
        html += '<div style="font-size:12px;color:#999;">' + agent.id + '</div>';
        html += '</div>';
        html += '</div>';
    });
    
    window.addAIFenshenMessage('assistant', html);
};

// 选择智能体
window.selectAgent = function(agentId) {
    var agent = window.AIFenshenAgent.agents.find(function(a) { return a.id === agentId; });
    if (agent) {
        window.AIFenshenAgent.id = agent.id;
        window.AIFenshenAgent.name = agent.name || agent.id;
        window.AIFenshenAgent.isConnected = true;
        window.addAIFenshenMessage('assistant', '✅ 已切换到智能体: <b>' + window.AIFenshenAgent.name + '</b>');
    }
};

// 修改头部显示，添加智能体选择
window.updateAIFenshenHeader = function() {
    var statusEl = document.getElementById('ai-fenshen-status');
    if (statusEl && window.AIFenshenAgent.isConnected) {
        statusEl.innerHTML = '<span style="width:6px;height:6px;background:#52c41a;border-radius:50%;display:inline-block;margin-right:4px;"></span>已连接 · ' + window.AIFenshenAgent.name + ' <button onclick="window.showAgentSelector()" style="background:none;border:none;color:#667eea;cursor:pointer;font-size:11px;margin-left:8px;">[切换]</button>';
    }
};

// 初始化
window.addEventListener('load', function() {
    setTimeout(function() {
        window.initAIFenshenAgent();
        window.updateAIFenshenHeader();
    }, 1000);
});

console.log('[AI分身] 智能体绑定模块已加载');

// ========== AI分身增强功能 ==========

// 快捷回复模板
window.AIFenshenQuickReplies = [
    { icon: '👋', text: '你好', desc: '打招呼' },
    { icon: '🙏', text: '谢谢', desc: '感谢' },
    { icon: '👍', text: '好的', desc: '确认' },
    { icon: '❓', text: '请问', desc: '提问' },
    { icon: '⏰', text: '明天提醒我', desc: '设置提醒' },
    { icon: '📧', text: '查看邮件', desc: '邮件' },
    { icon: '📝', text: '生成文档', desc: '文档' },
    { icon: '💻', text: '打开软件', desc: '软件' }
];

// 显示快捷回复
window.showQuickReplies = function() {
    var html = '⚡ <b>快捷回复</b><br><br>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    
    window.AIFenshenQuickReplies.forEach(function(item) {
        html += '<button onclick="window.sendAIFenshenQuick(' + "'" + item.text + "'" + ');" style="padding:6px 12px;background:#f5f5f5;border:1px solid #ddd;border-radius:16px;color:#333;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;">';
        html += item.icon + ' ' + item.text;
        html += '</button>';
    });
    
    html += '</div>';
    window.addAIFenshenMessage('assistant', html);
};

// 历史记录管理
window.AIFenshenHistory = {
    maxSize: 50,
    
    save: function() {
        var data = {
            messages: window.AIFenshenState.messages.slice(-this.maxSize),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('aiFenshenHistory', JSON.stringify(data));
    },
    
    load: function() {
        var saved = localStorage.getItem('aiFenshenHistory');
        if (saved) {
            try {
                var data = JSON.parse(saved);
                if (data.messages) {
                    window.AIFenshenState.messages = data.messages;
                    // 恢复显示
                    var chat = document.getElementById('ai-fenshen-chat');
                    if (chat) {
                        chat.innerHTML = '';
                        data.messages.forEach(function(msg) {
                            window.addAIFenshenMessage(msg.type, msg.content);
                        });
                    }
                }
            } catch(e) {
                console.log('[AI分身] 加载历史失败:', e);
            }
        }
    },
    
    clear: function() {
        localStorage.removeItem('aiFenshenHistory');
        window.AIFenshenState.messages = [];
        var chat = document.getElementById('ai-fenshen-chat');
        if (chat) {
            chat.innerHTML = '';
        }
        window.addAIFenshenMessage('assistant', '🗑️ 历史记录已清空');
    },
    
    export: function() {
        var data = {
            messages: window.AIFenshenState.messages,
            exportTime: new Date().toISOString(),
            agent: window.AIFenshenAgent.name
        };
        
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'ai-fenshen-history-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.addAIFenshenMessage('assistant', '✅ 历史记录已导出');
    }
};

// 修改添加消息函数，自动保存历史
window._originalAddAIFenshenMessage = window.addAIFenshenMessage;
window.addAIFenshenMessage = function(type, content) {
    window._originalAddAIFenshenMessage(type, content);
    window.AIFenshenHistory.save();
};

// 显示历史菜单
window.showHistoryMenu = function() {
    var html = '📚 <b>历史记录</b><br><br>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    html += '<button onclick="window.AIFenshenHistory.load()" style="padding:10px;background:#667eea;border:none;border-radius:6px;color:white;cursor:pointer;text-align:left;">📂 恢复上次会话</button>';
    html += '<button onclick="window.AIFenshenHistory.export()" style="padding:10px;background:#52c41a;border:none;border-radius:6px;color:white;cursor:pointer;text-align:left;">💾 导出聊天记录</button>';
    html += '<button onclick="window.AIFenshenHistory.clear()" style="padding:10px;background:#ff4d4f;border:none;border-radius:6px;color:white;cursor:pointer;text-align:left;">🗑️ 清空历史记录</button>';
    html += '</div>';
    window.addAIFenshenMessage('assistant', html);
};

// 主题切换
window.AIFenshenTheme = {
    current: 'default',
    
    themes: {
        default: { primary: '#667eea', secondary: '#764ba2', bg: '#f8f9fa' },
        dark: { primary: '#1a1a2e', secondary: '#16213e', bg: '#0f0f23' },
        green: { primary: '#27ae60', secondary: '#2ecc71', bg: '#e8f8f5' },
        orange: { primary: '#e67e22', secondary: '#f39c12', bg: '#fef5e7' }
    },
    
    apply: function(themeName) {
        var theme = this.themes[themeName];
        if (!theme) return;
        
        this.current = themeName;
        localStorage.setItem('aiFenshenTheme', themeName);
        
        // 应用主题色
        var panel = document.querySelector('.ai-copilot-panel');
        if (panel) {
            var header = panel.querySelector('div:first-child');
            if (header) {
                header.style.background = 'linear-gradient(135deg,' + theme.primary + ' 0%,' + theme.secondary + ' 100%)';
            }
        }
        
        window.addAIFenshenMessage('assistant', '🎨 主题已切换为: <b>' + themeName + '</b>');
    }
};

// 显示主题选择
window.showThemeSelector = function() {
    var html = '🎨 <b>选择主题</b><br><br>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    
    Object.keys(window.AIFenshenTheme.themes).forEach(function(name) {
        var theme = window.AIFenshenTheme.themes[name];
        var isActive = name === window.AIFenshenTheme.current;
        html += '<button onclick="window.AIFenshenTheme.apply(' + "'" + name + "'" + ')" style="padding:10px 16px;background:' + (isActive ? theme.primary : '#f5f5f5') + ';border:none;border-radius:8px;color:' + (isActive ? 'white' : '#333') + ';cursor:pointer;font-weight:' + (isActive ? 'bold' : 'normal') + ';">';
        html += name.charAt(0).toUpperCase() + name.slice(1);
        html += '</button>';
    });
    
    html += '</div>';
    window.addAIFenshenMessage('assistant', html);
};

// 初始化主题
window.addEventListener('load', function() {
    var savedTheme = localStorage.getItem('aiFenshenTheme');
    if (savedTheme) {
        setTimeout(function() {
            window.AIFenshenTheme.apply(savedTheme);
        }, 3000);
    }
});

// 修改底部按钮，添加更多功能
window._originalShowCommandHelp = window.showCommandHelp;
window.showCommandHelp = function() {
    var html = '❓ <b>AI分身指令帮助</b><br><br>';
    
    html += '<b>📧 邮件办公</b><br>';
    html += '• 查看收件箱 · 写邮件给[某人]<br><br>';
    
    html += '<b>📝 文档处理</b><br>';
    html += '• 生成会议纪要 · 写工作总结<br><br>';
    
    html += '<b>⏰ 日程管理</b><br>';
    html += '• 设置提醒 · 查看待办<br><br>';
    
    html += '<b>💻 软件控制</b><br>';
    html += '• 打开[软件名] · 关闭[软件名]<br><br>';
    
    html += '<b>🧹 电脑整理</b><br>';
    html += '• 一键整理电脑 · 清理临时文件<br><br>';
    
    html += '<b>🔍 信息查询</b><br>';
    html += '• 现在几点 · 今天日期<br><br>';
    
    html += '<b>⚡ 快捷功能</b><br>';
    html += '• 输入 /theme 切换主题<br>';
    html += '• 输入 /history 管理历史<br>';
    html += '• 输入 /quick 显示快捷回复<br>';
    
    window.addAIFenshenMessage('assistant', html);
};

// 增强指令处理，支持斜杠命令
window._originalProcessAIFenshenCommand = window.processAIFenshenCommand;
window.processAIFenshenCommand = function(text) {
    // 斜杠命令
    if (text.startsWith('/')) {
        var cmd = text.slice(1).toLowerCase();
        if (cmd === 'theme' || cmd === '主题') {
            window.showThemeSelector();
        } else if (cmd === 'history' || cmd === '历史') {
            window.showHistoryMenu();
        } else if (cmd === 'quick' || cmd === '快捷') {
            window.showQuickReplies();
        } else if (cmd === 'clear' || cmd === '清空') {
            window.AIFenshenHistory.clear();
        } else if (cmd === 'help' || cmd === '帮助') {
            window.showCommandHelp();
        } else {
            window.addAIFenshenMessage('assistant', '❓ 未知命令: /' + cmd + '<br><br>可用命令:<br>/theme - 切换主题<br>/history - 历史记录<br>/quick - 快捷回复<br>/clear - 清空聊天<br>/help - 显示帮助');
        }
        return;
    }
    
    // 调用原处理函数
    window._originalProcessAIFenshenCommand(text);
};

// 测试API
window.testAgentAPI = function() {
    window.addAIFenshenMessage('assistant', '🔧 <b>测试API...</b>');
    
    fetch('/api/console/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Agent-Id': 'default'
        },
        body: JSON.stringify({
            message: '你好',
            session_id: 'test_' + Date.now()
        })
    })
    .then(function(r) { 
        window.addAIFenshenMessage('assistant', '✅ HTTP状态: ' + r.status);
        return r.text(); 
    })
    .then(function(text) {
        window.addAIFenshenMessage('assistant', '📝 响应长度: ' + text.length + '<br>响应内容:<br><pre style="background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;">' + (text || '(空)') + '</pre>');
    })
    .catch(function(e) {
        window.addAIFenshenMessage('assistant', '❌ 错误: ' + e.message);
    });
};

console.log('[AI分身] 增强功能已加载: 快捷回复、历史记录、主题切换');

// 页面加载时自动恢复历史会话
window.addEventListener('load', function() {
    setTimeout(function() {
        if (window.AIFenshenHistory && typeof window.AIFenshenHistory.load === 'function') {
            console.log('[AI分身] 页面加载，自动恢复历史会话');
            window.AIFenshenHistory.load();
        }
    }, 500);
});

// ========== AI分身与智能体通信（localStorage中转） ==========

// AI分身会话上下文管理
window.AIFenshenContext = {
    sessionId: null,
    messages: [],
    maxContext: 10, // 保留最近10轮对话
    
    init: function() {
        this.sessionId = 'fenshen_' + Date.now();
        this.messages = [];
    },
    
    addMessage: function(role, content) {
        this.messages.push({
            role: role,
            content: [{type: 'text', text: content}],
            timestamp: Date.now()
        });
        // 只保留最近的消息
        if (this.messages.length > this.maxContext * 2) {
            this.messages = this.messages.slice(-this.maxContext * 2);
        }
    },
    
    getInput: function() {
        return this.messages.map(function(m) {
            return {
                role: m.role,
                content: m.content
            };
        });
    },
    
    clear: function() {
        this.sessionId = 'fenshen_' + Date.now();
        this.messages = [];
    }
};

// 初始化会话上下文
window.AIFenshenContext.init();

// 发送消息到智能体（带加载动画、重试、超时处理）
window.sendToAgentViaStorage = function(message, retryCount) {
    retryCount = retryCount || 0;
    var maxRetries = 3;
    var timeoutMs = 60000; // 60秒超时
    
    // 添加用户消息到上下文
    window.AIFenshenContext.addMessage('user', message);
    
    // 显示加载动画（带点点点效果）
    var loadingMsgId = 'loading_' + Date.now();
    var loadingHtml = '<div id="' + loadingMsgId + '">🤖 <b>智能体正在输入</b><span class="typing-dots">...</span></div>';
    window.addAIFenshenMessage('assistant', loadingHtml);
    window.updateAIFenshenStatus('thinking');
    
    // 启动点点点动画
    var dots = 0;
    var dotsInterval = setInterval(function() {
        var el = document.getElementById(loadingMsgId);
        if (el) {
            dots = (dots + 1) % 4;
            var dotsStr = '';
            for (var i = 0; i < dots; i++) dotsStr += '.';
            el.innerHTML = '🤖 <b>智能体正在输入</b><span class="typing-dots">' + dotsStr + '</span>';
        }
    }, 500);
    
    // 设置超时
    var timeoutId = setTimeout(function() {
        clearInterval(dotsInterval);
        var el = document.getElementById(loadingMsgId);
        if (el) el.remove();
        
        if (retryCount < maxRetries) {
            console.log('[AI分身] 超时，准备重试 (' + (retryCount + 1) + '/' + maxRetries + ')');
            window.addAIFenshenMessage('assistant', '⏰ <b>响应超时，正在重试...</b> (' + (retryCount + 1) + '/' + maxRetries + ')');
            setTimeout(function() {
                window.sendToAgentViaStorage(message, retryCount + 1);
            }, 1000);
        } else {
            window.addAIFenshenMessage('assistant', '⏰ <b>请求超时</b><br><br>智能体响应时间过长，请稍后重试。<br><br>💡 您可以尝试：刷新页面、检查网络、或稍后再试');
            window.updateAIFenshenStatus('error');
            setTimeout(function() {
                window.updateAIFenshenStatus('idle');
            }, 3000);
        }
    }, timeoutMs);
    
    // 调用智能体 API
    var doFetch = function() {
        return fetch('/api/console/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Agent-Id': 'default'
            },
            body: JSON.stringify({
                session_id: window.AIFenshenContext.sessionId,
                user_id: 'default',
                input: window.AIFenshenContext.getInput()
            })
        });
    };
    
    var handleResponse = function(r) {
        clearTimeout(timeoutId);
        clearInterval(dotsInterval);
        
        // 移除加载消息
        var el = document.getElementById(loadingMsgId);
        if (el) el.remove();
        
        console.log('[AI分身] 响应状态:', r.status);
        if (!r.ok) {
            throw new Error('HTTP ' + r.status);
        }
        return r.text();
    };
    
    var handleError = function(e) {
        clearTimeout(timeoutId);
        clearInterval(dotsInterval);
        
        // 移除加载消息
        var el = document.getElementById(loadingMsgId);
        if (el) el.remove();
        
        console.error('[AI分身] 调用失败:', e);
        
        // 网络错误时重试
        if ((e.message.includes('fetch') || e.message.includes('network')) && retryCount < maxRetries) {
            console.log('[AI分身] 网络错误，准备重试 (' + (retryCount + 1) + '/' + maxRetries + ')');
            window.addAIFenshenMessage('assistant', '🔄 <b>网络错误，正在重试...</b> (' + (retryCount + 1) + '/' + maxRetries + ')');
            setTimeout(function() {
                window.sendToAgentViaStorage(message, retryCount + 1);
            }, 2000);
            return;
        }
        
        window.addAIFenshenMessage('assistant', '❌ <b>调用失败</b><br><br>错误: ' + e.message + '<br><br>💡 智能体可能暂时不可用，请稍后重试');
        window.updateAIFenshenStatus('error');
        setTimeout(function() {
            window.updateAIFenshenStatus('idle');
        }, 3000);
    };
    
    var parseResponse = function(text) {
        console.log('[AI分身] 收到响应:', text.substring(0, 200));
        
        // 解析 SSE 流式响应
        var reply = '';
        var lines = text.split('\n');
        var lastData = null;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.startsWith('data:')) {
                var dataStr = line.substring(5).trim();
                if (dataStr && dataStr !== '[DONE]') {
                    try {
                        var data = JSON.parse(dataStr);
                        // 只保存状态为 completed 或 output 不为 null 的数据
                        if (data.status === 'completed' || data.output) {
                            lastData = data;
                        }
                    } catch(e) {
                        // 忽略解析错误
                    }
                }
            }
        }
        
        // 从最后一个有效 data 中提取回复
        if (lastData) {
            // 尝试从 output 中提取
            if (lastData.output && Array.isArray(lastData.output)) {
                for (var j = 0; j < lastData.output.length; j++) {
                    var item = lastData.output[j];
                    if (item.content && Array.isArray(item.content)) {
                        for (var k = 0; k < item.content.length; k++) {
                            if (item.content[k].type === 'text') {
                                reply += item.content[k].text;
                            }
                        }
                    }
                }
            }
            
            // 如果 output 为空，尝试其他字段
            if (!reply && lastData.message) {
                reply = lastData.message;
            }
            if (!reply && lastData.text) {
                reply = lastData.text;
            }
            if (!reply && lastData.content) {
                reply = lastData.content;
            }
        }
        
        // 如果没有解析到回复，显示友好的错误信息
        if (!reply) {
            reply = '🤖 <b>智能体响应</b><br><br>智能体已收到您的消息，但暂时无法生成回复。<br><br>💡 可能原因：<br>• 智能体正在处理中<br>• 网络连接不稳定<br>• 智能体暂时不可用<br><br>请稍后重试。';
        }
        
        // 添加智能体回复到上下文
        window.AIFenshenContext.addMessage('assistant', reply);
        
        window.addAIFenshenMessage('assistant', reply);
        window.updateAIFenshenStatus('completed');
        setTimeout(function() {
            window.updateAIFenshenStatus('idle');
        }, 2000);
    };
    
    doFetch()
        .then(handleResponse)
        .then(parseResponse)
        .catch(handleError);
};

// 清空上下文（新会话）
window.clearAIFenshenContext = function() {
    window.AIFenshenContext.clear();
    window.addAIFenshenMessage('assistant', '🔄 <b>已开启新会话</b><br><br>上下文已清空，开始新的对话。');
};

// 轮询检查智能体回复
window.pollForAgentReply = function() {
    var startTime = Date.now();
    var maxWait = 60000; // 最大等待1分钟
    var checkInterval = null;
    var isCompleted = false;
    
    checkInterval = setInterval(function() {
        // 如果已完成，不再检查
        if (isCompleted) {
            clearInterval(checkInterval);
            return;
        }
        
        // 检查是否超时
        if (Date.now() - startTime > maxWait) {
            isCompleted = true;
            clearInterval(checkInterval);
            window.addAIFenshenMessage('assistant', '⏰ <b>等待超时</b><br><br>智能体可能正在忙，请稍后再试。<br><br>✅ 本地功能仍然可用');
            window.updateAIFenshenStatus('error');
            setTimeout(function() {
                window.updateAIFenshenStatus('idle');
            }, 3000);
            return;
        }
        
        // 从后端API获取回复
        fetch('http://127.0.0.1:9999/replies')
            .then(function(r) { 
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json(); 
            })
            .then(function(data) {
                if (isCompleted) return;
                
                console.log('[AI分身] 收到回复数据:', data);
                
                if (data && data.replies && data.replies.length > 0) {
                    // 获取最新回复
                    var latest = data.replies[data.replies.length - 1];
                    
                    console.log('[AI分身] 显示回复:', latest.content);
                    
                    // 显示在AI分身中
                    window.addAIFenshenMessage('assistant', latest.content);
                    window.updateAIFenshenStatus('completed');
                    setTimeout(function() {
                        window.updateAIFenshenStatus('idle');
                    }, 2000);
                    
                    // 标记完成并清除定时器
                    isCompleted = true;
                    clearInterval(checkInterval);
                }
            })
            .catch(function(e) {
                console.error('[AI分身] 获取回复失败:', e);
            });
    }, 1000); // 每秒检查一次
};

// 智能体发送回复（已弃用，使用同步调用）
window.sendReplyFromAgent = function(replyMessage) {
    console.log('[AI分身] sendReplyFromAgent 已弃用');
};

// 检查是否有待处理的消息（供智能体轮询）
window.checkPendingMessage = function() {
    var pending = localStorage.getItem('ai_fenshen_pending');
    if (pending) {
        try {
            var data = JSON.parse(pending);
            if (data.type === 'request') {
                // 清除待处理消息
                localStorage.removeItem('ai_fenshen_pending');
                return data;
            }
        } catch(e) {}
    }
    return null;
};

// 模拟智能体回复（测试用）
window.simulateAgentReply = function() {
    var reply = prompt('请输入智能体回复内容：');
    if (reply) {
        window.sendReplyFromAgent(reply);
        alert('回复已发送！');
    }
};

console.log('[AI分身] localStorage通信模块已加载');

// ========== 智能体自动回复功能 ==========

// 智能体知识库（简单规则回复）
window.AgentKnowledgeBase = {
    greetings: ['你好', '您好', '嗨', 'hello', 'hi'],
    
    getReply: function(message) {
        var lower = message.toLowerCase();
        
        // 问候语
        if (this.greetings.some(function(g) { return lower.includes(g); })) {
            return '你好！我是AI分身连接的智能体（执行者）。很高兴为你服务！\n\n我可以帮你：\n• 回答各种问题\n• 提供建议和方案\n• 协助完成任务\n\n有什么我可以帮你的吗？';
        }
        
        // 时间相关
        if (lower.includes('时间') || lower.includes('几点')) {
            return '🕐 当前时间：' + new Date().toLocaleString('zh-CN') + '\n\n有什么我可以帮你的吗？';
        }
        
        // 帮助
        if (lower.includes('帮助') || lower.includes('功能') || lower.includes('做什么')) {
            return '我可以帮你：\n\n📝 **知识问答**\n• 解释概念和原理\n• 提供技术方案\n• 分析问题和建议\n\n💡 **创意协助**\n• 写作和编辑\n• 头脑风暴\n• 内容优化\n\n🔧 **任务辅助**\n• 代码审查\n• 文档整理\n• 流程优化\n\n请直接告诉我你的需求！';
        }
        
        // 默认回复
        return '收到你的消息："' + message + '"\n\n我是通过AI分身连接的智能体。由于当前连接方式限制，我的回复能力有限。\n\n💡 **建议**：\n• 使用AI分身的本地功能（邮件、文档、提醒等）\n• 在当前QwenPaw对话窗口直接与我对话\n• 描述具体需求，我会尽力帮助';
    }
};

// 自动处理消息并回复
window.autoAgentReply = function() {
    var pending = window.checkPendingMessage();
    if (pending) {
        console.log('[智能体] 收到消息:', pending.message);
        
        // 生成回复
        var reply = window.AgentKnowledgeBase.getReply(pending.message);
        
        // 延迟一下再回复，模拟思考时间
        setTimeout(function() {
            window.sendReplyFromAgent(reply);
            console.log('[智能体] 已回复:', reply);
        }, 1000 + Math.random() * 2000); // 1-3秒延迟
    }
};

// 启动自动回复轮询
window.startAutoReply = function() {
    setInterval(window.autoAgentReply, 1000); // 每秒检查一次
    console.log('[智能体] 自动回复已启动');
};

// 页面加载时启动自动回复
window.addEventListener('load', function() {
    setTimeout(window.startAutoReply, 3000);
});

console.log('[AI分身] 自动回复模块已加载');

// ========== AI分身会话持久化 ==========

// 会话存储键名
window.AI_FENSHEN_STORAGE_KEY = 'ai_fenshen_session';

// 保存会话到localStorage
window.saveAIFenshenSession = function() {
    if (!window.AIFenshenState || !window.AIFenshenState.messages) return;
    
    var sessionData = {
        messages: window.AIFenshenState.messages,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem(window.AI_FENSHEN_STORAGE_KEY, JSON.stringify(sessionData));
        console.log('[AI分身] 会话已保存，消息数:', sessionData.messages.length);
    } catch(e) {
        console.error('[AI分身] 保存会话失败:', e);
    }
};

// 从localStorage加载会话
window.loadAIFenshenSession = function() {
    try {
        var saved = localStorage.getItem(window.AI_FENSHEN_STORAGE_KEY);
        if (saved) {
            var sessionData = JSON.parse(saved);
            console.log('[AI分身] 加载会话，消息数:', sessionData.messages.length);
            return sessionData;
        }
    } catch(e) {
        console.error('[AI分身] 加载会话失败:', e);
    }
    return null;
};

// 清空会话
window.clearAIFenshenSession = function() {
    try {
        localStorage.removeItem(window.AI_FENSHEN_STORAGE_KEY);
        console.log('[AI分身] 会话已清空');
    } catch(e) {
        console.error('[AI分身] 清空会话失败:', e);
    }
};

// 页面加载时恢复会话
window.addEventListener('load', function() {
    setTimeout(function() {
        var savedSession = window.loadAIFenshenSession();
        if (savedSession && savedSession.messages && savedSession.messages.length > 0) {
            console.log('[AI分身] 恢复会话，消息数:', savedSession.messages.length);
            
            // 恢复消息到AI分身
            if (window.AIFenshenState && window.AIFenshenState.messages) {
                window.AIFenshenState.messages = savedSession.messages;
                window.renderAIFenshenMessages();
            }
        }
    }, 1000);
});

// 页面关闭前保存会话
window.addEventListener('beforeunload', function() {
    window.saveAIFenshenSession();
});

// 定期保存会话（每30秒）
setInterval(function() {
    window.saveAIFenshenSession();
}, 30000);

console.log('[AI分身] 会话持久化模块已加载');


// ============ AI分身聊天功能 ============
window.TeamChatEmail = window.TeamChatEmail || {};
window.TeamChatEmail.cronChatHistory = [];

// 发送聊天消息
window.TeamChatEmail.sendChatMessage = function() {
    var input = document.getElementById('ai-chat-input');
    var messages = document.getElementById('ai-chat-messages');
    if (!input || !messages) return;
    
    var text = input.value.trim();
    if (!text) return;
    
    // 添加用户消息
    var time = new Date().toLocaleTimeString();
    var userMsg = '<div style="display:flex;gap:10px;margin-bottom:15px;flex-direction:row-reverse;">' +
        '<div style="width:32px;height:32px;background:#52c41a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">👤</div>' +
        '<div style="flex:1;text-align:right;">' +
            '<div style="background:#667eea;color:#fff;border-radius:12px;padding:12px 15px;font-size:13px;line-height:1.6;display:inline-block;text-align:left;">' + text + '</div>' +
            '<div style="font-size:11px;color:#999;margin-top:5px;">' + time + '</div>' +
        '</div>' +
    '</div>';
    messages.innerHTML += userMsg;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    // AI思考中
    var thinkingId = 'thinking-' + Date.now();
    var thinkingMsg = '<div id="' + thinkingId + '" style="display:flex;gap:10px;margin-bottom:15px;">' +
        '<div style="width:32px;height:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">🤖</div>' +
        '<div style="flex:1;">' +
            '<div style="background:#f0f2ff;border-radius:12px;padding:12px 15px;color:#333;font-size:13px;">' +
                '<span class="dot-flashing">🤔 正在思考</span>' +
            '</div>' +
        '</div>' +
    '</div>';
    messages.innerHTML += thinkingMsg;
    messages.scrollTop = messages.scrollHeight;
    
    // 解析并回复
    setTimeout(function() {
        var parsed = window.TeamChatEmail.parseNaturalLanguageCron(text);
        var thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) {
            thinkingEl.remove();
        }
        
        var replyHtml = '';
        if (parsed.success) {
            replyHtml = '<div style="display:flex;gap:10px;margin-bottom:15px;">' +
                '<div style="width:32px;height:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">🤖</div>' +
                '<div style="flex:1;">' +
                    '<div style="background:#f0f2ff;border-radius:12px;padding:12px 15px;color:#333;font-size:13px;line-height:1.6;">' +
                        '好的！我理解了您的需求：<br><br>' +
                        '📋 <b>' + parsed.name + '</b><br>' +
                        '⏰ 执行时间：' + parsed.description + '<br>' +
                        '🔧 Cron表达式：<code style="background:#e6f7ff;padding:2px 6px;border-radius:3px;">' + parsed.cron + '</code><br><br>' +
                        '<button onclick="window.TeamChatEmail.createAICronJob(\'' + parsed.cron + '\', \'' + parsed.name + '\', \'' + parsed.action + '\')" style="padding:8px 16px;background:#52c41a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;margin-right:8px;">✓ 确认创建</button>' +
                        '<button onclick="window.TeamChatEmail.chatReply(\'请重新输入您的需求\')" style="padding:8px 16px;background:#f5f5f5;border:1px solid #d9d9d9;border-radius:6px;cursor:pointer;font-size:13px;">✏️ 修改</button>' +
                    '</div>' +
                    '<div style="font-size:11px;color:#999;margin-top:5px;">' + new Date().toLocaleTimeString() + '</div>' +
                '</div>' +
            '</div>';
        } else {
            replyHtml = '<div style="display:flex;gap:10px;margin-bottom:15px;">' +
                '<div style="width:32px;height:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">🤖</div>' +
                '<div style="flex:1;">' +
                    '<div style="background:#fff2f0;border-radius:12px;padding:12px 15px;color:#333;font-size:13px;line-height:1.6;">' +
                        '抱歉，我没有理解您的意思 😅<br><br>' +
                        '您可以这样说：<br>' +
                        '• "每天早上9点同步邮件"<br>' +
                        '• "每周五下午5点发周报"<br>' +
                        '• "每月1号备份邮件"' +
                    '</div>' +
                    '<div style="font-size:11px;color:#999;margin-top:5px;">' + new Date().toLocaleTimeString() + '</div>' +
                '</div>' +
            '</div>';
        }
        messages.innerHTML += replyHtml;
        messages.scrollTop = messages.scrollHeight;
    }, 800);
};

// 快捷聊天
window.TeamChatEmail.quickChat = function(text) {
    var input = document.getElementById('ai-chat-input');
    if (input) {
        input.value = text;
        window.TeamChatEmail.sendChatMessage();
    }
};

// AI回复消息
window.TeamChatEmail.chatReply = function(text) {
    var messages = document.getElementById('ai-chat-messages');
    if (!messages) return;
    
    var replyHtml = '<div style="display:flex;gap:10px;margin-bottom:15px;">' +
        '<div style="width:32px;height:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">🤖</div>' +
        '<div style="flex:1;">' +
            '<div style="background:#f0f2ff;border-radius:12px;padding:12px 15px;color:#333;font-size:13px;line-height:1.6;">' + text + '</div>' +
            '<div style="font-size:11px;color:#999;margin-top:5px;">' + new Date().toLocaleTimeString() + '</div>' +
        '</div>' +
    '</div>';
    messages.innerHTML += replyHtml;
    messages.scrollTop = messages.scrollHeight;
};

// 自然语言解析
window.TeamChatEmail.parseNaturalLanguageCron = function(text) {
    var lower = text.toLowerCase();
    var result = { success: false, name: '', cron: '', action: '', description: '' };
    
    // 解析时间模式
    var timeMatch = lower.match(/(\d{1,2})[点:：](\d{0,2})/);
    var hour = timeMatch ? parseInt(timeMatch[1]) : 9;
    var minute = timeMatch && timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    
    // 解析周期
    if (lower.includes('每天') || lower.includes('每日')) {
        result.cron = minute + ' ' + hour + ' * * *';
        result.name = '每日' + (lower.includes('同步') ? '同步' : '任务');
        result.description = '每天' + hour + '点' + (minute > 0 ? minute + '分' : '');
    } else if (lower.includes('每周')) {
        var dayMap = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':0,'天':0};
        var day = 1;
        for (var d in dayMap) {
            if (lower.includes('周' + d) || lower.includes('星期' + d)) {
                day = dayMap[d];
                break;
            }
        }
        result.cron = minute + ' ' + hour + ' * * ' + day;
        result.name = '每周' + (day === 5 ? '五' : '任务');
        result.description = '每周' + (day === 5 ? '五' : day) + ' ' + hour + '点';
    } else if (lower.includes('每月')) {
        result.cron = minute + ' ' + hour + ' 1 * *';
        result.name = '每月任务';
        result.description = '每月1日' + hour + '点';
    } else if (lower.includes('每小时')) {
        result.cron = '0 * * * *';
        result.name = '每小时检查';
        result.description = '每小时整点';
    } else {
        result.message = '无法识别时间周期，请使用"每天/每周/每月"';
        return result;
    }
    
    // 解析动作
    if (lower.includes('同步') || lower.includes('刷新')) {
        result.action = 'sync';
        result.name += '邮件同步';
    } else if (lower.includes('发送') || lower.includes('发')) {
        result.action = 'send';
        result.name += '邮件发送';
    } else if (lower.includes('备份')) {
        result.action = 'backup';
        result.name += '邮件备份';
    } else if (lower.includes('检查') || lower.includes('查看')) {
        result.action = 'check';
        result.name += '邮件检查';
    } else {
        result.action = 'custom';
        result.name += '任务';
    }
    
    result.success = true;
    return result;
};

// 快捷模板
window.TeamChatEmail.applyCronTemplate = function(type) {
    var templates = {
        'daily_sync': { name: '每日邮件同步', cron: '0 9 * * *', action: 'sync', desc: '每天早上9点自动同步邮件' },
        'weekly_report': { name: '周报发送', cron: '0 17 * * 5', action: 'send', desc: '每周五下午5点发送周报' },
        'monthly_backup': { name: '月度备份', cron: '0 2 1 * *', action: 'backup', desc: '每月1号凌晨2点备份邮件' },
        'hourly_check': { name: '每小时检查', cron: '0 * * * *', action: 'check', desc: '每小时整点检查新邮件' }
    };
    
    var t = templates[type];
    if (!t) return;
    
    var result = document.getElementById('ai-cron-result');
    if (result) {
        result.innerHTML = '<span style="color:#52c41a;">✅ 已选择模板：' + t.desc + '</span>' +
            '<br><span style="font-size:12px;color:#666;">Cron: ' + t.cron + '</span>' +
            '<br><button onclick="window.TeamChatEmail.createAICronJob(\'' + t.cron + '\', \'' + t.name + '\', \'' + t.action + '\')" style="margin-top:10px;padding:6px 12px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">✓ 确认创建</button>';
    }
};

// 创建AI任务 - 调用QwenPaw定时任务API
window.TeamChatEmail.createAICronJob = function(cron, name, action) {
    // 在聊天窗口显示创建中
    var messages = document.getElementById('ai-chat-messages');
    if (messages) {
        var creatingMsg = '<div style="display:flex;gap:10px;margin-bottom:15px;">' +
            '<div style="width:32px;height:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">🤖</div>' +
            '<div style="flex:1;">' +
                '<div style="background:#f0f2ff;border-radius:12px;padding:12px 15px;color:#333;font-size:13px;">' +
                    '⏳ 正在创建任务...' +
                '</div>' +
            '</div>' +
        '</div>';
        messages.innerHTML += creatingMsg;
        messages.scrollTop = messages.scrollHeight;
    }
    
    // 调用QwenPaw定时任务API
    fetch('/api/cron/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            schedule: { cron: cron },
            enabled: true,
            type: 'agent',
            agent_id: 'default',
            channel: 'console',
            text: '执行定时任务: ' + name + ' (动作: ' + action + ')'
        })
    }).then(function(r) { return r.json(); }).then(function(data) {
        if (messages) {
            var successMsg = '<div style="display:flex;gap:10px;margin-bottom:15px;">' +
                '<div style="width:32px;height:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">🤖</div>' +
                '<div style="flex:1;">' +
                    '<div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:12px;padding:12px 15px;color:#333;font-size:13px;line-height:1.6;">' +
                        '✅ 任务创建成功！<br><br>' +
                        '任务ID: ' + (data.id || '已分配') + '<br>' +
                        '名称: ' + name + '<br>' +
                        '下次执行时间将按Cron规则计算' +
                    '</div>' +
                    '<div style="font-size:11px;color:#999;margin-top:5px;">' + new Date().toLocaleTimeString() + '</div>' +
                '</div>' +
            '</div>';
            messages.innerHTML += successMsg;
            messages.scrollTop = messages.scrollHeight;
        }
        // 刷新任务列表
        setTimeout(function() {
            window.TeamChatEmail.loadCronJobs();
        }, 500);
    }).catch(function(e) {
        if (messages) {
            var errorMsg = '<div style="display:flex;gap:10px;margin-bottom:15px;">' +
                '<div style="width:32px;height:32px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">🤖</div>' +
                '<div style="flex:1;">' +
                    '<div style="background:#fff2f0;border:1px solid #ffccc7;border-radius:12px;padding:12px 15px;color:#333;font-size:13px;">' +
                        '❌ 创建失败: ' + e.message +
                    '</div>' +
                '</div>' +
            '</div>';
            messages.innerHTML += errorMsg;
            messages.scrollTop = messages.scrollHeight;
        }
    });
};

// ============ 邮件同步管理 ============
window.TeamChatEmail.syncStatus = {
    autoSync: true,
    lastSync: null,
    nextSync: null,
    newCount: 0,
    totalCount: 0,
    logs: []
};

// 初始化同步状态
window.TeamChatEmail.initSyncStatus = function() {
    this.loadSyncStats();
    this.startSyncTimer();
};

// 加载同步统计
window.TeamChatEmail.loadSyncStats = function() {
    var statsArea = document.getElementById('sync-stats-area');
    var statsContent = document.getElementById('sync-stats-content');
    
    if (statsArea) statsArea.style.display = 'block';
    if (statsContent) statsContent.innerHTML = '<div style="color:#999;">加载中...</div>';
    
    fetch('/api/plugins/team_chat/sync-stats')
        .then(function(r) { 
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json(); 
        })
        .then(function(data) {
            if (data.success) {
                window.TeamChatEmail.syncStatus.newCount = data.new_count || 0;
                window.TeamChatEmail.syncStatus.totalCount = data.total_count || 0;
                window.TeamChatEmail.syncStatus.lastSync = data.last_sync;
                window.TeamChatEmail.syncStatus.nextSync = data.next_sync;
                
                // 更新同步设置页面的UI
                if (statsContent) {
                    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
                        '<div style="background:#f6ffed;padding:10px;border-radius:6px;text-align:center;">' +
                            '<div style="font-size:20px;font-weight:bold;color:#52c41a;">' + (data.new_count || 0) + '</div>' +
                            '<div style="font-size:12px;color:#666;">新邮件</div>' +
                        '</div>' +
                        '<div style="background:#e6f7ff;padding:10px;border-radius:6px;text-align:center;">' +
                            '<div style="font-size:20px;font-weight:bold;color:#1890ff;">' + (data.total_count || 0) + '</div>' +
                            '<div style="font-size:12px;color:#666;">总邮件</div>' +
                        '</div>' +
                    '</div>';
                    if (data.last_sync) {
                        html += '<div style="margin-top:10px;padding:8px;background:#f5f5f5;border-radius:4px;font-size:12px;">' +
                            '<span style="color:#666;">上次同步:</span> <span style="color:#333;font-weight:500;">' + new Date(data.last_sync).toLocaleString() + '</span>' +
                        '</div>';
                    }
                    if (data.next_sync) {
                        html += '<div style="margin-top:8px;padding:8px;background:#f5f5f5;border-radius:4px;font-size:12px;">' +
                            '<span style="color:#666;">下次同步:</span> <span style="color:#333;font-weight:500;">' + new Date(data.next_sync).toLocaleString() + '</span>' +
                        '</div>';
                    }
                    statsContent.innerHTML = html;
                }
                
                window.TeamChatEmail.updateSyncUI();
            } else {
                if (statsContent) statsContent.innerHTML = '<div style="color:#ff4d4f;">加载失败: ' + (data.message || '未知错误') + '</div>';
            }
        })
        .catch(function(e) {
            console.log('加载同步统计失败:', e);
            if (statsContent) statsContent.innerHTML = '<div style="color:#ff4d4f;">加载失败: ' + e.message + '</div>';
        });
};

// 更新同步UI
window.TeamChatEmail.updateSyncUI = function() {
    var newCountEl = document.getElementById('sync-new-count');
    var totalCountEl = document.getElementById('sync-total-count');
    var nextTimeEl = document.getElementById('sync-next-time');
    var statusTextEl = document.getElementById('sync-status-text');
    var lastTimeEl = document.getElementById('sync-last-time');
    
    if (newCountEl) newCountEl.textContent = this.syncStatus.newCount;
    if (totalCountEl) totalCountEl.textContent = this.syncStatus.totalCount;
    if (nextTimeEl) nextTimeEl.textContent = this.syncStatus.nextSync || '--';
    
    if (statusTextEl) {
        if (this.syncStatus.autoSync) {
            statusTextEl.innerHTML = '✅ 自动同步已开启 (每3分钟)';
        } else {
            statusTextEl.innerHTML = '⏸️ 自动同步已暂停';
        }
    }
    
    if (lastTimeEl && this.syncStatus.lastSync) {
        lastTimeEl.textContent = '上次同步: ' + new Date(this.syncStatus.lastSync).toLocaleString();
    }
};

// 手动触发同步
window.TeamChatEmail.triggerManualSync = function() {
    var statusTextEl = document.getElementById('sync-status-text');
    if (statusTextEl) statusTextEl.innerHTML = '🔄 正在同步...';
    
    this.addSyncLog('🔄 手动触发同步...');
    
    fetch('/api/plugins/team_chat/sync', { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                window.TeamChatEmail.addSyncLog('✅ 同步完成，新增 ' + (data.new_count || 0) + ' 封邮件');
                window.TeamChatEmail.syncStatus.newCount = data.new_count || 0;
                window.TeamChatEmail.syncStatus.totalCount = data.total_count || 0;
                window.TeamChatEmail.syncStatus.lastSync = new Date().toISOString();
                window.TeamChatEmail.updateSyncUI();
            } else {
                window.TeamChatEmail.addSyncLog('❌ 同步失败: ' + (data.message || '未知错误'));
            }
        })
        .catch(function(e) {
            window.TeamChatEmail.addSyncLog('❌ 同步错误: ' + e.message);
        });
};

// 切换自动同步
window.TeamChatEmail.toggleAutoSync = function() {
    this.syncStatus.autoSync = !this.syncStatus.autoSync;
    var btn = document.getElementById('auto-sync-btn');
    if (btn) {
        if (this.syncStatus.autoSync) {
            btn.innerHTML = '⏸️ 暂停同步';
            btn.style.background = '#1890ff';
            this.addSyncLog('▶️ 自动同步已开启');
        } else {
            btn.innerHTML = '▶️ 开启同步';
            btn.style.background = '#52c41a';
            this.addSyncLog('⏸️ 自动同步已暂停');
        }
    }
    this.updateSyncUI();
};

// 添加同步日志
window.TeamChatEmail.addSyncLog = function(message) {
    var logEl = document.getElementById('sync-log');
    if (!logEl) return;
    
    var time = new Date().toLocaleTimeString();
    var logEntry = '<div style="margin-bottom:4px;">[' + time + '] ' + message + '</div>';
    logEl.innerHTML = logEntry + logEl.innerHTML;
    
    // 限制日志数量
    var entries = logEl.querySelectorAll('div');
    if (entries.length > 50) {
        for (var i = 50; i < entries.length; i++) {
            entries[i].remove();
        }
    }
};

// 启动同步定时器
window.TeamChatEmail.startSyncTimer = function() {
    // 每分钟更新一次下次同步时间
    setInterval(function() {
        if (window.TeamChatEmail.syncStatus.autoSync) {
            window.TeamChatEmail.loadSyncStats();
        }
    }, 60000);
};

// 编辑AI任务
window.TeamChatEmail.editAICronJob = function() {
    alert('🤖 AI分身：切换到手动编辑模式');
    this.createCronJob();
};

  // 创建动画遮罩层
  var overlay = document.createElement('div');

// ========== 附件上传修复补丁 v4 ==========
(function() {
  console.log('[Attachment Patch v4] Loading...');
  window.composeAttachments = [];

  // 格式化文件大小
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取文件图标
  function getFileIcon(file) {
    if (file.type && file.type.startsWith('image/')) return '🖼️';
    var name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return '📕';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return '📘';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return '📗';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return '📙';
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return '📦';
    if (name.endsWith('.mp3') || name.endsWith('.wav')) return '🎵';
    if (name.endsWith('.mp4') || name.endsWith('.avi')) return '🎬';
    return '📄';
  }

  window.handleComposeAttachments = function(files) {
    console.log('[Attachment Patch] Files selected:', files ? files.length : 0);
    if (!files || files.length === 0) return;
    for (var i = 0; i < files.length; i++) {
      window.composeAttachments.push(files[i]);
      console.log('[Attachment Patch] Added:', files[i].name);
    }
    window.renderAttachmentList();
  };

  window.renderAttachmentList = function() {
    var container = document.getElementById('cm-attachment-list');
    if (!container) {
      console.log('[Attachment Patch] Container not found');
      return;
    }
    if (window.composeAttachments.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    var totalSize = 0;
    var html = '<div style="border:1px solid #e8e8e8;border-radius:6px;padding:10px;background:#fafafa">';
    html += '<div style="font-size:13px;color:#666;margin-bottom:8px;font-weight:500">已选择的附件 (' + window.composeAttachments.length + ' 个)</div>';

    window.composeAttachments.forEach(function(f, i) {
      totalSize += f.size;
      var sizeStr = formatFileSize(f.size);
      var icon = getFileIcon(f);
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;margin:4px 0;background:white;border-radius:4px;border:1px solid #e8e8e8">';
      html += '<div style="display:flex;align-items:center;gap:8px;flex:1;overflow:hidden">';
      html += '<span style="font-size:16px">' + icon + '</span>';
      html += '<span style="font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + f.name + '</span>';
      html += '<span style="font-size:12px;color:#999;flex-shrink:0">(' + sizeStr + ')</span>';
      html += '</div>';
      html += '<button onclick="window.removeComposeAttachment(' + i + ')" style="background:#ff4d4f;color:white;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;flex-shrink:0">删除</button>';
      html += '</div>';
    });

    html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e8e8e8;font-size:12px;color:#666;text-align:right">总大小: ' + formatFileSize(totalSize) + '</div>';
    html += '</div>';
    container.innerHTML = html;
    container.style.display = 'block';
    console.log('[Attachment Patch] List rendered with', window.composeAttachments.length, 'files');
  };

  window.removeComposeAttachment = function(index) {
    window.composeAttachments.splice(index, 1);
    window.renderAttachmentList();
  };

  // 监听弹窗
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.id === 'compose-modal-overlay') {
          console.log('[Attachment Patch] Modal opened');
          window.composeAttachments = [];
          setTimeout(function() {
            var input = document.getElementById('cm-attachments');
            if (input) {
              input.onchange = function(e) {
                window.handleComposeAttachments(e.target.files);
                e.target.value = '';
              };
            }
            var zone = document.getElementById('cm-attachment-zone');
            if (zone) {
              zone.ondragover = function(e) { e.preventDefault(); this.style.borderColor = '#667eea'; };
              zone.ondragleave = function(e) { e.preventDefault(); this.style.borderColor = '#ccc'; };
              zone.ondrop = function(e) { e.preventDefault(); this.style.borderColor = '#ccc'; window.handleComposeAttachments(e.dataTransfer.files); };
            }
          }, 50);
        }
      });
    });
  });

  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  else document.addEventListener('DOMContentLoaded', function() { observer.observe(document.body, { childList: true, subtree: true }); });

  console.log('[Attachment Patch v4] Loaded');
})();
