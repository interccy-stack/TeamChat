/**
 * TeamChat Frontend v4.0.9
 * 修复: QP.plugin.getMediaUrl 渲染崩盘，加安全守卫
 */
(function () {
  var s = document.createElement("style");
  s.textContent = "@keyframes tcIn{from{opacity:0;transform:scale(0.9) rotateX(12deg)}to{opacity:1;transform:scale(1) rotateX(0)}}";
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
    return e(Card, {size:"small", style:{marginBottom:14,borderRadius:12,background:bg,border:"none",
      marginLeft:m.role==="human"?"auto":0,marginRight:m.role==="human"?0:"auto",maxWidth:"85%"},
      title:e(Space,null,e(Text,{style:{fontSize:11,color:"#8D6E63"}},label+" · "+ts))},
      e("div",{style:{color:color,fontSize:14,whiteSpace:"pre-wrap"}},m.content),
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

  // =================== State ===================
  function TeamChatPage() {
    var _s = useState(""), si = _s[0], setSi = _s[1];
    var _h = useState([]), hist = _h[0], setHist = _h[1];
    var _a = useState([]), ags = _a[0], setAgs = _a[1];
    var _d = useState([]), sel = _d[0], setSel = _d[1];
    var _m = useState(""), msg = _m[0], setMsg = _m[1];
    var _l = useState(false), ld = _l[0], setLd = _l[1];
    var _st = useState([]), stps = _st[0], setStps = _st[1];
    var _ag = useState(true), agLd = _ag[0], setAgLd = _ag[1];
    var _hi = useState("cloud-orchestrator"), hid = _hi[0], setHid = _hi[1];
    var _hn = useState("CloudPaw-Master"), hnm = _hn[0], setHnm = _hn[1];
    var _ss = useState([]), sess = _ss[0], setSess = _ss[1];
    var _sv = useState(false), sessV = _sv[0], setSessV = _sv[1];
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
    var _rm = useState(false), readmeV = _rm[0], setReadmeV = _rm[1];
    var _rc = useState(""), readmeC = _rc[0], setReadmeC = _rc[1];
    // ---- 轻音乐 ----
    var _mu = useState(false), musicOn = _mu[0], setMusicOn = _mu[1];
    var _rp = useState(false), replayV = _rp[0], setReplayV = _rp[1];
    var _ri = useState(0), replayIdx = _ri[0], setReplayIdx = _ri[1];
    var _rpl = useState(false), replayPl = _rpl[0], setReplayPl = _rpl[1];
    var _dl = useState(false), discLd = _dl[0], setDiscLd = _dl[1];
    var _df = useState(false), discDone = _df[0], setDiscDone = _df[1];
    var _cv = useState(false), cardView = _cv[0], setCardView = _cv[1];
    var _ci = useState(0), cardIdx = _ci[0], setCardIdx = _ci[1];
    var themes = [
    {name:"经典",table:"#5D4037",inner:"#795548",border:"#FFD700",bg:"rgba(26,26,46,0.65)",rug:"rgba(139,90,43,0.15)"},
    {name:"海洋",table:"#1e3a5f",inner:"#2e5984",border:"#4fc3f7",bg:"rgba(10,22,40,0.75)",rug:"rgba(30,58,95,0.2)"},
    {name:"森林",table:"#2d4a2d",inner:"#3d6b3d",border:"#7cb342",bg:"rgba(26,47,26,0.7)",rug:"rgba(45,74,45,0.2)"}
  ];
  var histRf = useRef(null), cvRf = useRef(null), fiRf = useRef(null), avRf = useRef(null), aiRf = useRef(""), humAvRf = useRef(null);

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

    useEffect(function () {
      var cancelled = false;
      var ls = ""; try { ls = localStorage.getItem("teamchat_last_session")||""; } catch (e) {}
      if (ls) apiGet("/session/"+encodeURIComponent(ls)).then(function (r) {
        if (cancelled) return;
        setSi(r.session_id); setHist(r.history||[]); setStps(r.host_steps||[]);
        setHid(r.host_id||"cloud-orchestrator"); setHnm(r.host_name||"CloudPaw-Master");
      }).catch(function () {});
      return function () { cancelled = true; };
    }, []);

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

    // =================== Canvas Animation ===================
    useEffect(function () {
      var cv = cvRf.current; if (!cv) return;
      var ctx = cv.getContext("2d"), W = 360, H = 300, cx = W/2, cy = H/2+24, r = 48;
      var mem = [{id:"human",name:"你",color:"#e8f0fe"}];
      if (hid) mem.push({id:hid,name:hnm.slice(0,8),color:"#fff3cd"});
      sel.forEach(function (id) { var ag=ags.find(function(a){return a&&a.agent_id===id;}); mem.push({id:id,name:(ag&&ag.name||id).slice(0,10),color:"#d4edda"}); });
      var avImgs={};mem.forEach(function(m){if(m.id&&m.id!=="human"){var img=new Image();img.src=getApiUrl("/team-chat/avatar/"+encodeURIComponent(m.id));avImgs[m.id]=img;}});var himg=new Image();himg.src=humanAvatarId==="custom"&&humanAvatarUrl?humanAvatarUrl:humanSvgs[parseInt((humanAvatarId||"default-0").split("-")[1])||0];avImgs["human"]=himg;var fr=0;
      function dr() {
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
        ctx.fillStyle="#aaa";ctx.font="bold 10px monospace";ctx.fillText("🏛 团队会客厅",6,30);

        // --- Office desks ---
        // --- Office furniture ---
        // Desks with chairs
        var deskPositions = [
          {x:20,y:50,label:"🪑"},       // 左上椅子
          {x:W-50,y:50,label:"🪑"},      // 右上椅子
          {x:20,y:H-24,label:"🖥"},      // 左下电脑
          {x:W-50,y:H-24,label:"🖥"},    // 右下电脑
          {x:W/2-15,y:H-24,label:"📞"}, // 中间底部电话
        ];
        var bookshelfX = W-30;
        var plants = [
          {x:12,y:95,emoji:"🌿"},        // 左侧绿植
          {x:12,y:130,emoji:"🌵"},       // 左侧仙人掌
        ];
        var wallItems = [
          {x:W/2-22,y:12,emoji:"🕐"},   // 顶部时钟
          {x:W/2+10,y:12,emoji:"📋"},   // 顶部白板
          {x:W-38,y:90,emoji:"🗄"},     // 右侧文件柜
        ];
        deskPositions.forEach(function(dp){
          // Desk surface
          ctx.fillStyle="#8D6E63";
          ctx.fillRect(dp.x,dp.y,28,12);
          // Desk legs
          ctx.fillStyle="#5D4037";
          ctx.fillRect(dp.x+3,dp.y+12,3,6);
          ctx.fillRect(dp.x+22,dp.y+12,3,6);
          // Item
          ctx.font="12px serif";
          ctx.fillText(dp.label,dp.x+7,dp.y+10);
        });
        // Bookshelf
        ctx.fillStyle="#6D4C41";
        ctx.fillRect(bookshelfX,88,18,60);
        ctx.fillStyle="#8D6E63";
        for(var i=0;i<4;i++){ctx.fillRect(bookshelfX+2,92+i*14,14,10);}
        ctx.font="9px serif";
        ["📕","📘","📗","📙"].forEach(function(b,bi){
          ctx.fillText(b,bookshelfX+3,100+bi*14);
        });
        // Plants
        plants.forEach(function(p){
          ctx.font="14px serif";
          ctx.fillText(p.emoji,p.x,p.y);
        });
        // Wall items
        wallItems.forEach(function(w){
          ctx.font="13px serif";
          ctx.fillText(w.emoji,w.x,w.y);
        });
        // Coffee corner
        ctx.font="10px serif";
        ctx.fillText("☕",32,H-52);
        ctx.fillText("🥤",52,H-52);
        // Rug under round table
        var rugColor = th?th.rug:"rgba(139,90,43,0.15)";
        ctx.fillStyle=rugColor;
        ctx.beginPath();
        ctx.ellipse(cx,cy,r+30,r+16,0,0,Math.PI*2);
        ctx.fill();

        // --- Tea room ---
        // Counter
        ctx.fillStyle="#BCAAA4";
        ctx.fillRect(8,170,64,40);
        ctx.fillStyle="#8D6E63";
        ctx.fillRect(8,170,64,6);
        ctx.fillStyle="#8D6E63";ctx.font="10px serif";ctx.fillText("🍵 茶室",14,195);

        // --- Waiters walking between tea room and table ---
        var waiterData=[
          {emoji:"🚶",phase:0, speed:0.004, pauseTea:20, pauseTbl:30},
          {emoji:"🚶‍♀️",phase:60,speed:0.0035,pauseTea:25,pauseTbl:25},
          {emoji:"🤵",phase:120,speed:0.003, pauseTea:15,pauseTbl:35}
        ];
        var teaX=30, teaY=165, tblX=cx, tblY=cy-15, cycleLen=400;
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
          var px = cx+(r+22+bounce)*Math.cos(angle);
          var py = cy+(r+22+bounce)*Math.sin(angle);
          memPos.push({id:m.id,name:m.name,x:px,y:py});
          var aimg=avImgs[m.id];if(aimg&&aimg.complete&&aimg.naturalWidth>0){ctx.globalAlpha=1;ctx.drawImage(aimg,px-10,py-14,20,20);ctx.strokeStyle=bdrColor;ctx.lineWidth=1;ctx.strokeRect(px-10,py-14,20,20);}else{ctx.fillStyle=m.color;ctx.globalAlpha=0.85;ctx.fillRect(px-5,py-3,10,10);ctx.fillStyle=bdrColor;ctx.globalAlpha=1;ctx.beginPath();ctx.arc(px,py-8,5,0,Math.PI*2);ctx.fill();}
          ctx.fillStyle="#fff"; ctx.font="7px monospace";
          var nm = m.name.length>10?m.name.slice(0,9)+".":m.name;
          ctx.fillText(nm,px-nm.length*2.5,py+16);
        });
        cvRf._memPos=memPos;
        fr++; requestAnimationFrame(dr);
      }
      var rid = requestAnimationFrame(dr);
      return function () { cancelAnimationFrame(rid); };
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
        setSess(r.sessions||[]); setSessLd(false);
      }).catch(function () { setSess([]); setSessLd(false); });
    }, [sq]);

    var loadOne = useCallback(function (sid) {
      setSessV(false); setLd(true);
      apiGet("/session/"+sid).then(function (r) {
        setSi(r.session_id); setHist(r.history||[]); setStps(r.host_steps||[]);
        setHid(r.host_id||"cloud-orchestrator"); setHnm(r.host_name||"CloudPaw-Master");
        if (r.agent_ids&&r.agent_ids.length>0) { setSel(r.agent_ids); }
        if (r.host_steps&&r.host_steps.length>0) { setBs(true); setDiscDone(true); }
        setLd(false); try { localStorage.setItem("teamchat_last_session",r.session_id); } catch (e) {}
        message.success("已加载");
      }).catch(function () { setLd(false); message.error("加载失败"); });
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
            fd.append("id", agId);
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

    var send = useCallback(function () {
      var m = msg.trim(); if (!m) { message.warning("请输入消息"); return; }
      if (sel.length===0&&bs) { message.warning("头脑风暴需要至少一个参与智能体"); return; }
      if (uc) m = "[环境上下文] "+uc+"\n\n"+m;
      setLd(true); setMsg("");

      if (bs && rds>1) {
        var all = [];
        function round(ri) {
          if (ri>rds) { setLd(false); setHist(all); setDiscDone(true); try { localStorage.setItem("teamchat_last_session",si||""); } catch (e) {}
            message.success("🧠 完成！共 "+rds+" 轮"); return; }
          setCr(ri); var rm = ri===1?m:"🧠 [第"+ri+"/"+rds+"轮] 基于前面讨论，请深化或提出新观点。";
          if (all.length>0) rm+="\n[前面讨论]\n"+all.slice(-5).map(function (h) { return h.sender_name+": "+h.content.slice(0,150); }).join("\n");
          apiPost("/chat",{message:rm,agent_ids:sel,host_id:hid,session_id:si}).then(function (r) {
            if (!si) { setSi(r.session_id); try { localStorage.setItem("teamchat_last_session",r.session_id); } catch (e) {} }
            all=all.concat(r.history||[]); setHist(all.slice()); setPp(Math.round(ri/rds*100));
            setTimeout(function () { round(ri+1); },800);
          }).catch(function (e) { setLd(false); message.error("第"+ri+"轮: "+e.message); });
        }
        round(1); return;
      }

      apiPost("/chat",{message:m,agent_ids:sel,host_id:hid,session_id:si}).then(function (r) {
        if (!si) { setSi(r.session_id); try { localStorage.setItem("teamchat_last_session",r.session_id); } catch (e) {} }
        setHist(r.history||[]); setStps(r.host_steps||[]); setLd(false); setPp(100); message.success("已发送");
      }).catch(function (e) { setLd(false); message.error(e.message); });
    }, [msg,sel,si,hid,bs,rds,uc]);

    var onKd = useCallback(function (ev) { if (ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();send();} }, [send]);

    // ---- 刷卡器: pullSummary ----
    var pullSummary = useCallback(function () {
      if (!si) { message.warning("无会话"); return; }
      setDiscLd(true);
      apiPost("/session/"+si+"/summarize",{host_id:hid}).then(function (r) {
        setHist(function (p) { return p.concat([{
          role:"host", sender:hid, sender_name:hnm,
          content:"📊 最终汇总\n\n"+r.summary,
          timestamp:Date.now()/1000
        }]); });
        setDiscLd(false); setDiscDone(false);
        message.success("汇总已加载");
      }).catch(function (e) { setDiscLd(false); message.error(e.message); });
    }, [si,hid,hnm]);

    // pentatonic: 1=C 2=D 3=E 4=G 5=A 6=C5
    var P = [0,261.63,293.66,329.63,392.00,440.00,523.25];
    var SEQ = [
      // Line 1
      [1,0.15,0.04],[1,0.15,0.04],[1,0.15,0.06],[1,0.15,0.04],[1,0.15,0.04],[1,0.2,0.12],
      [5,0.25,0.1],[1,0.25,0.1],[2,0.25,0.1],[3,0.28,0.15],
      [4,0.13,0.03],[4,0.13,0.03],[4,0.13,0.03],[4,0.18,0.08],
      [3,0.13,0.03],[3,0.13,0.03],[3,0.13,0.03],[3,0.18,0.08],
      [2,0.15,0.05],[2,0.15,0.08],[1,0.15,0.05],[2,0.22,0.12],
      [5,0.13,0.04],[5,0.13,0.04],[5,0.15,0.05],[4,0.15,0.05],[2,0.22,0.08],[1,0.3,0.4],
      // Line 2
      [5,0.22,0.08],[3,0.22,0.08],[2,0.22,0.08],[1,0.28,0.15],
      [5,0.13,0.04],[5,0.15,0.05],[3,0.18,0.06],[2,0.18,0.06],[1,0.25,0.12],
      [6,0.22,0.06],[5,0.22,0.06],[3,0.22,0.06],[2,0.22,0.06],[1,0.32,0.3],
      [5,0.11,0.03],[5,0.11,0.03],[5,0.11,0.03],[5,0.18,0.12],
      [6,0.18,0.06],[6,0.18,0.08],[5,0.22,0.08],[3,0.22,0.1],[2,0.45,2.0]
    ];
    var musicRef = useRef(null);
    var toggleMusic = useCallback(function () {
      if (musicRef.current) {
        musicRef.current.stopped = true; clearTimeout(musicRef.current.timer); musicRef.current.osc.forEach(function(o){try{o.stop();}catch(e){}}); musicRef.current=null; setMusicOn(false); return;
      }
      setMusicOn(true);
      var ctx = new (window.AudioContext||window.webkitAudioContext)();
      var st = {ctx:ctx,stopped:false,timer:null,idx:0,osc:[]};
      musicRef.current = st;
      function play() {
        if (st.stopped) { if (st.idx>=SEQ.length) { setMusicOn(false); musicRef.current=null; } return; }
        if (st.idx>=SEQ.length) { setMusicOn(false); musicRef.current=null; return; }
        var n = SEQ[st.idx], freq = P[n[0]], dur = n[1], gap = n[2];
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

    // ---- 📼 讨论回顾 ----
    var replayTmr = useRef(null);
    useEffect(function () {
      if (!replayPl || !replayV) return;
      replayTmr.current = setTimeout(function () {
        setReplayIdx(function (i) { if (i >= hist.length-1) { setReplayPl(false); return i; } return i+1; });
      }, 500);
      return function () { clearTimeout(replayTmr.current); };
    }, [replayIdx, replayPl, replayV, hist.length]);

    var startReplay = useCallback(function () {
      if (hist.length===0) { message.warning("无讨论记录"); return; }
      setReplayV(true); setReplayIdx(0); setReplayPl(true);
    }, [hist]);

    var exportMd = useCallback(function () {
      var md = "# 团队讨论回顾\n\n**时间**: " + new Date().toLocaleString() + "\n\n---\n\n";
      hist.forEach(function (m) {
        var nm = m.sender_name || m.sender || "?";
        md += "### " + nm + "  \n" + m.content + "\n\n";
      });
      var blob = new Blob([md], {type: "text/markdown;charset=utf-8"});
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = "discussion_" + (si||"export").slice(0,8) + ".md"; a.click();
      URL.revokeObjectURL(url); message.success("已保存到下载文件夹 — discussion_"+(si||"export").slice(0,8)+".md");
    }, [hist, si]);

    var openReadme = useCallback(function () {
      setReadmeV(true);
      (function(){var u=QP.plugin&&QP.plugin.getMediaUrl?QP.plugin.getMediaUrl("../README.md"):getApiUrl("/team-chat/readme");return fetch(u).then(function(r){return r.text();}).then(function(t){setReadmeC(t);}).catch(function(){setReadmeC("加载 README.md 失败");});})();
    }, []);

    // =================== Layout / Main Render ===================
    return e(ErrorBoundary,{fallbackName:"TeamChat 主页面"},
      e("div",{style:{display:"flex",flexDirection:"row",height:"100%",fontFamily:"system-ui, sans-serif"}},
      e("div",{style:{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}},
      e("div",{style:{padding:"10px 16px",background:"#FDF8F0",borderBottom:"1px solid #D7CCC8",flexShrink:0}},
        e("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},
          e(Text,{strong:true,style:{fontSize:13}},"选择主持人:"),
          e("div",{style:{flex:1,maxWidth:300}},
            agLd?e(Spin,{size:"small"}):e(Select,{value:hid,onChange:chHost,style:{width:"100%"},size:"small",
              options:ags.filter(function(a){return a&&a.agent_id;}).map(function (a) { return {value:a.agent_id,label:(a.is_host?"⭐ ":"")+(a.name||a.agent_id)}; })})
          ),
          e(Switch,{checked:bs,onChange:setBs,size:"small"}), e(Text,{strong:true,style:{fontSize:14}},"🧠 头脑风暴"),
          bs?e(InputNumber,{min:2,max:5,value:rds,onChange:setRds,size:"small",style:{width:45}}):null,
          e(Button,{icon:e(antdIcons.HistoryOutlined||null),size:"middle",onClick:loadSess,style:{fontWeight:"bold",fontSize:14}},"📂 历史会谈"),
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
              showAllAgents?"×":ags.slice(5).length+"位智能体")
          ):null
        ),
      ),
      e("div",{ref:histRf,style:{flex:1,overflow:"auto",padding:"16px 20px",background:"#FFFAF5",position:"relative"},onScroll:onMsgScroll},
        withEB("消息列表", e("div",null,
          hist.length===0&&!ld?e(Empty,{description:"选择主持人和参与智能体，开始团队会谈",style:{marginTop:60}}):null,
          hist.map(function (m, i) { return e(MessageBubble,{key:i,msg:m}); })
        )),
        ld?e("div",{style:{textAlign:"center",padding:12}},
          e(Progress,{percent:pp,status:"active",strokeColor:{"0%":"#ff4d4f","30%":"#faad14","60%":"#1890ff","100%":"#52c41a"},style:{marginBottom:6}}),
          e("div",{style:{fontSize:16}},pp>20?"✨":"",pp>50?"🔥":"",pp>80?"💥":""),
          e(Text,{type:"secondary",style:{fontSize:11}},bs&&cr>0?"🧠 第 "+cr+"/"+rds+" 轮":"处理中...")
        ):null,
        !atBottom&&newBadge>0?e("div",{style:{position:"sticky",bottom:12,textAlign:"center",zIndex:10}},
          e(Button,{type:"primary",shape:"round",size:"small",icon:"↓",onClick:scrollToBottom,
            style:{boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}},"最新消息 ("+newBadge+")")
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
      e("div",{style:{padding:"12px 16px",borderTop:"1px solid #D7CCC8",background:"#FDF8F0",flexShrink:0}},
        e(Space,{direction:"vertical",style:{width:"100%"}},
          e(TextArea,{value:msg,onChange:function (ev) { setMsg(ev.target.value); },onKeyDown:onKd,
            placeholder:"输入消息，AI主持人会协调回复...",autoSize:{minRows:2,maxRows:4},disabled:ld,style:{borderRadius:8}}),
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            e(Space,null,
              e(Text,{type:"secondary",style:{fontSize:11}},"Enter 发送 · Shift+Enter 换行"),
              e(Button,{size:"small",icon:"🎤",danger:list,onClick:startVoice,disabled:ld},list?"聆听中...":"语音"),
              e(Button,{size:"small",icon:"📎",disabled:ld,onClick:function () { if (fiRf.current) fiRf.current.click(); }},"附件"),
              e("input",{ref:fiRf,type:"file",accept:".txt,.md,.json,.py,.js,.html,.css,.xml,.csv,.log,.yaml,.yml",onChange:handleFile,style:{display:"none"}}),
              (bs&&sel.length>0)||stps.length>0?e(Button,{size:"small",
                icon:discLd?"🔄":(ld?"⏳":"✅"),
                disabled:ld||discLd,
                onClick:ld?null:pullSummary,
                style:discLd?{}:ld?{opacity:0.5}:{color:"#1890ff",fontWeight:"bold"}
              },discLd?"加载中...":(ld?"讨论中...":"查看结果")):null,
              stps.length>0?e(Button,{size:"small",icon:"💳",
                onClick:function(){setCardView(true);setCardIdx(0);}
              },"观点"):null,
              e(Button,{size:"small",icon:"📼",onClick:startReplay,disabled:hist.length===0,style:hist.length===0?{opacity:0.4}:{}},"回顾")
            ),
            e("span",null,
              e(Button,{size:"small",icon:musicOn?"🎵":"🔇",onClick:toggleMusic},musicOn?"播放中":"轻音乐"),
              e("span",{style:{display:"inline-block",width:"5ch"}}),
              e(Button,{type:"primary",icon:e(antdIcons.SendOutlined||null),onClick:send,loading:ld,disabled:!msg.trim()},"发送")
            )
          ),
        e("div",{style:{textAlign:"center",marginTop:4}}, e(Text,{type:"secondary",style:{fontSize:10}},"💡 修改建议请联系 0+1+2≠3 Team 115886"))
        )
      ),
      e(Modal,{title:"📂 历史会谈",open:sessV,onCancel:function () { setSessV(false); },footer:null,width:680},
        e("div",{style:{marginBottom:12}},
          e(Input,{placeholder:"搜索内容、标签、主持人...",allowClear:true,
            onChange:function (ev) { setSq(ev.target.value); },
            onPressEnter:function () { apiGet("/sessions?search="+encodeURIComponent(sq)).then(function (r) { setSess(r.sessions||[]); setSessLd(false); }).catch(function () {}); },
            suffix:e(Button,{size:"small",type:"link",onClick:function () { setSessLd(true); apiGet("/sessions?search="+encodeURIComponent(sq)).then(function (r) { setSess(r.sessions||[]); setSessLd(false); }).catch(function () { setSessLd(false); }); }},"🔍")
          })
        ),
        sessLd?e(Spin,{tip:"加载中...",style:{display:"block",textAlign:"center",padding:40}}):
        sess.length===0?e(Empty,{description:sq?"无匹配结果":"暂无历史会谈记录"}):
        e("div",{style:{maxHeight:420,overflow:"auto"}},
          sess.map(function (s) {
            var dt = new Date(s.created_at*1000).toLocaleString();
            var pc = (s.participants||[]).length, ip = s.pinned||false;
            return e(Card,{key:s.session_id,size:"small",hoverable:true,
              style:{marginBottom:8,borderLeft:ip?"3px solid #faad14":undefined},
              onClick:function () { loadOne(s.session_id); }},
              e(Space,{direction:"vertical",size:4,style:{width:"100%"}},
                e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                  e(Text,{strong:true},"📋 "+s.session_id.slice(0,8)+"..."),
                  e(Space,{size:2,onClick:function (ev) { ev.stopPropagation(); }},
                    e(Button,{size:"small",type:"text",title:"标签",onClick:function () {
                      var v = prompt("输入标签:",s.tag||"");
                      if (v!==null) apiPut("/session/"+s.session_id+"/tag",{tag:v}).then(function () { message.success("标签已更新"); setSess([]); setSessLd(true); apiGet("/sessions"+(sq?"?search="+encodeURIComponent(sq):"")).then(function (r) { setSess(r.sessions||[]); setSessLd(false); }).catch(function () { setSessLd(false); }); }).catch(function (e) { message.error(e.message); });
                    }},s.tag?"🏷️ "+s.tag:"🏷️"),
                    e(Button,{size:"small",type:"text",title:ip?"取消置顶":"置顶",onClick:function () {
                      apiPut("/session/"+s.session_id+"/pin",{pinned:!ip}).then(function () {
                        message.success(ip?"已取消置顶":"已置顶");
                        setSessLd(true); apiGet("/sessions"+(sq?"?search="+encodeURIComponent(sq):"")).then(function (r) { setSess(r.sessions||[]); setSessLd(false); }).catch(function () { setSessLd(false); });
                      }).catch(function (e) { message.error(e.message); });
                    }},ip?"📌↓":"📌"),
                    e(Button,{size:"small",type:"text",danger:true,title:"删除",onClick:function () {
                      Modal.confirm({title:"确认删除",content:"删除 '"+s.session_id.slice(0,8)+"' 后不可恢复",okText:"确认删除",okType:"danger",onOk:function () {
                        return apiDelete("/session/"+s.session_id).then(function () {
                          message.success("已删除"); setSess(function (p) { return p.filter(function (x) { return x.session_id!==s.session_id; }); });
                        }).catch(function (e) { message.error(e.message); });
                      }});
                    }},"🗑️")
                  )
                ),
                e("div",null,
                  e(Tag,{color:"gold"},"🎤 "+(s.host_name||s.host_id||"?")),
                  e(Text,{type:"secondary",style:{fontSize:12,marginLeft:8}},pc+" 参与者 · "+s.message_count+" 条")
                ),
                e(Text,{type:"secondary",style:{fontSize:11}},dt)
              )
            );
          })
        )
      )),
      e("div",{style:{width:280,minWidth:280,borderLeft:"1px solid #D7CCC8",padding:"16px",background:"#FDF8F0",flexShrink:0,display:"flex",flexDirection:"column",overflowY:"auto",minHeight:"100%"}},

        // A: 人类身份
        e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:14,fontWeight:"bold",marginBottom:8,color:"#5D4037"}},"👤 人类身份"),
          e("input",{ref:humAvRf,type:"file",accept:"image/*",onChange:handleUploadAvatar,style:{display:"none"}}),
          e("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:10}},
            e("div",{style:{width:56,height:56,borderRadius:"50%",overflow:"hidden",border:"2px solid #D7CCC8",background:"#D7CCC8"}},
              humanAvatarId==="custom"&&humanAvatarUrl?e("img",{src:humanAvatarUrl,style:{width:"100%",height:"100%",objectFit:"cover"}})
              :e("img",{src:humanSvgs[parseInt((humanAvatarId||"default-0").split("-")[1])||0],style:{width:"100%",height:"100%",objectFit:"cover"}})
            ),
            e("div",{style:{display:"flex",flexDirection:"column",gap:4}},
              e(Button,{size:"small",onClick:function(){if(humAvRf.current)humAvRf.current.click();}},"📷 上传头像"),
              e(Button,{size:"small",onClick:handleRestoreAvatar,disabled:humanAvatarId==="default-0"},"↩ 恢复默认")
            )
          ),
          e("div",{style:{marginBottom:10}},
            e(Text,{type:"secondary",style:{fontSize:11,marginBottom:4,display:"block"}},"预设头像："),
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
          e(TextArea,{value:uc,onChange:function(ev){setUc(ev.target.value)},placeholder:"我是谁？想让AI知道的信息...",autoSize:{minRows:4,maxRows:10},style:{fontSize:12,borderRadius:6,resize:"none"}})
        ),

        // B: 圆桌 (ErrorBoundary 保护 — 历史崩溃源)
        withEB("🎭 圆桌 Canvas", e("div",{style:{marginBottom:16}},
          e("div",{style:{position:"relative",width:360,height:300,margin:"0 auto"}},
            e("canvas",{ref:cvRf,width:360,height:300,style:{borderRadius:8,background:"rgba(26,26,46,0.65)",boxShadow:"0 2px 8px rgba(0,0,0,.3)"},onMouseMove:function(ev){try{var rect=ev.target.getBoundingClientRect();var mx=ev.clientX-rect.left;var my=ev.clientY-rect.top;var mp=Array.isArray(cvRf._memPos)?cvRf._memPos:[];for(var i=0;i<mp.length;i++){var p=mp[i];if(!p)continue;if(Math.abs(mx-(p.x||0))<16&&Math.abs(my-(p.y||0))<20){var id=String(p.id||"");var found=Array.isArray(ags)?ags.find(function(a){return a&&a.agent_id&&String(a.agent_id)===id;}):null;setHoverInfo({name:p.name||id,id:id,x:ev.clientX,y:ev.clientY,agent:found||null});return;}}setHoverInfo(null);}catch(ex){setHoverInfo(null);}},onMouseLeave:function(){setHoverInfo(null)}}),
            hoverInfo&&typeof hoverInfo==="object"?e("div",{style:{position:"fixed",left:(hoverInfo.x||0)+14,top:(hoverInfo.y||0)-50,zIndex:100,background:"rgba(62,39,35,0.92)",color:"#fff",padding:"6px 12px",borderRadius:6,fontSize:11,pointerEvents:"none",lineHeight:1.6}},
              e("div",{style:{fontWeight:"bold"}},hoverInfo.name||""),
              e("div",{style:{fontSize:10,opacity:0.7}},hoverInfo.id||""),
              hoverInfo.agent&&hoverInfo.agent.enabled===false?e("div",{style:{fontSize:10,color:"#ff6b6b"}},"⛔ 已禁用"):null,
              Array.isArray(chEnabled)&&chEnabled.length>0?e("div",{style:{fontSize:10,opacity:0.65}},"📡 "+chEnabled.map(function(c){return (c&&c.label)||(c&&c.name)||"";}).join(", ")):null
            ):null
          )
        )),

        // D: 环境信息已移至顶栏 Popover（🕐 图标）
        null,

        // E: 圆桌主题
        e("div",{style:{marginBottom:16}},
          e("div",{style:{display:"flex",gap:4,marginBottom:6}},
            themes.map(function(t,i){return e(Button,{key:i,size:"small",type:themeIdx===i?"primary":"default",onClick:function(){setThemeIdx(i);setTblColor(t.table);},style:{fontSize:10,minWidth:44}},t.name);})
          ),
          e("div",{style:{display:"flex",alignItems:"center",gap:6}},
            e("input",{type:"color",value:tblColor,onChange:function(ev){setTblColor(ev.target.value);setThemeIdx(-1);},style:{width:32,height:32,border:themeIdx===-1?"2px solid #ff6f00":"1px solid #ccc",cursor:"pointer",padding:0,outline:themeIdx===-1?"2px solid rgba(255,111,0,0.4)":"none",outlineOffset:2,borderRadius:4}})
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

      ),
      /* ---- 📼 讨论回顾 PPT ---- */
      e(Modal,{title:null,open:replayV,onCancel:function(){setReplayV(false);setReplayPl(false);},footer:null,width:"100vw",
        style:{maxWidth:"100vw",top:0,padding:0},bodyStyle:{background:"#0a0a1a",minHeight:"100vh",padding:0,overflow:"hidden"}},
        e("div",{style:{position:"absolute",top:0,left:0,height:3,background:"#00e5ff",
          width:((replayIdx+1)/hist.length*100)+"%",transition:"width .3s"}}),
        e("div",{style:{position:"absolute",top:16,right:24,zIndex:10}},
          e(Button,{type:"text",onClick:function(){setReplayV(false);setReplayPl(false);},style:{color:"#fff",fontSize:28}},"✕")),
        e("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",padding:"60px 40px 120px"}},
          (function(){
            if (replayIdx>=hist.length) return null;
            var m=hist[replayIdx];
            var ac=(m.role==="human"?"#e91e63":m.role==="host"?"#ff9800":"#00e5ff");
            var ic=(m.role==="human"?"🧑":m.role==="host"?"🎤":"🤖");
            return e("div",{key:replayIdx,style:{
              background:"linear-gradient(135deg,#1a1a3e 0%,#0d0d2b 100%)",
              border:"1px solid "+ac+"44",borderRadius:20,padding:"36px 48px",maxWidth:760,width:"100%",
              boxShadow:"0 0 80px "+ac+"15",animation:"tcIn .45s ease-out"
            }},
              e("div",{style:{display:"flex",alignItems:"center",gap:18,marginBottom:28}},
                e("div",{style:{width:52,height:52,borderRadius:"50%",background:ac,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 0 20px "+ac+"50"}},ic),
                e("div",null,
                  e(Text,{style:{color:ac,fontSize:22,fontWeight:700,display:"block",fontFamily:"monospace"}},m.sender_name||m.sender||"?"),
                  e(Text,{style:{color:"#667",fontSize:12,display:"block",marginTop:2}},new Date(m.timestamp*1000).toLocaleString())
                )
              ),
              e("div",{style:{color:"#d0d0e0",fontSize:17,lineHeight:1.9,whiteSpace:"pre-wrap",maxHeight:"52vh",overflow:"auto"}},m.content)
            );
          })()
        ),
        e("div",{style:{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,#0a0a1a 40%)",padding:"24px 0 40px",display:"flex",justifyContent:"center",alignItems:"center",gap:20}},
          e(Button,{shape:"circle",size:"large",disabled:replayIdx<=0,onClick:function(){setReplayIdx(Math.max(0,replayIdx-1));setReplayPl(false);},style:{background:"rgba(255,255,255,.08)",border:"1px solid rgba(0,229,255,.3)",color:"#00e5ff"}},"◀"),
          e(Button,{shape:"circle",size:"large",onClick:function(){setReplayPl(!replayPl);},style:{background:"#00e5ff",border:"none",color:"#0a0a1a",boxShadow:"0 0 24px #00e5ff40"}},replayPl?"⏸":"▶"),
          e(Button,{shape:"circle",size:"large",disabled:replayIdx>=hist.length-1,onClick:function(){setReplayIdx(Math.min(hist.length-1,replayIdx+1));setReplayPl(false);},style:{background:"rgba(255,255,255,.08)",border:"1px solid rgba(0,229,255,.3)",color:"#00e5ff"}},"▶"),
          e(Text,{style:{color:"#00e5ff",fontSize:15,fontFamily:"monospace",minWidth:50,textAlign:"center"}},(replayIdx+1)+" / "+hist.length),
          replayIdx>=hist.length-1?e(Button,{type:"primary",onClick:exportMd,style:{background:"#00e5ff",border:"none",color:"#0a0a1a",fontWeight:700,boxShadow:"0 0 20px #00e5ff40"}},"📥 导出 Markdown"):null
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
      e(Modal,{title:"📖 TeamChat v4.0.9 说明文档",open:readmeV,onCancel:function(){setReadmeV(false);},footer:null,width:800,style:{maxHeight:"80vh"}},
        e("div",{style:{maxHeight:"60vh",overflow:"auto",padding:"0 8px",fontFamily:"monospace",fontSize:12,whiteSpace:"pre-wrap",lineHeight:1.6}},readmeC||"加载中...")
      )
    ));
  }

  QP.registerRoutes("team_chat",[{path:"/plugin/team-chat/meeting",component:TeamChatPage,label:"新会谈",icon:"团",priority:100}]);
})();