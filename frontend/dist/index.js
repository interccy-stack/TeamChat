/**
 * TeamChat Frontend v4.0.6
 * 标签/置顶/删除/搜索全部就位
 */
(function () {
  var QP = window.QwenPaw; if (!QP) return;
  var React = QP.host.React, antd = QP.host.antd, antdIcons = QP.host.antdIcons || {};
  var getApiUrl = QP.host.getApiUrl, getApiToken = QP.host.getApiToken;
  var e = React.createElement, useState = React.useState, useEffect = React.useEffect;
  var useRef = React.useRef, useCallback = React.useCallback;
  var Button = antd.Button, Input = antd.Input, Card = antd.Card, Space = antd.Space;
  var Tag = antd.Tag, Select = antd.Select, Switch = antd.Switch, InputNumber = antd.InputNumber;
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

  function MessageBubble(props) {
    var m = props.msg;
    var color, bg, label;
    if (m.role==="human") { color="#fff"; bg="#1a1a2e"; label="🧑 你"; }
    else if (m.role==="host") { color="#333"; bg="#fff3cd"; label="🎤 "+(m.sender_name||"主持人"); }
    else { color="#333"; bg="#e8f0fe"; label="🤖 "+(m.sender_name||m.sender); }
    var ts = new Date(m.timestamp*1000).toLocaleTimeString();
    return e(Card, {size:"small", style:{marginBottom:14,borderRadius:12,background:bg,border:"none",
      marginLeft:m.role==="human"?"auto":0,marginRight:m.role==="human"?0:"auto",maxWidth:"85%"},
      title:e(Space,null,e(Text,{style:{fontSize:11,color:"#888"}},label+" · "+ts))},
      e("div",{style:{color:color,fontSize:14,whiteSpace:"pre-wrap"}},m.content),
      m.robot_prompt?e("details",{style:{marginTop:8,fontSize:12}},
        e("summary",{style:{color:"#666",cursor:"pointer"}},"📋 提示词"),
        e("pre",{style:{background:"#f5f5f5",padding:8,borderRadius:4,maxHeight:150,overflow:"auto",fontSize:11}},m.robot_prompt)):null
    );
  }

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
    var _ha = useState(false), humAv = _ha[0], setHumAv = _ha[1];
    var _ht = useState(0), humAvTs = _ht[0], setHumAvTs = _ht[1];
    var _hv = useState(null), hoverInfo = _hv[0], setHoverInfo = _hv[1];
    var _gm = useState(null), gomoku = _gm[0], setGomoku = _gm[1];
    var _gid = useState(""), gmId = _gid[0], setGmId = _gid[1];
    var _gba = useState(""), gmBA = _gba[0], setGmBA = _gba[1];
    var _gwa = useState(""), gmWA = _gwa[0], setGmWA = _gwa[1];
    var _gpv = useState(false), gmPassive = _gpv[0], setGmPassive = _gpv[1];
    var _sip = useState(""), sysIp = _sip[0], setSysIp = _sip[1];
    var _clk = useState(new Date().toLocaleString()), clock = _clk[0], setClock = _clk[1];
    var _at = useState(0), avTs = _at[0], setAvTs = _at[1];
    var histRf = useRef(null), cvRf = useRef(null), fiRf = useRef(null), avRf = useRef(null), aiRf = useRef(""), humAvRf = useRef(null);

    useEffect(function () { setAgLd(true); apiGet("/agents").then(function (d) {
      setAgs(d.agents||[]); var def = (d.agents||[]).find(function (a) { return a.agent_id==="cloud-orchestrator"; });
      if (def) setHnm(def.name||"CloudPaw-Master"); setAgLd(false);
    }).catch(function (e) {
      console.error("加载智能体列表失败:", e);
      setAgs([]); setAgLd(false);
    }); }, []);

    useEffect(function () {
      var ls = ""; try { ls = localStorage.getItem("teamchat_last_session")||""; } catch (e) {}
      if (ls) apiGet("/session/"+ls).then(function (r) {
        setSi(r.session_id); setHist(r.history||[]); setStps(r.host_steps||[]);
        setHid(r.host_id||"cloud-orchestrator"); setHnm(r.host_name||"CloudPaw-Master");
      }).catch(function () {});
    }, []);

    var handleHumanAvatar = useCallback(function (ev) {
      var f = ev.target.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function (re) {
        var img = new Image();
        img.onload = function () {
          var cvs = document.createElement("canvas");
          cvs.width = 30; cvs.height = 30;
          var ctx = cvs.getContext("2d");
          ctx.drawImage(img, 0, 0, 30, 30);
          cvs.toBlob(function (blob) {
            var fd = new FormData();
            fd.append("file", blob, "human_30x30.png");
            fetch(getApiUrl("/team-chat/avatar/human"),{method:"POST",body:fd}).then(function (r) {
              if (!r.ok) return r.json().then(function (e) {
                var msg = typeof e.detail === "string" ? e.detail : (Array.isArray(e.detail) ? e.detail.map(function(d){return d.msg;}).join("; ") : JSON.stringify(e.detail));
                throw new Error(msg);
              });
              return r.json();
            }).then(function () {
              message.success("人类头像已更新");
              setHumAv(true);
              setHumAvTs(Date.now());
            }).catch(function (e) { message.error(e.message); });
          }, "image/png");
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(f);
    }, []);

    var handleBoardClick = useCallback(function(r,c) {
      if (!gomoku || gmPassive) return;
      apiPost("/team-chat/gomoku/move",{row:r,col:c}).then(function(r) { setGomoku(r); });
    }, [gomoku, gmPassive]);

    useEffect(function () {
      if (!ld) { setPp(0); setCr(0); return; }
      setPp(0); var t = setInterval(function () { setPp(function (p) { return p<90?p+2:p; }); }, 400);
      return function () { clearInterval(t); };
    }, [ld]);

    useEffect(function () { if (histRf.current) histRf.current.scrollTop = histRf.current.scrollHeight; }, [hist]);

    useEffect(function () {
      fetch(getApiUrl("/team-chat/system-info")).then(function (r) { return r.json(); }).then(function (d) {
        setSysIp(d.ip||"未知");
      }).catch(function () { setSysIp("获取失败"); });
      var t = setInterval(function () { setClock(new Date().toLocaleString()); }, 1000);
      return function () { clearInterval(t); };
    }, []);

    var handleBoardClick = useCallback(function(r,c) {
      if (!gomoku || gmPassive) return;
      apiPost("/team-chat/gomoku/move",{row:r,col:c}).then(function(r) { setGomoku(r); });
    }, [gomoku, gmPassive]);

    useEffect(function () {
      var cv = cvRf.current; if (!cv) return;
      var ctx = cv.getContext("2d"), W = 360, H = 300, cx = W/2, cy = H/2+24, r = 48;
      var mem = [{id:"human",name:"你",color:"#e8f0fe"}];
      if (hid) mem.push({id:hid,name:hnm.slice(0,8),color:"#fff3cd"});
      sel.forEach(function (id) { mem.push({id:id,name:id.slice(0,10),color:"#d4edda"}); });
      var avImgs={};mem.forEach(function(m){if(m.id!=="human"){var img=new Image();img.src=getApiUrl("/team-chat/avatar/"+m.id);avImgs[m.id]=img;}});var himg=new Image();himg.src=getApiUrl("/team-chat/avatar/human")+"?t="+humAvTs;avImgs["human"]=himg;var fr=0;
      function dr() {
        ctx.clearRect(0,0,W,H); ctx.fillStyle="rgba(26,26,46,0.65)";ctx.fillRect(0,0,W,H);
        ctx.fillStyle="#5D4037"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
        if(bs){var pulse=Math.sin(fr*0.05)*0.4+0.6;ctx.strokeStyle="rgba(255,215,0,"+pulse+")";ctx.lineWidth=2+pulse*3;}else{ctx.strokeStyle="#FFD700";ctx.lineWidth=2;}
        ctx.stroke();
        ctx.fillStyle="#795548"; ctx.beginPath(); ctx.arc(cx,cy,r-8,0,Math.PI*2); ctx.fill();
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
        ctx.fillStyle="rgba(139,90,43,0.15)";
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
          var aimg=avImgs[m.id];if(aimg&&aimg.complete&&aimg.naturalWidth>0){ctx.globalAlpha=1;ctx.drawImage(aimg,px-10,py-14,20,20);ctx.strokeStyle="#FFD700";ctx.lineWidth=1;ctx.strokeRect(px-10,py-14,20,20);}else{ctx.fillStyle=m.color;ctx.globalAlpha=0.85;ctx.fillRect(px-5,py-3,10,10);ctx.fillStyle="#FFD700";ctx.globalAlpha=1;ctx.beginPath();ctx.arc(px,py-8,5,0,Math.PI*2);ctx.fill();}
          ctx.fillStyle="#fff"; ctx.font="7px monospace";
          var nm = m.name.length>10?m.name.slice(0,9)+".":m.name;
          ctx.fillText(nm,px-nm.length*2.5,py+16);
        });
        cvRf._memPos=memPos;
        fr++; requestAnimationFrame(dr);
      }
      var rid = requestAnimationFrame(dr);
      return function () { cancelAnimationFrame(rid); };
    }, [hid, hnm, sel, avTs, humAvTs, bs]);

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

    var handleBoardClick = useCallback(function(r,c) {
      if (!gomoku || gmPassive) return;
      apiPost("/team-chat/gomoku/move",{row:r,col:c}).then(function(r) { setGomoku(r); });
    }, [gomoku, gmPassive]);

    useEffect(function () {
      if (!gmId) return;
      var iv = setInterval(function () {
        fetch(getApiUrl("/team-chat/gomoku/state?game_id=" + gmId)).then(function (r) {
          if (!r.ok) return;
          return r.json();
        }).then(function (d) { if (d && d.exists) setGomoku(d); }).catch(function () {});
      }, 500);
      return function () { clearInterval(iv); };
    }, [gmId]);

    useEffect(function () {
      if (!gmPassive || gmId) return;
      var iv = setInterval(function () {
        fetch(getApiUrl("/team-chat/gomoku/state")).then(function (r) {
          if (!r.ok) return;
          return r.json();
        }).then(function (d) { if (d && d.exists && d.status === "playing") { setGmId(d.game_id); setGomoku(d); } }).catch(function () {});
      }, 5000);
      return function () { clearInterval(iv); };
    }, [gmPassive, gmId]);

    useEffect(function () {
      if (!gmPassive || gmId) return;
      if (!hist || !hist.length) return;
      var latest = hist[hist.length - 1];
      if (latest && latest.role === "host") {
        var text = (latest.content || "").toLowerCase();
        var triggers = ["下一局", "来下棋", "来下一局", "下一盘", "来一局", "下棋吗", "和我下", "谁和我", "来玩", "棋"];
        var hit = triggers.some(function (t) { return text.indexOf(t) >= 0; });
        if (hit && ags && ags.length >= 2) {
          var ba = gmBA, wa = gmWA;
          if (!ba || !wa) {
            var pool = ags.filter(function(a){return !a.is_host;});
            if (pool.length >= 2) { ba = pool[0].agent_id; wa = pool[1].agent_id; }
          }
          if (ba && wa) {
          setTimeout(function () {
            fetch(getApiUrl("/team-chat/gomoku/start"), {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ black_agent: ba, white_agent: wa })
            }).then(function (r) { return r.json(); }).then(function (d) {
              if (d.ok) { setGmId(d.game_id); message.success("🎮 智能体发起对弈！"); }
            }).catch(function () {});
          }, 2000);
          }
        }
      }
    }, [hist, gmPassive, gmId, ags, gmBA, gmWA]);

    var startGomoku = useCallback(function () {
      if (!gmBA || !gmWA) { message.warning("请先选择黑方和白方智能体"); return; }
      fetch(getApiUrl("/team-chat/gomoku/start"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ black_agent: gmBA, white_agent: gmWA })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.ok) { setGmId(d.game_id); message.success("五子棋开始！"); }
      }).catch(function (e) { message.error("启动失败: " + e.message); });
    }, [gmBA, gmWA]);

    var stopGomoku = useCallback(function () {
      if (!gmId) return;
      fetch(getApiUrl("/team-chat/gomoku/stop?game_id=" + gmId), { method: "POST" })
        .then(function () { setGmId(""); setGomoku(null); message.info("游戏已停止"); });
    }, [gmId]);

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
              message.success(d.agent_id+" 头像已更新");
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
          if (ri>rds) { setLd(false); setHist(all); try { localStorage.setItem("teamchat_last_session",si||""); } catch (e) {}
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

    return e("div",{style:{display:"flex",flexDirection:"row",height:"100%",fontFamily:"system-ui, sans-serif"}},
      e("div",{style:{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}},
      e("div",{style:{padding:"10px 16px",background:"#fafafa",borderBottom:"1px solid #e8e8e8",flexShrink:0}},
        e("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},
          e(Text,{strong:true,style:{fontSize:13}},"选择主持人:"),
          e("div",{style:{flex:1,maxWidth:300}},
            agLd?e(Spin,{size:"small"}):e(Select,{value:hid,onChange:chHost,style:{width:"100%"},size:"small",
              options:ags.map(function (a) { return {value:a.agent_id,label:(a.is_host?"⭐ ":"")+(a.name||a.agent_id)}; })})
          ),
          e(Button,{icon:e(antdIcons.HistoryOutlined||null),size:"middle",onClick:loadSess,style:{fontWeight:"bold",fontSize:14}},"📂 历史会谈")
        ),
        e("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},
          e(Switch,{checked:bs,onChange:setBs,size:"small"}), e(Text,{strong:true,style:{fontSize:13}},"🧠 头脑风暴"),
          bs?e(InputNumber,{min:2,max:5,value:rds,onChange:setRds,size:"small",style:{width:50}}):null,
          bs?e(Text,{type:"secondary",style:{fontSize:11}},"轮"):null
        ),
        e("div",{style:{marginBottom:4}},e(Text,{strong:true,style:{fontSize:13}},"选择参与智能体:"),
          agLd?e(Spin,{size:"small",style:{marginLeft:8}}):
          ags.length===0?e(Space,{size:4,style:{marginLeft:8}},
            e(Text,{type:"danger",style:{fontSize:12}},"⚠ 无法加载智能体"),
            e(Button,{size:"small",onClick:function () { setAgLd(true); apiGet("/agents").then(function (d) { setAgs(d.agents||[]); setAgLd(false); }).catch(function () { setAgLd(false); }); }},"🔄 重试")
          ):null
        ),
        e("div",{style:{display:"flex",flexWrap:"wrap",gap:6}},
          e("input",{ref:avRf,type:"file",accept:".jpg,.jpeg,.png",onChange:handleAvatar,style:{display:"none"}}),
          e("input",{ref:humAvRf,type:"file",accept:".jpg,.jpeg,.png",onChange:handleHumanAvatar,style:{display:"none"}}),
          ags.map(function (a) {
            var ih = a.agent_id===hid, is = !ih&&sel.indexOf(a.agent_id)>=0;
            var avUrl = getApiUrl("/team-chat/avatar/"+a.agent_id);
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
          })
        ),
      ),
      e("div",{ref:histRf,style:{flex:1,overflow:"auto",padding:"16px 20px",background:"#fff"}},
        hist.length===0&&!ld?e(Empty,{description:"选择主持人和参与智能体，开始团队会谈",style:{marginTop:60}}):null,
        hist.map(function (m, i) { return e(MessageBubble,{key:i,msg:m}); }),
        ld?e("div",{style:{textAlign:"center",padding:12}},
          e(Progress,{percent:pp,status:"active",strokeColor:{"0%":"#ff4d4f","30%":"#faad14","60%":"#1890ff","100%":"#52c41a"},style:{marginBottom:6}}),
          e("div",{style:{fontSize:16}},pp>20?"✨":"",pp>50?"🔥":"",pp>80?"💥":""),
          e(Text,{type:"secondary",style:{fontSize:11}},bs&&cr>0?"🧠 第 "+cr+"/"+rds+" 轮":"处理中...")
        ):null
      ),
      stps.length>0?e("div",{style:{padding:"8px 16px",background:"#fffbe6",borderTop:"1px solid #ffe58f",flexShrink:0,maxHeight:160,overflow:"auto"}},
        e(Collapse,{size:"small",ghost:true},e(Panel,{header:"📋 主持步骤 ("+stps.length+" 步)",key:"steps"},
          stps.map(function (s, i) {
            return e("div",{key:i,style:{marginBottom:4,fontSize:12}},
              e(Tag,{color:"blue",style:{marginRight:6}},"步骤"+s.step),
              e(Text,{strong:true},s.action),e("br"),e(Text,{type:"secondary"},s.detail)
            );
          })
        ))
      ):null,
      e("div",{style:{padding:"12px 16px",borderTop:"1px solid #e8e8e8",background:"#fafafa",flexShrink:0}},
        e(Space,{direction:"vertical",style:{width:"100%"}},
          e(TextArea,{value:msg,onChange:function (ev) { setMsg(ev.target.value); },onKeyDown:onKd,
            placeholder:"输入消息，AI主持人会协调回复...",autoSize:{minRows:2,maxRows:4},disabled:ld,style:{borderRadius:8}}),
          e("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            e(Space,null,
              e(Text,{type:"secondary",style:{fontSize:11}},"Enter 发送 · Shift+Enter 换行"),
              e(Button,{size:"small",icon:"🎤",danger:list,onClick:startVoice,disabled:ld},list?"聆听中...":"语音"),
              e(Button,{size:"small",icon:"📎",disabled:ld,onClick:function () { if (fiRf.current) fiRf.current.click(); }},"附件"),
              e("input",{ref:fiRf,type:"file",accept:".txt,.md,.json,.py,.js,.html,.css,.xml,.csv,.log,.yaml,.yml",onChange:handleFile,style:{display:"none"}})
            ),
            e(Button,{type:"primary",icon:e(antdIcons.SendOutlined||null),onClick:send,loading:ld,disabled:!msg.trim()},"发送")
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
                      if (v!==null) apiPut("/session/"+s.session_id+"/tag",{tag:v}).then(function () { message.success("标签已更新"); }).catch(function (e) { message.error(e.message); });
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
      e("div",{style:{width:280,minWidth:280,borderLeft:"1px solid #e8e8e8",padding:"16px",background:"#fafafa",flexShrink:0,display:"flex",flexDirection:"column",overflowY:"auto",minHeight:"100%"}},

        // A: 人类身份
        e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:14,fontWeight:"bold",marginBottom:8,color:"#333"}},"👤 人类身份"),
          e("input",{ref:humAvRf,type:"file",accept:"image/*",onChange:handleHumanAvatar,style:{display:"none"}}),
          e("div",{style:{display:"flex",gap:8,marginBottom:8,alignItems:"center"}},
            e("div",{style:{width:40,height:40,borderRadius:"50%",overflow:"hidden",background:"#e0e0e0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},onClick:function(){if(humAvRf.current)humAvRf.current.click()}},
              humAv?e("img",{src:getApiUrl("/team-chat/avatar/human?t="+humAvTs),style:{width:"100%",height:"100%",objectFit:"cover"}})
              :e(Text,{type:"secondary",style:{fontSize:10}},"选择"),
            ),
            e(Text,{type:"secondary",style:{fontSize:11}},"点击上传 30×30 头像")
          ),
          e(TextArea,{value:uc,onChange:function(ev){setUc(ev.target.value)},placeholder:"我是谁？想让AI知道的信息...",autoSize:{minRows:5,maxRows:10},style:{fontSize:12,borderRadius:6,resize:"none"}})
        ),

        // B: 圆桌
        e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:14,fontWeight:"bold",marginBottom:8,color:"#333"}},"🎭 圆桌"),
          e("div",{style:{position:"relative",width:360,height:300,margin:"0 auto"}},
            e("canvas",{ref:cvRf,width:360,height:300,style:{borderRadius:8,background:"rgba(26,26,46,0.65)",boxShadow:"0 2px 8px rgba(0,0,0,.3)"},onMouseMove:function(ev){var rect=ev.target.getBoundingClientRect();var mx=ev.clientX-rect.left;var my=ev.clientY-rect.top;var mp=cvRf._memPos||[];for(var i=0;i<mp.length;i++){if(Math.abs(mx-mp[i].x)<16&&Math.abs(my-mp[i].y)<20){setHoverInfo({name:mp[i].name,id:mp[i].id,x:ev.clientX,y:ev.clientY});return;}}setHoverInfo(null)},onMouseLeave:function(){setHoverInfo(null)}}),
            hoverInfo?e("div",{style:{position:"fixed",left:hoverInfo.x+14,top:hoverInfo.y-30,zIndex:100,background:"rgba(0,0,0,0.85)",color:"#fff",padding:"4px 10px",borderRadius:6,fontSize:12,pointerEvents:"none",whiteSpace:"nowrap"}},hoverInfo.name):null
          )
        ),

        // D: 环境信息
        e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:14,fontWeight:"bold",marginBottom:8,color:"#333"}},"🌐 环境信息"),
          e("div",{style:{padding:8,background:"#f0f0f0",borderRadius:4}},
            e("div",{style:{marginBottom:4}},e(Text,{style:{fontSize:11}},"🖥 本机IP: "),e(Text,{code:true,style:{fontSize:11}},sysIp||"加载中...")),
            e("div",null,e(Text,{style:{fontSize:11}},"🕐 "+clock))
          )
        )

      )
    );
  }

  QP.registerRoutes("team_chat",[{path:"/plugin/team-chat/meeting",component:TeamChatPage,label:"新会谈",icon:"🤝",priority:100}]);
})();