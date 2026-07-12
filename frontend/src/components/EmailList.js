/**
 * EmailList组件
 * 邮件列表展示
 */
import React from 'react';
import { formatEmailDate, generateEmailSummary } from '../utils/email';

export function EmailList({ emails, onSelect, onDelete, selectedId }) {
  if (!emails || emails.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px", opacity: 0.6 }}>
        📭 暂无邮件
      </div>
    );
  }
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onSelect?.(email)}
          style={{
            background: selectedId === email.id ? "#e3f2fd" : "white",
            padding: "14px",
            borderRadius: "8px",
            cursor: "pointer",
            border: "1px solid #e0e0e0",
            transition: "background 0.2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontWeight: "bold", color: "#333" }}>
              {email.from_name || email.from_addr}
            </span>
            <span style={{ fontSize: "12px", color: "#999" }}>
              {formatEmailDate(email.date)}
            </span>
          </div>
          <div style={{ fontWeight: "500", marginBottom: "4px" }}>
            {email.subject}
          </div>
          <div style={{ fontSize: "13px", color: "#666" }}>
            {generateEmailSummary(email.body, 60)}
          </div>
        </div>
      ))}
    </div>
  );
}
