/**
 * TeamChat Frontend v4.0.9
 * 修复: QP.plugin.getMediaUrl 渲染崩盘，加安全守卫
 */
(function () {
  var s = document.createElement("style");
  s.textContent = "@keyframes tcIn{from{opacity:0;transform:scale(0.9) rotateX(12deg)}to{opacity:1;transform:scale(1) rotateX(0)}}"+
    "@keyframes tcAdIn{0%{opacity:0;transform:translateY(-60px) scale(0.8)}15%{opacity:1;transform:translateY(0) scale(1)}70%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(10px) scale(0.95)}}"+
    "@keyframes tcAdPulse{0%,100%{box-shadow:0 0 20px rgba(255,152,0,.3)}50%{box-shadow:0 0 40px rgba(255,152,0,.6)}}"+
    ".tc-tab:hover .tc-tab-close{opacity:1 !important}";
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
    return e(Card, {size:"small", style:{marginBottom:14,borderRadius:12,background:bg,border:"none",
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
        return e("div",{style:{padding:16,background:"#FFF5F5",border:"1px solid #F5A0A0",borderRadius:8,textAlign:"center",margin:8,fontFamily:"system-ui, sans-serif"}},
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
  // =================== State ===================
  function TeamChatPage() {
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
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime+0.04);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime+dur-0.04);
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
          e("a",{href:"https://platform.agentscope.io/plugins/team_chat",target:"_blank",rel:"noopener noreferrer",style:{fontSize:13,fontWeight:"bold",color:"#1890ff",textDecoration:"none",cursor:"pointer"}},"TeamChat版本更新")
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
          discSumV&&discDone?e("div",{style:{marginTop:12,padding:12,background:"linear-gradient(135deg,#FFF8E1,#FFF3E0)",borderRadius:8,border:"1px solid #FFD54F",display:"flex",alignItems:"center",justifyContent:"space-between"}},
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
                content:e("div",{style:{padding:"2px 3px"}},
                  Object.keys(SONGS).map(function(name,i){
                    return e(Button,{key:name,size:"small",type:"text",
                      style:{textAlign:"left",fontSize:10,padding:"0 3px",color:songIdx===i?"#1890ff":"#5D4037",fontWeight:songIdx===i?"bold":"normal",marginBottom:0},
                      onClick:function(ev){ev.stopPropagation();setSongIdx(i);if(musicOn){toggleMusic();setTimeout(function(){toggleMusic();},150);}else{toggleMusic();}}
                    },(songIdx===i?"▶ ":"  ")+name);
                  }),
                  e("div",{style:{borderTop:"1px solid #eee",margin:"2px 0"}}),
                  e(Button,{size:"small",type:"text",
                    style:{textAlign:"left",fontSize:10,padding:"0 3px",color:songIdx>=Object.keys(SONGS).length?"#1890ff":"#5D4037",fontWeight:songIdx>=Object.keys(SONGS).length?"bold":"normal"},
                    onClick:function(ev){ev.stopPropagation();setSongIdx(Object.keys(SONGS).length);}
                  },"✏️ 自定义简谱"),
                  songIdx>=Object.keys(SONGS).length?e(TextArea,{value:custSong,onChange:function(ev){setCustSong(ev.target.value);try{localStorage.setItem("teamchat_custom_song",ev.target.value);}catch(e){}},
                    placeholder:"粘贴数字简谱，空格分行",autoSize:{minRows:2,maxRows:3},style:{marginTop:2,fontSize:10},onClick:function(ev){ev.stopPropagation();}}):null
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
              style:{marginBottom:8,borderRadius:8,borderLeft:ip?"3px solid #faad14":undefined,
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
      e("div",{style:{position:"fixed",bottom:sideOpen?12:100,right:12,zIndex:1,width:sideOpen?270:260,height:sideOpen?320:200,transition:"all .35s ease",borderRadius:8,overflow:"hidden",boxShadow:sideOpen?"0 2px 8px rgba(0,0,0,.2)":"0 4px 16px rgba(0,0,0,.35)",background:"rgba(26,26,46,0.65)"}},
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
          e(Button,{size:"small",icon:e(antdIcons.HistoryOutlined||null),block:true,onClick:function(){setSessV(true);loadSess();},
            style:{fontWeight:600,borderRadius:8,background:"linear-gradient(135deg, #5D4037, #8D6E63)",border:"none",color:"#FFFAF5",height:36,boxShadow:"0 2px 6px rgba(93,64,55,.25)"}},
            "📂 历史会谈"+(sess.length>0?" ("+sess.length+")":""))
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
                style:{cursor:"pointer",borderRadius:8,overflow:"hidden",border:humanAvatarId==="default-"+i?"2px solid #5D4037":"2px solid transparent",padding:2,transition:"border .2s"}},
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
            e(Card,{style:{borderRadius:12,border:"1px solid #D7CCC8",marginBottom:12}},
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