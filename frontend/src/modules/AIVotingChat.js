/**
 * AI群聊投票集成组件
 * 在AI群聊和圆桌会议中发起投票
 */

(function() {
  'use strict';
  
  if (!window.QwenPaw) return;
  
  const QP = window.QwenPaw;
  const React = QP.host.React;
  const e = React.createElement;
  
  const API_BASE = '/api/plugins/team_chat/ai-voting';
  
  /**
   * 检测消息中的投票意图
   */
  const detectVotingIntent = (message) => {
    const keywords = ['发起投票', '我们投票', '大家投票', '投票决定', '投票选择', '来投票', '投个票'];
    return keywords.some(kw => message.includes(kw));
  };
  
  /**
   * 解析投票内容
   */
  const parseVoteContent = (message) => {
    // 提取主题
    const titleMatch = message.match(/[:：]\s*(.+?)[，,。.]/);
    const title = titleMatch ? titleMatch[1].trim() : '群聊投票';
    
    // 提取选项
    const options = [];
    const patterns = [
      /[，,。]\s*([^，,。]+?)(?:[，,。]|$)/g,
      /(\d+[\.\、])\s*([^\d]+?)(?=\d+[\.\、]|$)/g
    ];
    
    for (const pattern of patterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        const text = match[1] || match[0];
        if (text && text.length > 2 && !options.includes(text)) {
          options.push(text.slice(0, 50));
        }
      }
      if (options.length >= 2) break;
    }
    
    // 默认选项
    if (options.length < 2) {
      return { title: '是否同意', options: ['赞成', '反对'] };
    }
    
    return { title, options };
  };
  
  /**
   * 创建群聊投票卡片
   */
  const createVoteCard = (voteData) => {
    return e('div', {
      className: 'ai-vote-card',
      style: {
        margin: '12px 0',
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white'
      }
    }, [
      e('div', { style: { fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' } }, 
        '🗳️ ' + voteData.title
      ),
      e('div', { style: { fontSize: '14px', opacity: 0.9, marginBottom: '12px' } },
        'AI智能体正在协商投票中...'
      ),
      e('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
        voteData.options.map((opt, i) => e('div', {
          key: i,
          style: {
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '13px'
          }
        }, opt))
      ),
      e('div', { 
        style: { 
          marginTop: '12px', 
          fontSize: '12px', 
          opacity: 0.8,
          display: 'flex',
          justifyContent: 'space-between'
        } 
      }, [
        e('span', null, `参与智能体: ${voteData.participants?.length || 0}个`),
        e('span', { 
          style: { cursor: 'pointer', textDecoration: 'underline' },
          onClick: () => window.open(`${API_BASE}/vote/${voteData.vote_id}`, '_blank')
        }, '查看详情 →')
      ])
    ]);
  };
  
  /**
   * 创建投票结果卡片
   */
  const createVoteResultCard = (result) => {
    const winner = result.winner;
    const consensus = Math.round(result.consensus * 100);
    
    return e('div', {
      className: 'ai-vote-result-card',
      style: {
        margin: '12px 0',
        padding: '16px',
        background: '#f6ffed',
        border: '1px solid #52c41a',
        borderRadius: '12px'
      }
    }, [
      e('div', { style: { fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#52c41a' } }, 
        '✅ 投票完成'
      ),
      e('div', { style: { fontSize: '16px', marginBottom: '8px' } }, 
        `🏆 获胜方案：${winner}`
      ),
      e('div', { style: { fontSize: '14px', color: '#666', marginBottom: '12px' } },
        `🤝 共识度：${consensus}%`
      ),
      e('div', { 
        style: { 
          padding: '12px',
          background: 'white',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: '1.6',
          whiteSpace: 'pre-line'
        } 
      }, result.summary)
    ]);
  };
  
  /**
   * 群聊投票处理器
   */
  const GroupChatVotingHandler = {
    // 存储活跃投票
    activeVotes: {},
    
    /**
     * 处理群聊消息
     */
    async handleMessage(sessionId, agentId, agentName, message, participants) {
      if (!detectVotingIntent(message)) {
        return null;
      }
      
      console.log('[群聊投票] 检测到投票意图:', agentName);
      
      // 解析投票内容
      const { title, options } = parseVoteContent(message);
      
      // 构建配置
      const config = {
        title: title,
        options: options.map((opt, i) => ({ id: `opt${i+1}`, text: opt })),
        agents: participants
          .filter(p => p.type === 'agent')
          .map(p => ({ agent_id: p.id, name: p.name, role: p.role || '参与者' })),
        negotiation_duration: 120,
        consensus_threshold: 0.6
      };
      
      try {
        // 创建投票
        const res = await fetch(`${API_BASE}/group-chat/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, config })
        });
        
        const data = await res.json();
        
        if (data.success) {
          this.activeVotes[sessionId] = data.vote_id;
          
          return {
            type: 'vote_created',
            vote_id: data.vote_id,
            title: title,
            options: options,
            participants: config.agents.map(a => a.name),
            message: `🗳️ ${agentName} 发起了投票：${title}`
          };
        }
      } catch (err) {
        console.error('[群聊投票] 创建失败:', err);
      }
      
      return null;
    },
    
    /**
     * 检查投票状态
     */
    async checkVoteStatus(sessionId) {
      const voteId = this.activeVotes[sessionId];
      if (!voteId) return null;
      
      try {
        const res = await fetch(`${API_BASE}/group-chat/status/${sessionId}`);
        const data = await res.json();
        
        if (data.has_vote && data.type === 'vote_completed') {
          // 投票完成，显示结果
          delete this.activeVotes[sessionId];
          return createVoteResultCard(data);
        }
        
        return null;
      } catch (err) {
        console.error('[群聊投票] 获取状态失败:', err);
        return null;
      }
    },
    
    /**
     * 手动创建投票（通过UI）
     */
    async createManualVote(sessionId, config) {
      try {
        const res = await fetch(`${API_BASE}/group-chat/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, config })
        });
        
        const data = await res.json();
        
        if (data.success) {
          this.activeVotes[sessionId] = data.vote_id;
          return data;
        }
      } catch (err) {
        console.error('[群聊投票] 手动创建失败:', err);
      }
      
      return null;
    }
  };
  
  /**
   * 圆桌会议投票
   */
  const RoundTableVoting = {
    /**
     * 为议题创建投票
     */
    async createVote(topic, options, participants) {
      try {
        const res = await fetch(`${API_BASE}/roundtable/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, options, participants })
        });
        
        return await res.json();
      } catch (err) {
        console.error('[圆桌投票] 创建失败:', err);
        return null;
      }
    },
    
    /**
     * 获取投票总结
     */
    async getSummary(topic) {
      try {
        const res = await fetch(`${API_BASE}/roundtable/summary/${encodeURIComponent(topic)}`);
        const data = await res.json();
        return data.summary;
      } catch (err) {
        console.error('[圆桌投票] 获取总结失败:', err);
        return null;
      }
    }
  };
  
  // 暴露到全局
  window.AIVotingChat = {
    GroupChatVotingHandler,
    RoundTableVoting,
    detectVotingIntent,
    parseVoteContent,
    createVoteCard,
    createVoteResultCard
  };
  
  console.log('[AI群聊投票] 集成组件已加载');
})();
