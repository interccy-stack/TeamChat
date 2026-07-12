/**
 * ComposeModal组件
 * 写邮件弹窗
 */
import React, { useState } from 'react';

export function ComposeModal({ visible, onClose, onSend, initialData = {} }) {
  const [data, setData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
    ...initialData
  });
  const [sending, setSending] = useState(false);
  
  if (!visible) return null;
  
  const handleSend = async () => {
    if (!data.to || !data.subject) {
      alert("请填写收件人和主题");
      return;
    }
    
    setSending(true);
    const result = await onSend?.(data);
    setSending(false);
    
    if (result?.success) {
      onClose?.();
    }
  };
  
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        width: "600px",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3>✉️ 写邮件</h3>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            placeholder="收件人"
            value={data.to}
            onChange={(e) => setData({ ...data, to: e.target.value })}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
          <input
            placeholder="抄送"
            value={data.cc}
            onChange={(e) => setData({ ...data, cc: e.target.value })}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
          <input
            placeholder="主题"
            value={data.subject}
            onChange={(e) => setData({ ...data, subject: e.target.value })}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          />
          <textarea
            placeholder="邮件正文"
            value={data.body}
            onChange={(e) => setData({ ...data, body: e.target.value })}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd", minHeight: "200px" }}
          />
        </div>
        
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
          <button onClick={onClose} style={{ padding: "10px 20px" }}>取消</button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: "10px 20px",
              background: sending ? "#ccc" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: sending ? "not-allowed" : "pointer"
            }}
          >
            {sending ? "发送中..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
