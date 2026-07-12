/**
 * API工具函数
 * 封装所有后端API调用
 */

// 基础API配置
const API_BASE = "/api/plugins/teamchat";

// 通用请求封装
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  return response.json();
}

// 邮箱API
export const EmailAPI = {
  // 获取配置
  getConfig: () => apiRequest(`${API_BASE}/email/config`),
  
  // 保存配置
  saveConfig: (config) => apiRequest(`${API_BASE}/email/config`, {
    method: "POST",
    body: JSON.stringify(config)
  }),
  
  // 测试连接
  testConnection: (config) => apiRequest(`${API_BASE}/email/config/test`, {
    method: "POST",
    body: JSON.stringify(config)
  }),
  
  // 获取邮件列表
  getEmails: (folder, limit = 50) => 
    apiRequest(`${API_BASE}/email/emails/${folder}?limit=${limit}`),
  
  // 发送邮件
  sendEmail: (data) => apiRequest(`${API_BASE}/email/send`, {
    method: "POST",
    body: JSON.stringify(data)
  }),
  
  // 获取联系人
  getContacts: () => apiRequest(`${API_BASE}/email/contacts`),
  
  // 保存联系人
  saveContact: (contact) => apiRequest(`${API_BASE}/email/contacts`, {
    method: "POST",
    body: JSON.stringify(contact)
  })
};

// AI API
export const AIAPI = {
  // 调用AI智能体
  chat: (message, sessionId) => apiRequest("/api/console/chat", {
    method: "POST",
    headers: { "X-Agent-Id": "default" },
    body: JSON.stringify({ message, session_id: sessionId })
  })
};

// WebRTC信令API
export const SignalingAPI = {
  // 发送信令消息
  sendSignal: (targetFaceCode, message) => {
    const key = `hive_signaling_${targetFaceCode}`;
    const data = JSON.stringify({
      from: localStorage.getItem("hive_my_facecode"),
      timestamp: Date.now(),
      ...message
    });
    localStorage.setItem(key, data);
  },
  
  // 监听信令消息
  onSignal: (callback) => {
    window.addEventListener("storage", (e) => {
      if (e.key && e.key.startsWith("hive_signaling_")) {
        try {
          const message = JSON.parse(e.newValue);
          callback(message);
        } catch (err) {
          console.error("信令解析失败:", err);
        }
      }
    });
  }
};
