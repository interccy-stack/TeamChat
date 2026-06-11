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
    var _at = useState(0), avTs = _at[0], setAvTs = _at[1];
    var histRf = useRef(null), cvRf = useRef(null), fiRf = useRef(null), avRf = useRef(null);

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

    useEffect(function () {
      if (!ld) { setPp(0); setCr(0); return; }
      setPp(0); var t = setInterval(function () { setPp(function (p) { return p<90?p+2:p; }); }, 400);
      return function () { clearInterval(t); };
    }, [ld]);

    useEffect(function () { if (histRf.current) histRf.current.scrollTop = histRf.current.scrollHeight; }, [hist]);

    useEffect(function () {
      var cv = cvRf.current; if (!cv) return;
      var ctx = cv.getContext("2d"), W = 200, H = 170, cx = W/2, cy = H/2+20, r = 40;
      var mem = [{id:"human",name:"你",color:"#e8f0fe"}];
      if (hid) mem.push({id:hid,name:hnm.slice(0,8),color:"#fff3cd"});
      sel.forEach(function (id) { mem.push({id:id,name:id.slice(0,10),color:"#d4edda"}); });
      var fr = 0;
      function dr() {
        ctx.clearRect(0,0,W,H); ctx.fillStyle="#1a1a2e"; ctx.fillRect(0,0,W,H);
        ctx.fillStyle="#5D4037"; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle="#FFD700"; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle="#795548"; ctx.beginPath(); ctx.arc(cx,cy,r-8,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#aaa"; ctx.font="bold 10px monospace"; ctx.fillText("🏛 华容咨询会谈室",6,30);
        var n = mem.length||1;
        mem.forEach(function (m, i) {
          var angle = -Math.PI/2+(i/n)*Math.PI*2;
          var bounce = Math.sin(fr*0.04+i)*2;
          var px = cx+(r+22+bounce)*Math.cos(angle);
          var py = cy+(r+22+bounce)*Math.sin(angle);
          ctx.fillStyle=m.color; ctx.globalAlpha=0.85; ctx.fillRect(px-5,py-3,10,10);
          ctx.fillStyle="#FFD700"; ctx.globalAlpha=1;
          ctx.beginPath(); ctx.arc(px,py-8,5,0,Math.PI*2); ctx.fill();
          ctx.fillStyle="#fff"; ctx.font="7px monospace";
          var nm = m.name.length>10?m.name.slice(0,9)+".":m.name;
          ctx.fillText(nm,px-nm.length*2.5,py+16);
        });
        fr++; requestAnimationFrame(dr);
      }
      var rid = requestAnimationFrame(dr);
      return function () { cancelAnimationFrame(rid); };
    }, [hid, hnm, sel]);

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
      var f = ev.target.files[0]; if (!f || !ai) return;
      var fd = new FormData();
      fd.append("agent_id", ai);
      fd.append("file", f);
      setAi("");
      fetch(getApiUrl("/team-chat/avatar"),{method:"POST",body:fd}).then(function (r) {
        if (!r.ok) return r.json().then(function (e) { throw new Error(e.detail); });
        return r.json();
      }).then(function (d) {
        message.success(d.agent_id+" 头像已更新");
        setAvTs(Date.now());
      }).catch(function (e) { message.error(e.message); });
    }, [ai]);

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
        e("canvas",{ref:cvRf,width:200,height:170,style:{position:"absolute",top:"calc(50% - 85px)",left:"calc(50% - 100px)",zIndex:10,borderRadius:8,background:"#1a1a2e",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}),
      e("div",{style:{padding:"10px 16px",background:"#fafafa",borderBottom:"1px solid #e8e8e8",flexShrink:0}},
        e("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8}},
          e(Text,{strong:true,style:{fontSize:13}},"选择主持人:"),
          e("div",{style:{flex:1,maxWidth:300}},
            agLd?e(Spin,{size:"small"}):e(Select,{value:hid,onChange:chHost,style:{width:"100%"},size:"small",
              options:ags.map(function (a) { return {value:a.agent_id,label:(a.is_host?"⭐ ":"")+(a.name||a.agent_id)}; })})
          )
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
          ags.map(function (a) {
            var ih = a.agent_id===hid, is = !ih&&sel.indexOf(a.agent_id)>=0;
            var avUrl = getApiUrl("/team-chat/avatar/"+a.agent_id);
            return e(Tag,{key:a.agent_id,color:ih?"default":(is?"blue":"default"),
              style:{cursor:ih?"not-allowed":"pointer",opacity:ih?0.5:1,display:"flex",alignItems:"center",gap:4},
              onClick:function () { toggle(a.agent_id); }
            },
              e("span",{style:{display:"inline-flex",alignItems:"center",gap:3,
                onClick:function(ev){ev.stopPropagation();setAi(a.agent_id);if(avRf.current)avRf.current.click();}
              }},
                e("img",{src:avUrl+"?t="+avTs,style:{width:20,height:20,borderRadius:"50%",objectFit:"cover",background:"#eee"},
                  onError:function(e){e.target.style.display="none";}
                }),
                (ih?"🎤":is?"✅":"")
              ),
              (a.name||a.agent_id)+(ih?" (主持人)":"")
            );
          })
        ),
        e("div",{style:{marginTop:6}},e(Button,{icon:"📂",size:"small",onClick:loadSess},"历史会谈"))
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
          )
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
        e("div",{style:{marginBottom:16}},
          e("div",{style:{fontSize:14,fontWeight:"bold",marginBottom:12,color:"#333"}},"💻 环境信息"),
          e("div",{style:{marginBottom:8,fontSize:13,color:"#666"}},
            e("span",{style:{fontWeight:"bold",color:"#333"}},"CPU: "), (navigator.hardwareConcurrency||"?")+" 核"),
          e("div",{style:{marginBottom:8,fontSize:13,color:"#666"}},
            e("span",{style:{fontWeight:"bold",color:"#333"}},"内存: "), (navigator.deviceMemory||"?")+" GB"),
          e("div",{style:{fontSize:13,color:"#666"}},
            e("span",{style:{fontWeight:"bold",color:"#333"}},"系统: "), (navigator.platform||"未知"))
        ),
        e("div",{style:{borderTop:"1px solid #e0e0e0",paddingTop:12}},
          e("div",{style:{fontSize:13,fontWeight:"bold",marginBottom:8,color:"#333"}},"📝 人类用户&上下文"),
          e(TextArea,{value:uc,onChange:function(ev){setUc(ev.target.value);},placeholder:"我是谁？想让AI知道的信息...",autoSize:{minRows:5,maxRows:10},style:{fontSize:12,borderRadius:6,resize:"none"}})
        )
      )
    );
  }

  QP.registerRoutes("team_chat",[{path:"/plugin/team-chat/meeting",component:TeamChatPage,label:"新会谈",icon:"🤝",priority:100}]);
})();
