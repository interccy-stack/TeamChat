/**
 * AI决策主页面组件 v5.3.2
 * 部署到主界面的AI协作旁边
 */

(function() {
  'use strict';
  
  if (!window.QwenPaw) {
    console.error('[AI投票页面] 需要QwenPaw环境');
    return;
  }
  
  const QP = window.QwenPaw;
  const React = QP.host.React;
  const antd = QP.host.antd;
  const e = React.createElement;
  const { useState, useEffect, useCallback } = React;
  const { 
    Layout, Menu, Card, Button, Input, Select, Slider, 
    Table, Tag, Progress, Timeline, Statistic, Row, Col,
    Modal, Form, Radio, Steps, Alert, Empty, Spin, Tabs
  } = antd;
  
  const { Header, Content, Sider } = Layout;
  const { TabPane } = Tabs;
  const { Step } = Steps;
  
  const API_BASE = '/api/plugins/team_chat/ai-voting';
  
  /**
   * AI投票主页面
   */
  const AIVotingPage = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [votes, setVotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVote, setSelectedVote] = useState(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    
    // 加载投票列表
    useEffect(() => {
      fetchVotes();
    }, []);
    
    const fetchVotes = async () => {
      try {
        const res = await fetch(`${API_BASE}/list`);
        const data = await res.json();
        setVotes(data.votes || []);
      } catch (err) {
        console.error('[AI投票] 加载失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // 投票列表列定义
    const columns = [
      {
        title: '投票主题',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => e('div', null, [
          e('div', { style: { fontWeight: 'bold' } }, text),
          e('div', { style: { fontSize: '12px', color: '#999' } }, 
            `ID: ${record.id.slice(0, 8)}...`
          )
        ])
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const statusMap = {
            'created': { color: 'default', text: '已创建' },
            'analyzing': { color: 'processing', text: '分析中' },
            'negotiating': { color: 'warning', text: '协商中' },
            'voting': { color: 'blue', text: '投票中' },
            'completed': { color: 'success', text: '已完成' },
            'cancelled': { color: 'error', text: '已取消' }
          };
          const s = statusMap[status] || { color: 'default', text: status };
          return e(Tag, { color: s.color }, s.text);
        }
      },
      {
        title: '参与智能体',
        dataIndex: 'agents',
        key: 'agents',
        render: (agents) => e('span', null, `${agents?.length || 0}个`)
      },
      {
        title: '共识度',
        dataIndex: 'consensus_level',
        key: 'consensus_level',
        render: (level) => level ? `${(level * 100).toFixed(0)}%` : '-'
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (time) => time ? new Date(time * 1000).toLocaleString() : '-'
      },
      {
        title: '操作',
        key: 'action',
        render: (_, record) => e('div', null, [
          e(Button, {
            type: 'link',
            size: 'small',
            onClick: () => setSelectedVote(record),
            children: '查看'
          }),
          record.status === 'completed' && e(Button, {
            type: 'link',
            size: 'small',
            onClick: () => window.open(`${API_BASE}/report/${record.id}/markdown`, '_blank'),
            children: '报告'
          })
        ])
      }
    ];
    
    // 统计卡片
    const StatisticsCards = () => e(Row, { gutter: 16, style: { marginBottom: 24 } }, [
      e(Col, { span: 6 }, e(Card, null, e(Statistic, {
        title: '总投票数',
        value: votes.length,
        prefix: '🗳️'
      }))),
      e(Col, { span: 6 }, e(Card, null, e(Statistic, {
        title: '进行中',
        value: votes.filter(v => ['analyzing', 'negotiating', 'voting'].includes(v.status)).length,
        prefix: '⏳',
        valueStyle: { color: '#faad14' }
      }))),
      e(Col, { span: 6 }, e(Card, null, e(Statistic, {
        title: '已完成',
        value: votes.filter(v => v.status === 'completed').length,
        prefix: '✅',
        valueStyle: { color: '#52c41a' }
      }))),
      e(Col, { span: 6 }, e(Card, null, e(Statistic, {
        title: '平均共识度',
        value: votes.filter(v => v.consensus_level).length > 0 
          ? (votes.filter(v => v.consensus_level).reduce((a, b) => a + b.consensus_level, 0) / votes.filter(v => v.consensus_level).length * 100).toFixed(0)
          : 0,
        suffix: '%',
        prefix: '🤝'
      })))
    ]);
    
    // 投票列表
    const VoteList = () => e('div', null, [
      e(StatisticsCards),
      e(Card, {
        title: e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          e('span', null, '📋 投票列表'),
          e(Button, {
            type: 'primary',
            icon: '+',
            onClick: () => setCreateModalVisible(true),
            children: '创建投票'
          })
        ])
      }, [
        loading ? e(Spin, { style: { display: 'block', textAlign: 'center', padding: 40 } }) :
        votes.length === 0 ? e(Empty, {
          description: '暂无投票',
          children: e(Button, {
            type: 'primary',
            onClick: () => setCreateModalVisible(true),
            children: '创建第一个投票'
          })
        }) : e(Table, {
          columns: columns,
          dataSource: votes,
          rowKey: 'id',
          pagination: { pageSize: 10 }
        })
      ])
    ]);
    
    // 创建投票模态框
    const CreateVoteModal = () => {
      const [form] = Form.useForm();
      const [step, setStep] = useState(0);
      const [availableAgents, setAvailableAgents] = useState([]);
      const [submitting, setSubmitting] = useState(false);
      
      useEffect(() => {
        fetchAvailableAgents();
      }, []);
      
      const fetchAvailableAgents = async () => {
        try {
          const res = await fetch(`${API_BASE}/agents`);
          const data = await res.json();
          setAvailableAgents(data.agents || []);
        } catch (err) {
          console.error('[AI投票] 加载智能体失败:', err);
        }
      };
      
      const steps = [
        { title: '基本信息', content: 'vote-info' },
        { title: '选择智能体', content: 'select-agents' },
        { title: '配置权重', content: 'configure-weights' },
        { title: '确认创建', content: 'confirm' }
      ];
      
      const handleSubmit = async () => {
        setSubmitting(true);
        try {
          const values = await form.validateFields();
          
          const config = {
            title: values.title,
            options: values.options.filter(o => o.text).map((o, i) => ({
              id: `opt${i+1}`,
              text: o.text,
              description: o.description || ''
            })),
            agents: values.agents.map(agentId => {
              const agent = availableAgents.find(a => a.agent_id === agentId);
              return {
                agent_id: agentId,
                name: agent?.name || agentId,
                role: agent?.role || '参与者',
                weight: values.weights?.[agentId] / 100 || 1 / values.agents.length
              };
            }),
            negotiation_duration: values.duration,
            consensus_threshold: values.threshold / 100
          };
          
          const res = await fetch(`${API_BASE}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
          
          const data = await res.json();
          
          if (data.vote_id) {
            setCreateModalVisible(false);
            form.resetFields();
            setStep(0);
            fetchVotes();
            setActiveTab('list');
          }
        } catch (err) {
          console.error('[AI投票] 创建失败:', err);
        } finally {
          setSubmitting(false);
        }
      };
      
      const renderStepContent = () => {
        switch (step) {
          case 0:
            return e('div', null, [
              e(Form.Item, {
                name: 'title',
                label: '📋 投票主题',
                rules: [{ required: true, message: '请输入投票主题' }]
              }, e(Input, { placeholder: '例如：选择最佳技术方案' })),
              
              e(Form.List, { name: 'options' }, (fields, { add, remove }) => e('div', null, [
                e('div', { style: { marginBottom: 8, fontWeight: 'bold' } }, '📝 投票选项'),
                ...fields.map((field, index) => e('div', { key: field.key, style: { display: 'flex', gap: 8, marginBottom: 8 } }, [
                  e(Form.Item, {
                    ...field,
                    name: [field.name, 'text'],
                    rules: [{ required: true, message: '请输入选项' }],
                    style: { flex: 1 }
                  }, e(Input, { placeholder: `选项 ${index + 1}` })),
                  e(Form.Item, {
                    ...field,
                    name: [field.name, 'description'],
                    style: { flex: 1 }
                  }, e(Input, { placeholder: '描述（可选）' })),
                  fields.length > 2 && e(Button, {
                    type: 'text',
                    danger: true,
                    onClick: () => remove(field.name),
                    children: '删除'
                  })
                ])),
                e(Button, {
                  type: 'dashed',
                  onClick: () => add(),
                  style: { width: '100%' },
                  children: '+ 添加选项'
                })
              ]))
            ]);
          
          case 1:
            return e(Form.Item, {
              name: 'agents',
              label: '🤖 选择参与投票的智能体',
              rules: [{ required: true, message: '请至少选择1个智能体' }]
            }, e(Select, {
              mode: 'multiple',
              placeholder: '选择智能体',
              style: { width: '100%' },
              options: availableAgents.map(a => ({
                value: a.agent_id,
                label: `${a.name} (${a.role})`,
                expertise: a.expertise
              }))
            }));
          
          case 2:
            return e(Form.Item, { shouldUpdate: (prev, curr) => prev.agents !== curr.agents },
              ({ getFieldValue }) => {
                const selectedAgents = getFieldValue('agents') || [];
                return e('div', null, [
                  e('div', { style: { marginBottom: 16, fontWeight: 'bold' } }, '⚖️ 配置权重'),
                  ...selectedAgents.map(agentId => {
                    const agent = availableAgents.find(a => a.agent_id === agentId);
                    return e(Form.Item, {
                      key: agentId,
                      name: ['weights', agentId],
                      label: `${agent?.name || agentId}`,
                      initialValue: Math.round(100 / selectedAgents.length)
                    }, e(Slider, {
                      min: 0,
                      max: 100,
                      tooltip: { formatter: v => `${v}%` }
                    }));
                  }),
                  e(Form.Item, {
                    name: 'duration',
                    label: '⏱️ 协商时长',
                    initialValue: 180
                  }, e(Select, {
                    options: [
                      { value: 60, label: '1分钟' },
                      { value: 180, label: '3分钟' },
                      { value: 300, label: '5分钟' },
                      { value: 600, label: '10分钟' }
                    ]
                  })),
                  e(Form.Item, {
                    name: 'threshold',
                    label: '📊 共识阈值',
                    initialValue: 70
                  }, e(Slider, {
                    min: 50,
                    max: 100,
                    tooltip: { formatter: v => `${v}%` }
                  }))
                ]);
              }
            );
          
          case 3:
            return e(Form.Item, { shouldUpdate: true },
              ({ getFieldsValue }) => {
                const values = getFieldsValue();
                return e('div', { style: { padding: 16, background: '#f5f5f5', borderRadius: 8 } }, [
                  e('h4', null, '📋 投票配置确认'),
                  e('div', { style: { marginBottom: 8 } }, [
                    e('strong', null, '主题: '),
                    e('span', null, values.title || '未填写')
                  ]),
                  e('div', { style: { marginBottom: 8 } }, [
                    e('strong', null, '选项: '),
                    e('div', null, (values.options || []).filter(o => o.text).map((o, i) => 
                      e('div', { key: i, style: { marginLeft: 16 } }, `${i + 1}. ${o.text}`)
                    ))
                  ]),
                  e('div', { style: { marginBottom: 8 } }, [
                    e('strong', null, '智能体: '),
                    e('span', null, (values.agents || []).length > 0 
                      ? `${values.agents.length}个智能体`
                      : '未选择'
                    )
                  ]),
                  e('div', { style: { marginBottom: 8 } }, [
                    e('strong', null, '协商时长: '),
                    e('span', null, `${values.duration || 180}秒`)
                  ]),
                  e('div', null, [
                    e('strong', null, '共识阈值: '),
                    e('span', null, `${values.threshold || 70}%`)
                  ])
                ]);
              }
            );
          
          default:
            return null;
        }
      };
      
      return e(Modal, {
        title: '🗳️ 创建AI投票',
        visible: createModalVisible,
        onCancel: () => {
          setCreateModalVisible(false);
          setStep(0);
          form.resetFields();
        },
        width: 700,
        footer: null,
        destroyOnClose: true
      }, [
        e(Form, { form, layout: 'vertical' }, [
          e(Steps, { current: step, style: { marginBottom: 24 } },
            steps.map(s => e(Step, { key: s.title, title: s.title }))
          ),
          e('div', { style: { minHeight: 300 } }, renderStepContent()),
          e('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 24 } }, [
            e(Button, {
              disabled: step === 0,
              onClick: () => setStep(step - 1),
              children: '上一步'
            }),
            step < steps.length - 1 ? e(Button, {
              type: 'primary',
              onClick: () => setStep(step + 1),
              children: '下一步'
            }) : e(Button, {
              type: 'primary',
              loading: submitting,
              onClick: handleSubmit,
              children: '创建投票'
            })
          ])
        ])
      ]);
    };
    
    // 决策动画面板
    const AnimationPanel = () => {
      const [animVotes, setAnimVotes] = useState([]);
      const [animLoading, setAnimLoading] = useState(false);
      const [currentAnim, setCurrentAnim] = useState(null);
      const [animStage, setAnimStage] = useState(0);
      const [animStages, setAnimStages] = useState([]);

      useEffect(() => {
        const completed = votes.filter(v => v.status === 'completed');
        setAnimVotes(completed);
      }, [votes]);

      const startAnimation = async (voteId) => {
        setAnimLoading(true);
        try {
          const res = await fetch(`${API_BASE}/animation/start?vote_id=${voteId}`);
          const data = await res.json();
          if (data.animation_id) {
            setCurrentAnim(data);
            setAnimStage(0);
            setAnimStages(data.stages || []);
          }
        } catch (err) {
          console.error('[动画] 启动失败:', err);
        } finally {
          setAnimLoading(false);
        }
      };

      const getStageColor = (stage) => {
        const colors = { analysis: '#1890ff', negotiation: '#faad14', voting: '#52c41a', result: '#722ed1' };
        return colors[stage?.type] || '#999';
      };

      const getStageIcon = (stage) => {
        const icons = { analysis: '🔍', negotiation: '💬', voting: '🗳️', result: '🏆' };
        return icons[stage?.type] || '⏳';
      };

      return e('div', { style: { padding: '16px 0' } }, [
        e('div', { style: { marginBottom: 16 } }, [
          e('h3', null, '🎬 AI决策过程动画'),
          e('p', { style: { color: '#666' } }, '选择已完成的决策，观看AI协商投票的完整过程')
        ]),
        animVotes.length === 0
          ? e(Empty, { description: '暂无已完成的决策，请先创建并完成一个AI投票' })
          : e('div', null, [
              !currentAnim && e('div', null, [
                e('h4', { style: { marginBottom: 12 } }, '选择决策开始动画'),
                ...animVotes.map(v => e(Card, {
                  key: v.id,
                  style: { marginBottom: 12, cursor: 'pointer' },
                  onClick: () => startAnimation(v.id),
                  hoverable: true
                }, [
                  e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                    e('div', null, [
                      e('div', { style: { fontWeight: 'bold' } }, v.title),
                      e('div', { style: { fontSize: '12px', color: '#999' } }, 
                        `共识度: ${(v.consensus_level * 100).toFixed(0)}% · ${v.agents?.length || 0}个智能体参与`
                      )
                    ]),
                    e(Button, { type: 'primary', loading: animLoading, icon: '▶️' }, '播放')
                  ])
                ]))
              ]),
              currentAnim && e('div', { style: { textAlign: 'center' } }, [
                e('div', { style: { marginBottom: 24 } }, [
                  e('h3', null, `${getStageIcon(animStages[animStage])} ${animStages[animStage]?.name || '加载中...'}`),
                  e('p', { style: { color: '#666' } }, animStages[animStage]?.description || '')
                ]),
                e(Steps, { 
                  current: animStage,
                  direction: 'vertical',
                  style: { maxWidth: 600, margin: '0 auto', textAlign: 'left' }
                }, animStages.map((s, i) => e(Step, {
                  key: i,
                  title: `${getStageIcon(s)} ${s.name}`,
                  description: s.description,
                  status: i < animStage ? 'finish' : i === animStage ? 'process' : 'wait'
                }))),
                e('div', { style: { marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 } }, [
                  e(Button, {
                    disabled: animStage <= 0,
                    onClick: () => setAnimStage(animStage - 1)
                  }, '⏮️ 上一步'),
                  e(Button, {
                    type: 'primary',
                    disabled: animStage >= animStages.length - 1,
                    onClick: () => setAnimStage(animStage + 1)
                  }, '下一步 ⏭️'),
                  e(Button, { onClick: () => { setCurrentAnim(null); setAnimStage(0); } }, '❌ 关闭')
                ])
              ])
            ])
      ]);
    };

    // 专家配置面板
    const ExpertConfigPanel = () => {
      const [experts, setExperts] = useState([]);
      const [expertTypes, setExpertTypes] = useState([]);
      const [expertLoading, setExpertLoading] = useState(false);
      const [expertModal, setExpertModal] = useState(false);
      const [editingExpert, setEditingExpert] = useState(null);
      const [recommendTopic, setRecommendTopic] = useState('');
      const [recommendations, setRecommendations] = useState([]);

      const fetchExperts = async () => {
        setExpertLoading(true);
        try {
          const [expRes, typeRes] = await Promise.all([
            fetch(`${API_BASE}/experts`),
            fetch(`${API_BASE}/experts/types`)
          ]);
          const expData = await expRes.json();
          const typeData = await typeRes.json();
          setExperts(expData.experts || []);
          setExpertTypes(typeData.types || []);
        } catch (err) {
          console.error('[专家] 加载失败:', err);
        } finally {
          setExpertLoading(false);
        }
      };

      useEffect(() => { fetchExperts(); }, []);

      const saveExpert = async (values) => {
        try {
          const url = editingExpert ? `${API_BASE}/experts/update` : `${API_BASE}/experts/create`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...values, id: editingExpert?.id })
          });
          if (res.ok) {
            setExpertModal(false);
            setEditingExpert(null);
            fetchExperts();
          }
        } catch (err) {
          console.error('[专家] 保存失败:', err);
        }
      };

      const deleteExpert = async (id) => {
        try {
          await fetch(`${API_BASE}/experts/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          fetchExperts();
        } catch (err) {
          console.error('[专家] 删除失败:', err);
        }
      };

      const recommendExperts = async () => {
        if (!recommendTopic.trim()) return;
        try {
          const res = await fetch(`${API_BASE}/experts/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: recommendTopic })
          });
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        } catch (err) {
          console.error('[专家] 推荐失败:', err);
        }
      };

      const expertColumns = [
        { title: '名称', dataIndex: 'name', key: 'name' },
        { title: '类型', dataIndex: 'type', key: 'type', render: t => e(Tag, { color: 'blue' }, t) },
        { title: '等级', dataIndex: 'level', key: 'level', render: l => e(Tag, { color: l === 'senior' ? 'gold' : l === 'expert' ? 'green' : 'default' }, l) },
        { title: '专长', dataIndex: 'expertise', key: 'expertise', render: ex => e('span', null, (ex || []).map(e => e(Tag, { key: e, size: 'small' }, e))) },
        { title: '权重', dataIndex: 'weight', key: 'weight', render: w => `${(w * 100).toFixed(0)}%` },
        { title: '操作', key: 'action', render: (_, record) => e('div', null, [
          e(Button, { type: 'link', size: 'small', onClick: () => { setEditingExpert(record); setExpertModal(true); } }, '编辑'),
          e(Button, { type: 'link', danger: true, size: 'small', onClick: () => deleteExpert(record.id) }, '删除')
        ]) }
      ];

      return e('div', { style: { padding: '16px 0' } }, [
        e('div', { style: { marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          e('div', null, [
            e('h3', null, '👨‍🔬 决策分析专家配置'),
            e('p', { style: { color: '#666', margin: 0 } }, '配置参与AI决策的专家智能体，设置专长和权重')
          ]),
          e(Button, { type: 'primary', onClick: () => { setEditingExpert(null); setExpertModal(true); } }, '+ 添加专家')
        ]),

        // 智能推荐
        e(Card, { title: '💡 智能推荐', style: { marginBottom: 16 } }, [
          e('div', { style: { display: 'flex', gap: 8 } }, [
            e(Input, {
              placeholder: '输入决策主题，例如：技术选型、风险评估...',
              value: recommendTopic,
              onChange: e => setRecommendTopic(e.target.value),
              style: { flex: 1 },
              onPressEnter: recommendExperts
            }),
            e(Button, { type: 'primary', onClick: recommendExperts }, '推荐')
          ]),
          recommendations.length > 0 && e('div', { style: { marginTop: 12 } }, [
            e('h4', null, '推荐专家:'),
            ...recommendations.map(r => e(Tag, { key: r.id, color: 'green', style: { margin: 4 } }, `${r.name} (${r.type})`))
          ])
        ]),

        // 专家列表
        e(Card, { title: `已配置专家 (${experts.length})` }, [
          expertLoading
            ? e(Spin, { style: { display: 'block', textAlign: 'center', padding: 40 } })
            : e(Table, { columns: expertColumns, dataSource: experts, rowKey: 'id', size: 'small' })
        ]),

        // 添加/编辑模态框
        e(Modal, {
          title: editingExpert ? '编辑专家' : '添加专家',
          visible: expertModal,
          onCancel: () => { setExpertModal(false); setEditingExpert(null); },
          footer: null
        }, [
          e(Form, {
            layout: 'vertical',
            initialValues: editingExpert || { weight: 1.0, level: 'expert' },
            onFinish: saveExpert
          }, [
            e(Form.Item, { name: 'name', label: '专家名称', rules: [{ required: true }] },
              e(Input, { placeholder: '例如：技术架构专家' })),
            e(Form.Item, { name: 'type', label: '专家类型', rules: [{ required: true }] },
              e(Select, { options: expertTypes.map(t => ({ value: t.id, label: t.name })) })),
            e(Form.Item, { name: 'level', label: '专家等级' },
              e(Select, { options: [
                { value: 'junior', label: '初级' },
                { value: 'expert', label: '中级' },
                { value: 'senior', label: '高级' }
              ]})),
            e(Form.Item, { name: 'expertise', label: '专长领域' },
              e(Select, { mode: 'tags', placeholder: '输入专长标签' })),
            e(Form.Item, { name: 'weight', label: '决策权重' },
              e(Slider, { min: 0, max: 2, step: 0.1, tooltip: { formatter: v => `${v}x` } })),
            e(Form.Item, { name: 'description', label: '描述' },
              e(Input.TextArea, { rows: 3 })),
            e('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } }, [
              e(Button, { onClick: () => setExpertModal(false) }, '取消'),
              e(Button, { type: 'primary', htmlType: 'submit' }, '保存')
            ])
          ])
        ])
      ]);
    };

    // 投票详情
    const VoteDetail = () => {
      if (!selectedVote) return null;
      
      return e(Modal, {
        title: `🗳️ ${selectedVote.title}`,
        visible: !!selectedVote,
        onCancel: () => setSelectedVote(null),
        width: 800,
        footer: e(Button, { onClick: () => setSelectedVote(null) }, '关闭')
      }, [
        e('div', { style: { padding: '16px 0' } }, [
          // 状态与操作
          e('div', { style: { marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            e('div', null, [
              e('strong', null, '状态: '),
              e(Tag, { 
                color: selectedVote.status === 'completed' ? 'success' : 'processing' 
              }, selectedVote.status)
            ]),
            selectedVote.status === 'completed' && e(Button, {
              type: 'primary',
              size: 'small',
              onClick: () => {
                setSelectedVote(null);
                setActiveTab('animation');
              }
            }, '🎬 观看决策动画')
          ]),
          
          // 选项结果
          selectedVote.options && e('div', { style: { marginBottom: 16 } }, [
            e('h4', null, '📊 投票结果'),
            ...selectedVote.options.map((opt, i) => e('div', { 
              key: opt.id,
              style: { 
                marginBottom: 12, 
                padding: 12, 
                background: opt.id === selectedVote.winner ? '#f6ffed' : '#f5f5f5',
                borderRadius: 8,
                border: opt.id === selectedVote.winner ? '1px solid #52c41a' : 'none'
              }
            }, [
              e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } }, [
                e('span', { style: { fontWeight: 'bold' } }, 
                  `${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''} ${opt.text}`
                ),
                e('span', { style: { color: '#667eea' } }, 
                  `${opt.votes}票 (${opt.weighted_votes?.toFixed(2) || 0})`
                )
              ]),
              e(Progress, {
                percent: opt.weighted_votes > 0 
                  ? (opt.weighted_votes / selectedVote.options.reduce((a, b) => a + (b.weighted_votes || 0), 0) * 100)
                  : 0,
                strokeColor: opt.id === selectedVote.winner ? '#52c41a' : '#667eea',
                showInfo: false
              })
            ]))
          ]),
          
          // 共识度
          selectedVote.consensus_level && e('div', { style: { marginBottom: 16 } }, [
            e('h4', null, '🤝 共识度'),
            e(Progress, {
              percent: selectedVote.consensus_level * 100,
              status: selectedVote.consensus_level >= 0.7 ? 'success' : 'active',
              format: () => `${(selectedVote.consensus_level * 100).toFixed(0)}%`
            })
          ]),
          
          // 智能体投票详情
          selectedVote.votes && e('div', null, [
            e('h4', null, '👥 智能体投票详情'),
            e(Table, {
              dataSource: selectedVote.votes,
              columns: [
                { title: '智能体', dataIndex: 'agent_name', key: 'agent' },
                { title: '选择', dataIndex: 'option_id', key: 'option' },
                { title: '权重', dataIndex: 'weight', key: 'weight', render: w => `${(w * 100).toFixed(0)}%` },
                { title: '置信度', dataIndex: 'confidence', key: 'confidence', render: c => `${(c * 100).toFixed(0)}%` },
                { title: '理由', dataIndex: 'reasoning', key: 'reasoning', ellipsis: true }
              ],
              pagination: false,
              size: 'small'
            })
          ])
        ])
      ]);
    };
    
    return e('div', { style: { padding: 24 } }, [
      // 页面标题
      e('div', { style: { marginBottom: 24 } }, [
        e('h1', { style: { margin: 0 } }, '🗳️ AI投票'),
        e('p', { style: { color: '#666', marginTop: 8 } }, 
          '纯智能体投票决策系统，AI自主协商，人类发起和观察'
        )
      ]),
      
      // 标签页
      e(Tabs, { activeKey: activeTab, onChange: setActiveTab }, [
        e(TabPane, { tab: '📋 投票列表', key: 'list' }, e(VoteList)),
        e(TabPane, { tab: '📊 进行中的投票', key: 'active' }, 
          e('div', null, 
            votes.filter(v => ['analyzing', 'negotiating', 'voting'].includes(v.status)).length === 0
              ? e(Empty, { description: '暂无进行中的投票' })
              : e(Table, {
                  columns: columns,
                  dataSource: votes.filter(v => ['analyzing', 'negotiating', 'voting'].includes(v.status)),
                  rowKey: 'id'
                })
          )
        ),
        e(TabPane, { tab: '✅ 已完成', key: 'completed' },
          e('div', null,
            votes.filter(v => v.status === 'completed').length === 0
              ? e(Empty, { description: '暂无已完成的投票' })
              : e(Table, {
                  columns: columns,
                  dataSource: votes.filter(v => v.status === 'completed'),
                  rowKey: 'id'
                })
          )
        ),
        e(TabPane, { tab: '🎬 决策动画', key: 'animation' }, e(AnimationPanel)),
        e(TabPane, { tab: '👨‍🔬 专家配置', key: 'experts' }, e(ExpertConfigPanel))
      ]),
      
      // 创建投票模态框
      e(CreateVoteModal),
      
      // 投票详情
      e(VoteDetail)
    ]);
  };
  
  // 注册到TeamChat主界面
  if (QP.registerRoutes) {
    QP.registerRoutes('team_chat', [{
      path: '/plugin/team-chat/ai-voting-page',
      component: AIVotingPage,
      label: 'AI决策',
      icon: '🎯',
      priority: 90  // 优先级，控制显示顺序
    }]);
    console.log('[AI决策页面] 已注册到TeamChat路由');
  }
  
  // 暴露全局
  window.AIVotingPage = AIVotingPage;
  
  console.log('[AI决策页面] 主页面组件已加载');
})();
