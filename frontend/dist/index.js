/**
 * ===================================================================
 *  TeamChat Frontend v4.1.0 — 重大更新
 *  【串串频道 v2.0】ChuanChuanPage: 4-Tab统一页面
 *    📡频道 | 📂历史 | ✍️原创作者AI | 📤导出
 *  【轻音乐增强】音量 Slider + 内部停止按钮 + ▶ 正在播放指示
 *  【config 路径修复】串串频道重启后状态持久化
 *  【稻盛和夫 + 有巢哲学】工作原理末行展示
 * ===================================================================
 */
(function () {
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
    "@keyframes tcMainDrone{0%{left:-40px}100%{left:150px}}";
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
  async function apiGet(p) {
    var r = await fetch(getApiUrl("/team-chat"+p), {headers:apiHeaders()});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  async function apiPost(p, b) {
    var r = await fetch(getApiUrl("/team-chat"+p), {method:"POST",headers:apiHeaders(),body:JSON.stringify(b)});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  var _abortRef = null; // IIFE 级桥接，组件内赋值为 useRef
  function apiPostAbort(p, b) {
    var ctrl = new AbortController();
    if (_abortRef) _abortRef.current = ctrl;
    return fetch(getApiUrl("/team-chat"+p), {method:"POST",headers:apiHeaders(),body:JSON.stringify(b),signal:ctrl.signal}).then(function(r){
      if(!r.ok) throw new Error("HTTP "+r.status);
      return r.json();
    });
  }
  async function apiPut(p, b) {
    var r = await fetch(getApiUrl("/team-chat"+p), {method:"PUT",headers:apiHeaders(),body:JSON.stringify(b)});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  async function apiDelete(p) {
    var r = await fetch(getApiUrl("/team-chat"+p), {method:"DELETE",headers:apiHeaders()});
    if (!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }

  // ---- LLM 配置 API ----
  async function loadLlmConfig() {
    setLlmLoading(true);
    try {
      var r = await fetch(getApiUrl("/team-chat/llm-config"), {headers:apiHeaders()});
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
      var r = await fetch(getApiUrl("/team-chat/llm-config"), {
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
      var r = await fetch(getApiUrl("/team-chat/llm-config/test"), {
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
    else if (m.role==="host") { color="#4E342E"; bg="#FFF8E1"; label="🎤 "+(m.sender_name||"主持人"); }
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
      var url = QP.host.getApiUrl("/team-chat/download/"+encodeURIComponent(fname));
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
          e(Button,{size:"small",type:"primary",danger:true,onClick:(function(self){return function(){self.setState({hasError:false,error:null});};})(this)},"🔄 重试")
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
      setAllAgents(d.agents||[]);
    }).catch(function(err){
      console.error("[AllAgents] fetch error:", err);
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
        
        fetch(getApiUrl("/team-chat/generate-report"),{
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
        
        fetch(getApiUrl("/team-chat/generate-realtime-report"),{
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
    fetch(getApiUrl("/team-chat/browser/status")).then(function(r){return r.json();}).then(function(d){setChuanReady(d&&d.running);}).catch(function(){setChuanReady(false);});
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
    apiGet("/team-chat/sessions").then(function(r){
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

    fetch(getApiUrl("/team-chat/export-session"), {
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
    fetch(getApiUrl("/team-chat/remote-chat"),{method:"POST",headers:apiHeaders(),body:JSON.stringify({message:msg,session_id:chatSi}),signal:ctrl.signal})
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
    {key:"channel", label:"📡 频道"},
    {key:"history", label:"📂 历史 "+(sess.length>50?"(50/"+sess.length+")":"("+sess.length+")")},
    {key:"author", label:"✍️ 原创作者AI"},
    {key:"settings", label:"📊 串串汇"}
  ];

  return e("div",{style:{display:"flex",flexDirection:"column",height:"100vh",background:"linear-gradient(180deg,#FDF8F0,#F5EBE0,#EDE0D4)",fontFamily:"inherit"}},
    // 顶栏
    e("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:"linear-gradient(135deg,#5D4037,#6D4C41,#8D6E63)",color:"#FFF8E1",boxShadow:"0 4px 20px rgba(93,64,55,.2)"}},
      e("div",{style:{display:"flex",alignItems:"center",gap:12}},
        e(Button,{type:"text",onClick:function(){chatStop();onBack();},style:{color:"#FFF8E1",fontSize:20}},"← 返回"),
        e("div",{style:{fontSize:20,fontWeight:"bold"}},"📡 串串频道")
      )
    ),
    // Tab 栏
    e("div",{style:{display:"flex",background:"#EDE0D4",borderBottom:"2px solid #D7CCC8",flexShrink:0}},
      TABS.map(function(t){
        var active = tab===t.key;
        return e("div",{key:t.key,onClick:function(){setTab(t.key);},
          style:{flex:1,textAlign:"center",padding:"10px 0",cursor:"pointer",fontSize:13,fontWeight:active?"bold":"normal",
            color:active?"#4E342E":"#8D6E63",
            borderBottom:active?"3px solid #FFD700":"3px solid transparent",
            background:active?"#FDF8F0":"transparent",transition:"all .2s"}},
          t.label
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
        e(Card,{title:"🎹 简谱计算器",style:{borderRadius:16,background:"#EDE7F6",border:"1px solid #B39DDB"}},
          e(MusicEditor,null)
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
                    style:{width:100,fontSize:11},placeholder:"标签",autoFocus:true}),
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
                e("img",{src:getApiUrl("/team-chat/media/qr_code.png"),alt:"收款码",
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
            fetch(getApiUrl("/team-chat/browser/launch"),{method:"POST",headers:{"Content-Type":"application/json"},
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
                e("div",{style:{fontSize:10,color:"#EF6C00",marginTop:2}},"总会话")
              ),
              e(Card,{size:"small",style:{borderRadius:12,background:"#F3E5F5",border:"1px solid #CE93D8",textAlign:"center"}},
                e("div",{style:{fontSize:20,fontWeight:"bold",color:"#6A1B9A"}},agentDetail.stats.brainstorm_count),
                e("div",{style:{fontSize:10,color:"#7B1FA2",marginTop:2}},"头脑风暴")
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
              e("div",{style:{padding:"6px 8px",background:"#F5F5F5",fontWeight:"bold",borderBottom:"1px solid #E0E0E0",textAlign:"center"}},"总消息"),
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
// =================== MusicEditor (v4.1.0) ===================
  function MusicEditor() {
    var _ns = useState("5353531 24325 5353531 24321"), notation = _ns[0], setNotation = _ns[1];
    var _sc = useState("pentatonic"), scale = _sc[0], setScale = _sc[1];
    var _pl = useState(false), playing = _pl[0], setPlaying = _pl[1];
    var _pr = useState(null), preview = _pr[0], setPreview = _pr[1];
    var _ac = useState(false), audioCtx = _ac[0], setAudioCtx = _ac[1];
    var timersRef = useRef([]);

    var P = [0,261.63,293.66,329.63,392.00,440.00,523.25];
    var PD = [0,261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33];

    var PRESETS = [
      {name:"粉刷匠",scale:"pentatonic",raw:"5353531 24325 5353531 24321"},
      {name:"小星星",scale:"diatonic",raw:"1155665 4433221 5544332 5544332 1155665 4433221"},
      {name:"生日歌",scale:"diatonic",raw:"556517 556521 5553176 443121"},
      {name:"茉莉花",scale:"pentatonic",raw:"1111151112 5555555555 4444333333"},
      {name:"欢乐颂",scale:"diatonic",raw:"334554321123322 334554321123211"},
      {name:"自定义",scale:"pentatonic",raw:""}
    ];
    var _pi = useState(0), presetIdx = _pi[0], setPresetIdx = _pi[1];

    function getAudioCtx() {
      if (!audioCtx) {
        var C = window.AudioContext || window.webkitAudioContext;
        var ctx = new C();
        setAudioCtx(ctx);
        return ctx;
      }
      return audioCtx;
    }

    function parseNotation(raw, sc) {
      var T = sc==="pentatonic" ? P : PD;
      var seq = [];
      var lines = raw.split(/\s+/);
      lines.forEach(function(line, li) {
        line.split("").forEach(function(ch, ci) {
          var n = parseInt(ch,10);
          if (isNaN(n) || n<=0 || n>=T.length) return;
          var freq = T[n];
          var isLast = li===lines.length-1 && ci===line.length-1;
          seq.push([freq, isLast?0.35:0.15, isLast?0.35:0.04]);
        });
        if (li<lines.length-1 && seq.length>0) seq[seq.length-1][2] = 0.25;
      });
      return seq;
    }

    function previewNote(num) {
      var T = scale==="pentatonic" ? P : PD;
      if (num<1 || num>=T.length) return;
      var ctx = getAudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = T[num];
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime+0.3);
    }

    function playNotation() {
      if (playing) { stopNotation(); return; }
      var seq = parseNotation(notation, scale);
      if (seq.length===0) return;
      var ctx = getAudioCtx();
      setPlaying(true);
      var t = ctx.currentTime + 0.05;
      timersRef.current = [];
      seq.forEach(function(item) {
        var freq = item[0], dur = item[1], gap = item[2];
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t+0.02);
        gain.gain.setValueAtTime(0.25, t+dur-0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t+dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t+dur+0.01);
        t += dur + gap;
      });
      var totalMs = (t - ctx.currentTime) * 1000;
      var tid = setTimeout(function() { setPlaying(false); }, totalMs + 50);
      timersRef.current.push(tid);
    }

    function stopNotation() {
      timersRef.current.forEach(function(id) { clearTimeout(id); });
      timersRef.current = [];
      setPlaying(false);
    }

    function loadPreset(idx) {
      setPresetIdx(idx);
      if (PRESETS[idx].raw) {
        setNotation(PRESETS[idx].raw);
        setScale(PRESETS[idx].scale);
      }
    }

    useEffect(function() {
      return function() { stopNotation(); };
    }, []);

    var noteCount = (notation.match(/\d/g)||[]).length;
    var T = scale==="pentatonic" ? P : PD;

    return e("div", null,
      // Scale selector
      e("div",{style:{display:"flex",gap:8,marginBottom:12,alignItems:"center"}},
        e("span",{style:{fontSize:12,fontWeight:600,color:"#4A148C"}},"音阶:"),
        e(Select,{value:scale,onChange:function(v){setScale(v);},size:"small",style:{width:110},
          options:[
            {value:"pentatonic",label:"五声音阶 (1-6)"},
            {value:"diatonic",label:"全音阶 (1-9)"}
          ]
        }),
        e("span",{style:{fontSize:11,color:"#999"}},noteCount+" 个音符")
      ),
      // Preset buttons
      e("div",{style:{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}},
        PRESETS.map(function(p,i) {
          return e(Button,{key:i,size:"small",
            type:presetIdx===i?"primary":"default",
            onClick:function(){loadPreset(i);},
            style:{
              borderRadius:12,fontSize:11,
              background:presetIdx===i?"linear-gradient(135deg,#9C27B0,#BA68C8)":"#f5f5f5",
              border:presetIdx===i?"1px solid #9C27B0":"1px solid #d9d9d9",
              color:presetIdx===i?"#fff":"#666"
            }
          },p.name);
        })
      ),
      // Notation input
      e("div",{style:{marginBottom:12}},
        e(TextArea,{
          value:notation,
          onChange:function(ev){setNotation(ev.target.value);setPresetIdx(-1);},
          placeholder:"输入简谱... 例如: 5353531 24325\n数字1-6(五声)或1-9(全音), 空格分组, 非数字自动跳过",
          rows:4,
          style:{
            fontFamily:"'Courier New',monospace",fontSize:14,fontWeight:600,
            letterSpacing:2,borderRadius:16,
            background:"#FAFAFA",border:"1px solid #CE93D8"
          }
        })
      ),
      // Play controls
      e("div",{style:{display:"flex",gap:8,justifyContent:"center",marginBottom:12}},
        e(Button,{
          type:playing?"default":"primary",
          onClick:playNotation,
          disabled:!notation.trim(),
          style:{
            width:120,height:40,borderRadius:20,fontSize:14,fontWeight:700,
            background:playing?"#f5f5f5":"linear-gradient(135deg,#9C27B0,#7B1FA2)",
            border:playing?"1px solid #d9d9d9":"none",
            color:playing?"#666":"#fff",
            boxShadow:playing?"none":"0 4px 12px rgba(156,39,176,.4)"
          }
        },playing?"⏸ 暂停":"▶ 播放"),
        e(Button,{
          onClick:stopNotation,
          disabled:!playing,
          style:{
            width:80,height:40,borderRadius:20,fontSize:14,
            background:"#f5f5f5",border:"1px solid #d9d9d9",color:"#666"
          }
        },"⏹ 停止")
      ),
      // Quick guide
      e("div",{style:{padding:"10px 14px",background:"linear-gradient(135deg,#F3E5F5,#E8EAF6)",borderRadius:8,border:"1px dashed #CE93D8"}},
        e("div",{style:{fontSize:11,color:"#6A1B9A",fontWeight:600,marginBottom:6}},"📖 简谱入门"),
        e("div",{style:{fontSize:11,color:"#7B1FA2",lineHeight:1.8}},
          "• 数字 = 音符 (1=Do, 2=Re, 3=Mi ...)\n"+
          "• 空格 = 分组停顿 (相当于逗号)\n"+
          "• 非数字字符自动忽略 (可写歌词)\n"+
          "• 五声音阶: 1-6 → 中国风/民谣\n"+
          "• 全音阶: 1-9 → 流行/古典"
        )
      )
    );
  }

  // =================== State ===================
  function TeamChatPage() {
    // [v4.2.0] 串串频道内嵌视图: true → ChuanChuanPage, false → TeamChatPage
    var _cv = useState(false), chuanView = _cv[0], setChuanView = _cv[1];
    var _s = useState(""), si = _s[0], setSi = _s[1];
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
      fetch(getApiUrl("/team-chat/channels")).then(function (r) { return r.json(); }).then(function (d) {
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
        fetch(getApiUrl("/team-chat/avatars/human"),{method:"PUT",headers:h,body:JSON.stringify({data_url:dataUrl})}).then(function(r){if(!r.ok){return r.text().then(function(t){throw new Error(t||"HTTP "+r.status);});}return r.json();}).then(function(d){message.success("头像已更新");setHumanAvatarId("custom");setHumanAvatarUrl(d.url||dataUrl);}).catch(function(e){message.error(e.message||"上传失败");}).finally(function(){setAvBusy(false);});
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
      fetch(getApiUrl("/team-chat/system-info")).then(function (r) { return r.json(); }).then(function (d) {
        setSysIp(d.ip||"未知");
      }).catch(function () { setSysIp("获取失败"); });
      var t = setInterval(function () { setClock(new Date().toLocaleString()); }, 1000);
      return function () { clearInterval(t); };
    }, []);

    // 加载已存储的人类头像
    useEffect(function () {
      fetch(getApiUrl("/team-chat/avatars")).then(function(r){return r.json();}).then(function(d){
        var avs = d.avatars||{};
        if (avs.human) { setHumanAvatarId("custom"); setHumanAvatarUrl(avs.human); }
      }).catch(function(){});
    }, []);

    var handleRestoreAvatar = useCallback(function () {
      var h = {}; var t = getApiToken(); if (t) h.Authorization = "Bearer "+t;
      fetch(getApiUrl("/team-chat/avatars/human"),{method:"DELETE",headers:h}).then(function(r){return r.json();}).then(function(d){
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
      var avImgs={};mem.forEach(function(m){if(m.id&&m.id!=="human"){var img=new Image();img.src=getApiUrl("/team-chat/avatar/"+encodeURIComponent(m.id));avImgs[m.id]=img;}});var himg=new Image();himg.src=humanAvatarId==="custom"&&humanAvatarUrl?humanAvatarUrl:humanSvgs[parseInt((humanAvatarId||"default-0").split("-")[1])||0];avImgs["human"]=himg;var fr=0;var anim=true;
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
        fetch(getApiUrl("/team-chat/cron-summary")).then(function (r) {
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
      var avUrl = getApiUrl("/team-chat/avatar/"+encodeURIComponent(a.agent_id));
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
      fetch(getApiUrl("/team-chat/upload"),{method:"POST",body:fd}).then(function (r) {
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
            fetch(getApiUrl("/team-chat/avatar"),{method:"POST",body:fd}).then(function (r) {
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
      var names = Object.keys(SONGS);
      if (songIdx<names.length) {
        var s = SONGS[names[songIdx]];
        return parseNotation(s.raw, s.scale);
      }
      // 自定义
      return parseNotation(custSong||"111111", "diatonic");
    }
    var musicRef = useRef(null);
    var volRf = useRef(function(){ try { return parseFloat(localStorage.getItem("teamchat_music_vol")||"0.5"); } catch(e) { return 0.5; } }());
    useEffect(function(){ volRf.current = musicVol; }, [musicVol]);
    var toggleMusic = useCallback(function () {
      if (musicRef.current) {
        musicRef.current.stopped = true; clearTimeout(musicRef.current.timer); musicRef.current.osc.forEach(function(o){try{o.stop();}catch(e){}}); musicRef.current=null; setMusicOn(false); return;
      }
      setMusicOn(true);
      var ctx = new (window.AudioContext||window.webkitAudioContext)();
      var st = {ctx:ctx,stopped:false,timer:null,idx:0,osc:[]};
      musicRef.current = st;
      var SEQ = getCurrentSEQ();
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
      var url = getApiUrl("/team-chat"+f.download_url);
      fetch(url, {headers: apiHeaders()}).then(function (r) {
        if (!r.ok) throw new Error("HTTP "+r.status);
        return r.blob();
      }).then(function (blob) {
        _saveFile(blob, f.original||f.filename, blob.type||"application/octet-stream");
      }).catch(function (e) { message.error("下载失败: "+e.message); });
    }, []);

    var openReadme = useCallback(function () {
      setReadmeV(true);
      (function(){var u=QP.plugin&&QP.plugin.getMediaUrl?QP.plugin.getMediaUrl("../README.md"):getApiUrl("/team-chat/readme");return fetch(u).then(function(r){return r.text();}).then(function(t){setReadmeC(t);}).catch(function(){setReadmeC("加载 README.md 失败");});})();
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
    if(chuanView) return e(ChuanChuanPage,{onBack:function(){setChuanView(false);}});
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
          e(Text,{strong:true,style:{fontSize:13,background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontWeight:"bold"}},"选择主持人:"),
          e("div",{style:{flex:1,maxWidth:300}},
            agLd?e(Spin,{size:"small"}):e(Select,{value:hid,onChange:chHost,style:{width:"100%"},size:"small",
              options:ags.filter(function(a){return a&&a.agent_id;}).map(function (a) { return {value:a.agent_id,label:(a.is_host?"⭐ ":"")+(a.name||a.agent_id)}; })})
          ),
          e(Switch,{checked:bs,onChange:setBs,size:"small"}), e(Text,{strong:true,style:{fontSize:14,background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontWeight:"bold"}},"🧠 头脑风暴"),
          bs?e(InputNumber,{min:2,max:5,value:rds,onChange:setRds,size:"small",style:{width:45}}):null,
          e(Popover,{content:e("div",{style:{padding:4}},e("div",null,e(Text,{style:{fontSize:11}},"🖥 IP: "),e(Text,{code:true,style:{fontSize:11}},sysIp||"---")),e("div",null,e(Text,{style:{fontSize:11}},"🕐 "+clock))),trigger:"hover"},
            e(Text,{style:{fontSize:16,cursor:"default"}},"🕐")
          ),
          e("a",{href:"https://platform.agentscope.io/plugins/team_chat",target:"_blank",rel:"noopener noreferrer",style:{fontSize:13,fontWeight:"bold",color:"#1890ff",textDecoration:"none",cursor:"pointer"}},"TeamChat 版本更新"),
          // 主界面动画区域（右上角）
          e("div",{style:{position:"relative",width:200,height:100,marginLeft:"auto",background:"linear-gradient(135deg,#E3F2FD,#BBDEFB)",borderRadius:8,border:"1px solid #90CAF9",overflow:"hidden"}},
            // 无人机（上方）
            e("div",{style:{position:"absolute",top:5,width:80,height:40,animation:"tcMainDrone 8s linear infinite",zIndex:2}},
              e("div",{style:{position:"absolute",width:60,height:24,background:"linear-gradient(180deg,#424242,#212121)",borderRadius:3,left:10,top:8}}),
              e("div",{style:{position:"absolute",width:16,height:16,background:"#757575",borderRadius:"50%",left:0,top:4}}),
              e("div",{style:{position:"absolute",width:16,height:16,background:"#757575",borderRadius:"50%",right:0,top:4}}),
              e("div",{style:{position:"absolute",width:40,height:16,background:"#FF5722",borderRadius:2,left:20,top:12,display:"flex",alignItems:"center",justifyContent:"center"}},
                e("span",{style:{fontSize:12,fontWeight:"bold",color:"#FFF",whiteSpace:"nowrap"}},"摇摇舞 886")
              )
            ),
            // 蔬菜货车（下方）
            e("div",{style:{position:"absolute",bottom:5,width:90,height:40,animation:"tcMainTruck 10s linear infinite",zIndex:1}},
              e("div",{style:{position:"absolute",bottom:0,left:0,width:60,height:30,background:"linear-gradient(180deg,#66BB6A,#43A047)",borderRadius:2,border:"1px solid #2E7D32"}}),
              e("div",{style:{position:"absolute",bottom:0,right:0,width:24,height:24,background:"#37474F",borderRadius:"2px 4px 1px 1px"}}),
              e("div",{style:{position:"absolute",bottom:-4,left:12,width:12,height:12,background:"#333",borderRadius:"50%",border:"1px solid #555"}}),
              e("div",{style:{position:"absolute",bottom:-4,right:4,width:12,height:12,background:"#333",borderRadius:"50%",border:"1px solid #555"}}),
              e("div",{style:{position:"absolute",bottom:8,left:4,fontSize:12,fontWeight:900,color:"#FFF",textShadow:"0 0 1px rgba(0,0,0,0.5)"}},"Cshu"),
              e("div",{style:{position:"absolute",bottom:20,left:8,width:8,height:8,background:"#FFB74D",borderRadius:"50%"}}),
              e("div",{style:{position:"absolute",bottom:20,left:20,width:6,height:6,background:"#A5D6A7",borderRadius:"50%"}}),
              e("div",{style:{position:"absolute",bottom:20,left:30,width:8,height:6,background:"#FFCC80",borderRadius:"50%"}})
            ),
            // 高房子（左侧）
            e("div",{style:{position:"absolute",bottom:5,left:5,zIndex:3}},
              e("div",{style:{position:"absolute",bottom:0,left:0,width:20,height:45,background:"linear-gradient(180deg,#FFF9C4,#FFE082)",border:"1px solid #FFB300",borderRadius:"2px 2px 0 0"}}),
              e("div",{style:{position:"absolute",bottom:43,left:-2,width:24,height:6,background:"#D84315",borderRadius:"2px",clipPath:"polygon(0 100%,50% 0,100% 100%)"}}),
              e("div",{style:{position:"absolute",bottom:30,left:6,width:8,height:10,background:"#81D4FA",border:"1px solid #4FC3F7",borderRadius:1}}),
              e("div",{style:{position:"absolute",bottom:15,left:6,width:8,height:10,background:"#81D4FA",border:"1px solid #4FC3F7",borderRadius:1}}),
              e("div",{style:{position:"absolute",bottom:0,left:7,width:6,height:10,background:"#5D4037",borderRadius:"2px 2px 0 0"}})
            ),
            // 矮房子（右侧）
            e("div",{style:{position:"absolute",bottom:5,left:30,zIndex:3}},
              e("div",{style:{position:"absolute",bottom:0,left:0,width:18,height:25,background:"linear-gradient(180deg,#FFCCBC,#FF8A65)",border:"1px solid #E64A19",borderRadius:"2px 2px 0 0"}}),
              e("div",{style:{position:"absolute",bottom:23,left:-1,width:20,height:5,background:"#5D4037",borderRadius:"2px",clipPath:"polygon(0 100%,50% 0,100% 100%)"}}),
              e("div",{style:{position:"absolute",bottom:12,left:5,width:8,height:8,background:"#FFF9C4",border:"1px solid #FFB300",borderRadius:1}}),
              e("div",{style:{position:"absolute",bottom:0,left:5,width:6,height:8,background:"#5D4037",borderRadius:"2px 2px 0 0"}})
            )
          )
        ),
        e("div",{style:{marginBottom:4}},
          agLd?e(Spin,{size:"small",style:{marginLeft:8}}):
          ags.length===0?e(Space,{size:4,style:{marginLeft:8}},
            e(Text,{type:"danger",style:{fontSize:12}},"⚠ 无法加载智能体"),
            e(Button,{size:"small",onClick:function () { setAgLd(true); apiGet("/agents").then(function (d) { setAgs(d.agents||[]); setAgLd(false); }).catch(function () { setAgLd(false); }); }},"🔄 重试")
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
          hist.length===0&&!ld?e(Empty,{description:"选择主持人和参与智能体，开始团队会谈",style:{marginTop:60}}):null,
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
                  Object.keys(SONGS).map(function(name,i){
                    return e(Button,{key:name,size:"small",type:"text",
                      style:{textAlign:"left",fontSize:10,padding:"0 3px",color:songIdx===i?(musicOn?"#C62828":"#1890ff"):"#5D4037",fontWeight:songIdx===i?"bold":"normal",marginBottom:0},
                      onClick:function(ev){ev.stopPropagation();setSongIdx(i);if(musicOn){toggleMusic();setTimeout(function(){toggleMusic();},150);}else{toggleMusic();}}
                    },(songIdx===i&&musicOn?"▶ ":(songIdx===i?"● ":"  "))+name);
                  }),
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
                      style:{textAlign:"left",fontSize:10,padding:"0 3px",color:songIdx>=Object.keys(SONGS).length?(musicOn?"#C62828":"#1890ff"):"#5D4037",fontWeight:songIdx>=Object.keys(SONGS).length?"bold":"normal",flex:musicOn?0:1},
                      onClick:function(ev){ev.stopPropagation();setSongIdx(Object.keys(SONGS).length);}
                    },"✏️ 自定义简谱")
                  ),
                  songIdx>=Object.keys(SONGS).length?e(TextArea,{value:custSong,onChange:function(ev){setCustSong(ev.target.value);try{localStorage.setItem("teamchat_custom_song",ev.target.value);}catch(e){}},
                    placeholder:"粘贴数字简谱，空格分行",autoSize:{minRows:2,maxRows:3},style:{marginTop:4,fontSize:10},onClick:function(ev){ev.stopPropagation();}}):null
                )},
                e(Button,{size:"small",icon:musicOn?"⏹":"🎵",style:{maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",background:"linear-gradient(180deg,#c8a878,#8a6848,#6a4828,#a07848)",border:"1px solid #8B6914",color:"#f5e6d0",fontWeight:"bold",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.2)"}},
                  musicOn?"停止":(songIdx<Object.keys(SONGS).length?Object.keys(SONGS)[songIdx]:"自定义"))
              ),
              e("span",{style:{display:"inline-block",width:"5ch"}}),
              ld?e(Button,{type:"primary",danger:true,onClick:stop,icon:e("span",null,"⏹"),style:{fontWeight:"bold",background:"linear-gradient(180deg,#d88888,#a84848,#882828,#c06060)",border:"1px solid #8a3030",color:"#fce4e4",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.18),0 1px 2px rgba(0,0,0,.2)"}},"停止"):e(Button,{type:"primary",icon:e(antdIcons.SendOutlined||null),onClick:send,disabled:!msg.trim()||tabBlocked,style:{background:"linear-gradient(180deg,#e0c068,#c09030,#906020,#d0a840)",border:"1px solid #8B6914",color:"#fff5e0",fontWeight:"bold",textShadow:"0 1px 0 rgba(0,0,0,.35)",borderRadius:4,boxShadow:"inset 0 1px 0 rgba(255,255,255,.25),0 2px 4px rgba(0,0,0,.25)"}},"发送")
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
        sessLd?e(Spin,{tip:"加载中...",style:{display:"block",textAlign:"center",padding:40}}):
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
        e("div",{style:{marginBottom:12}},
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
            e("img",{src:QP.plugin&&QP.plugin.getMediaUrl?QP.plugin.getMediaUrl("bot.gif"):getApiUrl("/team-chat/media/bot.gif"),style:{width:"100%",borderRadius:6,cursor:"pointer"},
              onError:function(e){e.target.style.display="none";}
            })
          )
        ),

        // G: 支持链接
        e("div",{style:{marginTop:"auto",paddingTop:12,borderTop:"1px solid #D7CCC8",textAlign:"center"}},
          e("a",{href:"https://agent.bh-jk.com",target:"_blank",rel:"noopener noreferrer",style:{textDecoration:"none",display:"block"}},
            e("img",{src:QP.plugin&&QP.plugin.getMediaUrl?QP.plugin.getMediaUrl("0123.jpg"):getApiUrl("/team-chat/media/0123.jpg"),style:{width:"100%",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,0.1)",cursor:"pointer"},
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
            if (pptMsgs.length===0||pptIdx>=pptMsgs.length) return e("div",{style:{color:"#667",fontSize:18}},"加载中...");
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
        shelfTab==="collected"?(shelfLd?e(Spin,{tip:"加载中...",style:{display:"block",textAlign:"center",padding:40}}):
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
        e("div",{style:{maxHeight:"60vh",overflow:"auto",padding:"0 8px",fontFamily:"monospace",fontSize:12,whiteSpace:"pre-wrap",lineHeight:1.6}},readmeC||"加载中...")
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

  QP.registerRoutes("team_chat",[{path:"/plugin/team-chat/meeting",component:TeamChatPage,label:"新会谈",icon:"团",priority:100}]);
})();