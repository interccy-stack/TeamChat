// ============================================================
// AI Group Chat Module - 智能体群聊功能 (小红书风格)
// ============================================================
(function() {
  'use strict';
  
  function initAIGroupChat() {
    var QP = window.QwenPaw;
    if (!QP || !QP.host) {
      setTimeout(initAIGroupChat, 100);
      return;
    }
    
    var React = QP.host.React;
    var antd = QP.host.antd;
    var e = React.createElement, useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;
    var Button = antd.Button, Input = antd.Input, Card = antd.Card, Space = antd.Space;
    var Spin = antd.Spin, Empty = antd.Empty, message = antd.message;
    var getApiUrl = QP.host.getApiUrl;
    
    function aiChatApiGet(path) {
      return fetch(getApiUrl('/plugins/team_chat/ai-chat' + path), {
        headers: { 'Content-Type': 'application/json' }
      }).then(function(r) { return r.json(); });
    }
    
    function aiChatApiPost(path, body) {
      return fetch(getApiUrl('/plugins/team_chat/ai-chat' + path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(r) { return r.json(); });
    }
    
    // 智能体配置（带头像图片）
    var AGENTS_CONFIG = [
      { id: 'agent:default', name: 'Default', fullName: 'Default', icon: '🤖', color: '#52c41a', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=default&backgroundColor=b6e3f4' },
      { id: 'agent:QwenPaw_QA_Agent_0.2', name: 'QA Agent', fullName: 'QA Agent', icon: '❓', color: '#722ed1', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa&backgroundColor=d1d4f9' },
      { id: 'agent:cloud-orchestrator', name: 'CloudPaw-Master', fullName: 'CloudPaw-Master (主持人)', icon: '🎯', color: '#fa8c16', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=master&backgroundColor=ffd8bf' },
      { id: 'agent:cloud-executor', name: 'CloudPaw-Executor', fullName: 'CloudPaw-Executor', icon: '⚡', color: '#1890ff', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=executor&backgroundColor=bae7ff' },
      { id: 'agent:cloud-verifier', name: 'CloudPaw-Verifier', fullName: 'CloudPaw-Verifier', icon: '✓', color: '#faad14', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=verifier&backgroundColor=fff1b8' }
    ];
    
    // AI 群聊页面组件（小红书风格）
    function AIGroupChatPage() {
      var [messages, setMessages] = useState([]);
      var [inputText, setInputText] = useState('');
      var [loading, setLoading] = useState(false);
      var [activeAgents, setActiveAgents] = useState(['agent:default']);
      var [userId] = useState('user_' + Math.random().toString(36).substr(2, 8));
      var [nickname] = useState('访客' + Math.floor(Math.random() * 1000));
      var [showHistory, setShowHistory] = useState(false);
      var messagesEndRef = useRef(null);
      var inputRef = useRef(null);
      
      useEffect(function() {
        aiChatApiPost('/join', {
          room_id: 'OFFICIAL_ROOM',
          user_id: userId,
          nickname: nickname
        }).then(function() {
          loadMessages();
        });
        
        var interval = setInterval(loadMessages, 3000);
        return function() { clearInterval(interval); };
      }, []);
      
      useEffect(function() {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, [messages]);
      
      function loadMessages() {
        aiChatApiGet('/messages/OFFICIAL_ROOM?user_id=' + userId + '&limit=100')
          .then(function(data) {
            if (data.success && data.messages) {
              setMessages(data.messages);
            }
          });
      }
      
      function sendMessage() {
        if (!inputText.trim()) return;
        var text = inputText.trim();
        setInputText('');
        setLoading(true);
        
        aiChatApiPost('/message', {
          room_id: 'OFFICIAL_ROOM',
          user_id: userId,
          message: text,
          msg_type: 'text',
          nickname: nickname
        }).then(function(data) {
          if (data.success) {
            loadMessages();
            setTimeout(loadMessages, 2000);
            setTimeout(loadMessages, 5000);
          } else {
            message.error(data.error ? '发送失败: ' + data.error : '发送失败');
          }
          setLoading(false);
        });
      }
      
      function toggleAgent(agentId) {
        setActiveAgents(function(prev) {
          if (prev.includes(agentId)) {
            return prev.filter(function(id) { return id !== agentId; });
          } else {
            return [...prev, agentId];
          }
        });
      }
      
      function insertMention(agentName) {
        setInputText(function(prev) { return prev + '@' + agentName + ' '; });
        if (inputRef.current) inputRef.current.focus();
      }
      
      function formatTime(isoString) {
        if (!isoString) return '';
        try {
          var date = new Date(isoString);
          return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch(e) { return ''; }
      }
      
      // 渲染消息气泡（小红书风格）
      function renderMessage(msg) {
        var isUser = msg.from && !msg.from.startsWith('agent:');
        var isAgent = msg.from && msg.from.startsWith('agent:');
        var agent = isAgent ? AGENTS_CONFIG.find(function(a) { return a.id === msg.from; }) : null;
        
        // 用户消息（右侧深色气泡）
        if (isUser) {
          return e('div', {
            key: msg.msg_id,
            style: { display: 'flex', justifyContent: 'flex-end', margin: '12px 16px' }
          }, e('div', {
            style: {
              maxWidth: '70%',
              background: '#3E2723',
              color: 'white',
              borderRadius: '16px 16px 4px 16px',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: '1.5'
            }
          }, e('div', { style: { fontSize: '12px', opacity: 0.7, marginBottom: '6px' } }, 
             '你 · ', formatTime(msg.time)),
             e('div', null, msg.text)));
        }
        
        // 智能体消息（左侧浅色气泡带头像）
        if (isAgent && agent) {
          return e('div', {
            key: msg.msg_id,
            style: { display: 'flex', justifyContent: 'flex-start', margin: '12px 16px', alignItems: 'flex-start' }
          }, e('img', {
            src: agent.avatar,
            style: { width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px', border: '2px solid ' + agent.color }
          }), e('div', { style: { maxWidth: '70%' } },
            e('div', { style: { fontSize: '12px', color: '#666', marginBottom: '4px' } },
              e('span', { style: { color: agent.color, fontWeight: 'bold' } }, agent.fullName),
              ' · ', formatTime(msg.time)),
            e('div', {
              style: {
                background: '#f5f5f5',
                borderRadius: '16px 16px 16px 4px',
                padding: '12px 16px',
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#333'
              }
            }, msg.text)));
        }
        
        // 系统消息
        if (msg.type === 'system') {
          return e('div', {
            key: msg.msg_id,
            style: { textAlign: 'center', margin: '16px', padding: '12px 20px', background: '#fffbe6', borderRadius: '8px', fontSize: '13px', color: '#666' }
          }, e('span', null, '🔔 ', msg.text));
        }
        
        return null;
      }
      
      // 主布局
      return e('div', { style: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#faf7f5' } },
        // 顶部导航栏
        e('div', { style: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e8e8e8', background: '#fff', minHeight: '48px', flexWrap: 'wrap', rowGap: '8px' } },
          e('div', { style: { fontSize: '14px', color: '#666', marginRight: '12px', whiteSpace: 'nowrap' } }, 'host主持:'),
          e('select', { 
            style: { padding: '6px 12px', borderRadius: '20px', border: '1px solid #d9d9d9', fontSize: '13px', flexShrink: 0 }
          }, AGENTS_CONFIG.map(function(agent) {
            return e('option', { key: agent.id, value: agent.id }, '⭐ ' + agent.fullName);
          })),
          e('div', { style: { marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } },
            e('span', { 
              style: { 
                padding: '4px 12px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                borderRadius: '12px', 
                fontSize: '12px', 
                color: '#fff',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              },
              onClick: function() { window.open('https://nightly.paw.msgbyte.com/invite/rj9iBh5Y', '_blank'); }
            }, '🌐 Agent协作网络'),
            e('span', { style: { padding: '4px 12px', background: '#f0f0f0', borderRadius: '12px', fontSize: '12px', whiteSpace: 'nowrap' } }, '💡 头脑风暴'),
            e('span', { style: { padding: '4px 12px', background: '#e6f7ff', borderRadius: '12px', fontSize: '12px', color: '#1890ff', whiteSpace: 'nowrap' } }, 'TC扩展')
          )
        ),
        
        // 智能体选择栏（小红书风格标签）
        e('div', { style: { display: 'flex', padding: '12px 16px', gap: '12px', background: '#fff', borderBottom: '1px solid #e8e8e8', alignItems: 'center' } },
          AGENTS_CONFIG.map(function(agent) {
            var isActive = activeAgents.includes(agent.id);
            return e('div', {
              key: agent.id,
              onClick: function() { toggleAgent(agent.id); insertMention(agent.name); },
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '2px solid ' + (isActive ? agent.color : '#e8e8e8'),
                background: isActive ? agent.color + '20' : '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }
            }, e('img', { src: agent.avatar, style: { width: '24px', height: '24px', borderRadius: '50%' } }),
               e('span', { style: { color: isActive ? agent.color : '#666' } }, agent.name));
          })
        ),
        
        // 消息区域
        e('div', { style: { flex: 1, overflow: 'auto', padding: '8px 0' } },
          messages.length === 0 ? 
            e(Empty, { description: '暂无消息，发送第一条消息开始聊天吧！', style: { marginTop: '100px' } }) :
            messages.map(renderMessage),
          e('div', { ref: messagesEndRef })
        ),
        
        // 底部输入区域（小红书风格）
        e('div', { style: { padding: '12px 16px', background: '#fff', borderTop: '1px solid #e8e8e8' } },
          // 提示文字
          e('div', { style: { fontSize: '12px', color: '#999', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' } },
            e('span', null, '💡'),
            e('span', null, 'Enter 发送 · Shift+Enter 换行 · ⌘ 历史')
          ),
          // 输入框
          e('div', { style: { display: 'flex', gap: '8px', alignItems: 'flex-end' } },
            e('textarea', {
              ref: inputRef,
              value: inputText,
              onChange: function(e) { setInputText(e.target.value); },
              placeholder: '回溯历史 · 输入消息，AI主持人协商回复...',
              onKeyDown: function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              },
              disabled: loading,
              style: {
                flex: 1,
                minHeight: '60px',
                maxHeight: '120px',
                padding: '12px 16px',
                borderRadius: '20px',
                border: '1px solid #d9d9d9',
                fontSize: '14px',
                resize: 'none',
                outline: 'none'
              }
            }),
            // 功能按钮组
            e('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
              e(Button, {
                type: 'default',
                size: 'small',
                icon: e('span', null, '🎙️'),
                style: { borderRadius: '16px' }
              }, '语音'),
              e(Button, {
                type: 'default',
                size: 'small',
                icon: e('span', null, '📎'),
                style: { borderRadius: '16px' }
              }, '附件'),
              e(Button, {
                type: 'default',
                size: 'small',
                icon: e('span', null, '⏮️'),
                style: { borderRadius: '16px' },
                onClick: function() { setShowHistory(!showHistory); }
              }, '回顾')
            ),
            // 发送按钮
            e(Button, {
              type: 'primary',
              size: 'large',
              onClick: sendMessage,
              loading: loading,
              style: {
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }
            }, e('span', null, '▶'), '发送')
          )
        )
      );
    }
    
    // 注册路由
    if (QP.menu && QP.menu.add && QP.route && QP.route.add) {
      QP.menu.add('team_chat', [
        { id: 'team_chat.ai_group', location: 'primary.team_chat', label: '🤖 AI 群聊', icon: '💬', route: 'team_chat.ai_group', order: 10 }
      ]);
      QP.route.add('team_chat', [
        { id: 'team_chat.ai_group', path: '/plugin/team_chat/ai_group', component: AIGroupChatPage }
      ]);
      console.log('[AIChat] AI群聊模块已注册 (小红书风格)');
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIGroupChat);
  } else {
    initAIGroupChat();
  }
})();
