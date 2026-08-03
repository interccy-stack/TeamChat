/**
 * AI投票系统前端组件 v1.0.0
 * TeamChat子模块
 */

(function() {
  'use strict';
  
  // 检查依赖
  if (!window.QwenPaw) {
    console.error('[AI投票] 需要QwenPaw环境');
    return;
  }
  
  const QP = window.QwenPaw;
  const React = QP.host.React;
  const antd = QP.host.antd;
  const e = React.createElement;
  const { useState, useEffect, useCallback } = React;
  const { Modal, Button, Input, Select, Slider, Card, Progress, Timeline, Tag, Space, Tabs, Table, Alert } = antd;
  
  // API基础路径
  const API_BASE = '/api/plugins/team_chat/ai-voting';
  
  /**
   * 创建投票模态框
   */
  const CreateVoteModal = ({ visible, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState([
      { id: 'opt1', text: '', description: '' },
      { id: 'opt2', text: '', description: '' }
    ]);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [weights, setWeights] = useState({});
    const [duration, setDuration] = useState(180);
    const [consensusThreshold, setConsensusThreshold] = useState(70);
    const [availableAgents, setAvailableAgents] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 加载可用智能体
    useEffect(() => {
      if (visible) {
        fetchAvailableAgents();
      }
    }, [visible]);
    
    const fetchAvailableAgents = async () => {
      try {
        const res = await fetch(`${API_BASE}/agents`);
        const data = await res.json();
        setAvailableAgents(data.agents || []);
        
        // 默认选中所有，权重平均分配
        const allAgentIds = data.agents.map(a => a.agent_id);
        setSelectedAgents(allAgentIds);
        
        const defaultWeights = {};
        const equalWeight = 100 / data.agents.length;
        data.agents.forEach(a => {
          defaultWeights[a.agent_id] = Math.round(equalWeight);
        });
        setWeights(defaultWeights);
      } catch (err) {
        console.error('[AI投票] 加载智能体失败:', err);
      }
    };
    
    const handleAddOption = () => {
      const newId = `opt${options.length + 1}`;
      setOptions([...options, { id: newId, text: '', description: '' }]);
    };
    
    const handleRemoveOption = (index) => {
      if (options.length <= 2) return;
      setOptions(options.filter((_, i) => i !== index));
    };
    
    const handleOptionChange = (index, field, value) => {
      const newOptions = [...options];
      newOptions[index][field] = value;
      setOptions(newOptions);
    };
    
    const handleWeightChange = (agentId, value) => {
      setWeights({ ...weights, [agentId]: value });
    };
    
    const handleCreate = async () => {
      if (!title.trim()) {
        alert('请输入投票主题');
        return;
      }
      
      const validOptions = options.filter(o => o.text.trim());
      if (validOptions.length < 2) {
        alert('至少需要2个有效选项');
        return;
      }
      
      if (selectedAgents.length === 0) {
        alert('请至少选择1个智能体');
        return;
      }
      
      setLoading(true);
      
      try {
        const config = {
          title: title,
          options: validOptions.map(o => ({
            id: o.id,
            text: o.text,
            description: o.description
          })),
          agents: selectedAgents.map(agentId => ({
            agent_id: agentId,
            weight: weights[agentId] / 100
          })),
          negotiation_duration: duration,
          consensus_threshold: consensusThreshold / 100
        };
        
        const res = await fetch(`${API_BASE}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        
        const data = await res.json();
        
        if (data.vote_id) {
          onCreate(data.vote_id);
          onClose();
          // 重置表单
          setTitle('');
          setOptions([{ id: 'opt1', text: '' }, { id: 'opt2', text: '' }]);
        }
      } catch (err) {
        console.error('[AI投票] 创建失败:', err);
        alert('创建投票失败: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    return e(Modal, {
      title: '🗳️ 创建AI投票',
      visible: visible,
      onCancel: onClose,
      width: 700,
      footer: null,
      destroyOnClose: true
    }, [
      e('div', { style: { padding: '16px 0' } }, [
        // 投票主题
        e('div', { style: { marginBottom: 16 } }, [
          e('label', { style: { fontWeight: 'bold', marginBottom: 8, display: 'block' } }, '📋 投票主题'),
          e(Input, {
            placeholder: '输入投票主题，例如：选择最佳技术方案',
            value: title,
            onChange: (e) => setTitle(e.target.value),
            size: 'large'
          })
        ]),
        
        // 选项
        e('div', { style: { marginBottom: 16 } }, [
          e('label', { style: { fontWeight: 'bold', marginBottom: 8, display: 'block' } }, '📝 投票选项'),
          ...options.map((opt, idx) => e('div', {
            key: opt.id,
            style: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }
          }, [
            e('span', { style: { color: '#999', width: 24 } }, `${idx + 1}.`),
            e(Input, {
              placeholder: `选项 ${idx + 1}`,
              value: opt.text,
              onChange: (e) => handleOptionChange(idx, 'text', e.target.value),
              style: { flex: 1 }
            }),
            e(Input, {
              placeholder: '描述（可选）',
              value: opt.description,
              onChange: (e) => handleOptionChange(idx, 'description', e.target.value),
              style: { flex: 1 }
            }),
            options.length > 2 && e(Button, {
              type: 'text',
              danger: true,
              onClick: () => handleRemoveOption(idx),
              children: '✕'
            })
          ])),
          e(Button, {
            type: 'dashed',
            onClick: handleAddOption,
            style: { width: '100%' },
            children: '+ 添加选项'
          })
        ]),
        
        // 智能体选择
        e('div', { style: { marginBottom: 16 } }, [
          e('label', { style: { fontWeight: 'bold', marginBottom: 8, display: 'block' } }, '🤖 参与智能体'),
          e(Select, {
            mode: 'multiple',
            placeholder: '选择参与投票的智能体',
            value: selectedAgents,
            onChange: setSelectedAgents,
            style: { width: '100%' },
            options: availableAgents.map(a => ({
              value: a.agent_id,
              label: `${a.name} (${a.role})`
            }))
          })
        ]),
        
        // 权重配置
        selectedAgents.length > 0 && e('div', { style: { marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 } }, [
          e('label', { style: { fontWeight: 'bold', marginBottom: 12, display: 'block' } }, '⚖️ 权重配置（总和应为100%）'),
          ...selectedAgents.map(agentId => {
            const agent = availableAgents.find(a => a.agent_id === agentId);
            return e('div', { key: agentId, style: { marginBottom: 12 } }, [
              e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 } }, [
                e('span', null, agent?.name || agentId),
                e('span', { style: { fontWeight: 'bold', color: '#667eea' } }, `${weights[agentId] || 0}%`)
              ]),
              e(Slider, {
                value: weights[agentId] || 0,
                onChange: (v) => handleWeightChange(agentId, v),
                min: 0,
                max: 100,
                tooltip: { formatter: (v) => `${v}%` }
              })
            ]);
          })
        ]),
        
        // 高级设置
        e('div', { style: { marginBottom: 16 } }, [
          e('label', { style: { fontWeight: 'bold', marginBottom: 8, display: 'block' } }, '⚙️ 高级设置'),
          e('div', { style: { display: 'flex', gap: 16 } }, [
            e('div', { style: { flex: 1 } }, [
              e('div', { style: { marginBottom: 4, color: '#666' } }, '⏱️ 协商时长'),
              e(Select, {
                value: duration,
                onChange: setDuration,
                style: { width: '100%' },
                options: [
                  { value: 60, label: '1分钟' },
                  { value: 180, label: '3分钟' },
                  { value: 300, label: '5分钟' },
                  { value: 600, label: '10分钟' }
                ]
              })
            ]),
            e('div', { style: { flex: 1 } }, [
              e('div', { style: { marginBottom: 4, color: '#666' } }, '📊 共识阈值'),
              e(Slider, {
                value: consensusThreshold,
                onChange: setConsensusThreshold,
                min: 50,
                max: 100,
                tooltip: { formatter: (v) => `${v}%` }
              })
            ])
          ])
        ]),
        
        // 按钮
        e(Space, { style: { width: '100%', justifyContent: 'flex-end' } }, [
          e(Button, { onClick: onClose, children: '取消' }),
          e(Button, {
            type: 'primary',
            onClick: handleCreate,
            loading: loading,
            children: '发起AI投票'
          })
        ])
      ])
    ]);
  };
  
  /**
   * 投票进度组件
   */
  const VoteProgress = ({ voteId }) => {
    const [vote, setVote] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      fetchVoteStatus();
      const interval = setInterval(fetchVoteStatus, 2000);
      return () => clearInterval(interval);
    }, [voteId]);
    
    const fetchVoteStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/vote/${voteId}`);
        const data = await res.json();
        setVote(data);
        setLoading(false);
      } catch (err) {
        console.error('[AI投票] 获取状态失败:', err);
      }
    };
    
    if (loading || !vote) {
      return e('div', { style: { textAlign: 'center', padding: 40 } }, '加载中...');
    }
    
    const statusMap = {
      'created': { text: '已创建', color: 'default' },
      'analyzing': { text: '分析中', color: 'processing' },
      'negotiating': { text: '协商中', color: 'warning' },
      'voting': { text: '投票中', color: 'blue' },
      'completed': { text: '已完成', color: 'success' },
      'cancelled': { text: '已取消', color: 'error' }
    };
    
    const status = statusMap[vote.status] || { text: vote.status, color: 'default' };
    
    return e(Card, {
      title: e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
        e('span', null, `🗳️ ${vote.title}`),
        e(Tag, { color: status.color }, status.text)
      ]),
      style: { marginBottom: 16 }
    }, [
      // 进度条
      vote.status === 'analyzing' && e('div', { style: { marginBottom: 16 } }, [
        e('div', { style: { marginBottom: 8 } }, '🤖 智能体分析中...'),
        e(Progress, { percent: 50, status: 'active' })
      ]),
      
      vote.status === 'negotiating' && e('div', { style: { marginBottom: 16 } }, [
        e('div', { style: { marginBottom: 8 } }, `💬 AI协商中... 共识度: ${(vote.consensus_level * 100).toFixed(1)}%`),
        e(Progress, { percent: vote.consensus_level * 100, status: 'active', strokeColor: '#52c41a' })
      ]),
      
      // 投票结果
      vote.status === 'completed' && e('div', null, [
        e('div', { style: { marginBottom: 16 } }, [
          e('div', { style: { fontWeight: 'bold', marginBottom: 8 } }, '🏆 投票结果'),
          ...vote.options.map((opt, idx) => e('div', {
            key: opt.id,
            style: {
              marginBottom: 12,
              padding: 12,
              background: opt.id === vote.winner ? '#f6ffed' : '#f5f5f5',
              borderRadius: 8,
              border: opt.id === vote.winner ? '1px solid #52c41a' : 'none'
            }
          }, [
            e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 } }, [
              e('span', { style: { fontWeight: 'bold' } }, `${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''} ${opt.text}`),
              e('span', { style: { color: '#667eea', fontWeight: 'bold' } }, `${opt.weighted_votes.toFixed(2)}票`)
            ]),
            e(Progress, {
              percent: (opt.weighted_votes / vote.options.reduce((a, b) => a + b.weighted_votes, 0) * 100),
              strokeColor: opt.id === vote.winner ? '#52c41a' : '#667eea',
              showInfo: false
            }),
            e('div', { style: { fontSize: 12, color: '#666', marginTop: 4 } },
              `${opt.votes}个智能体支持: ${opt.voters.join(', ')}`
            )
          ]))
        ]),
        
        // 共识度
        e('div', { style: { marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 8 } }, [
          e('div', { style: { fontWeight: 'bold', marginBottom: 8 } }, '📊 共识度分析'),
          e('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } }, [
            e('span', null, '整体共识度:'),
            e('span', { style: { fontSize: 24, fontWeight: 'bold', color: vote.consensus_level >= 0.7 ? '#52c41a' : vote.consensus_level >= 0.5 ? '#faad14' : '#f5222d' } },
              `${(vote.consensus_level * 100).toFixed(1)}%`
            )
          ]),
          e(Progress, {
            percent: vote.consensus_level * 100,
            status: vote.consensus_level >= 0.7 ? 'success' : vote.consensus_level >= 0.5 ? 'normal' : 'exception'
          })
        ]),
        
        // 查看报告按钮
        e(Button, {
          type: 'primary',
          onClick: () => window.open(`${API_BASE}/report/${voteId}`, '_blank'),
          children: '📄 查看完整报告'
        })
      ])
    ]);
  };
  
  /**
   * AI投票主组件
   */
  const AIVotingPanel = () => {
    const [votes, setVotes] = useState([]);
    const [createVisible, setCreateVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      fetchVotes();
    }, []);
    
    const fetchVotes = async () => {
      try {
        const res = await fetch(`${API_BASE}/list`);
        const data = await res.json();
        setVotes(data.votes || []);
      } catch (err) {
        console.error('[AI投票] 获取列表失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const handleCreate = (voteId) => {
      fetchVotes();
    };
    
    return e('div', { style: { padding: 16 } }, [
      e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } }, [
        e('h2', { style: { margin: 0 } }, '🗳️ AI投票'),
        e(Button, {
          type: 'primary',
          onClick: () => setCreateVisible(true),
          children: '+ 创建投票'
        })
      ]),
      
      e('div', { style: { marginBottom: 16, color: '#666' } },
        '纯智能体投票系统，AI自主协商决策，人类仅可发起和观察'
      ),
      
      // 投票列表
      loading ? e('div', { style: { textAlign: 'center', padding: 40 } }, '加载中...') :
      votes.length === 0 ? e('div', { style: { textAlign: 'center', padding: 40, color: '#999' } },
        '暂无投票，点击"创建投票"发起第一个AI投票'
      ) : e('div', null,
        votes.map(vote => e(VoteProgress, { key: vote.id, voteId: vote.id }))
      ),
      
      // 创建模态框
      e(CreateVoteModal, {
        visible: createVisible,
        onClose: () => setCreateVisible(false),
        onCreate: handleCreate
      })
    ]);
  };
  
  // 注册到TeamChat
  if (QP.menu && QP.menu.add) {
    QP.menu.add('team_chat', [
      {
        path: '/plugin/team-chat/ai-voting',
        label: 'AI投票',
        icon: '🗳️',
        component: AIVotingPanel
      }
    ]);
    console.log('[AI投票] 已注册到TeamChat菜单');
  }
  
  // 暴露全局API
  window.AIVoting = {
    openCreateModal: () => {
      // 触发创建投票
      const event = new CustomEvent('ai-voting-open-create');
      window.dispatchEvent(event);
    },
    getVoteStatus: async (voteId) => {
      const res = await fetch(`${API_BASE}/vote/${voteId}`);
      return res.json();
    }
  };
  
  console.log('[AI投票] 前端组件已加载 v1.0.0');
})();
