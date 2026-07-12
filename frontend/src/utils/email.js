/**
 * 邮箱工具函数
 * 邮箱配置、解析、验证等
 */

// 邮箱服务商配置
export const EMAIL_PROVIDERS = {
  qq: { name: "QQ邮箱", smtp: { host: "smtp.qq.com", port: 465, ssl: true }, imap: { host: "imap.qq.com", port: 993, ssl: true } },
  mail163: { name: "163邮箱", smtp: { host: "smtp.163.com", port: 465, ssl: true }, imap: { host: "imap.163.com", port: 993, ssl: true } },
  mail126: { name: "126邮箱", smtp: { host: "smtp.126.com", port: 465, ssl: true }, imap: { host: "imap.126.com", port: 993, ssl: true } },
  gmail: { name: "Gmail", smtp: { host: "smtp.gmail.com", port: 587, ssl: false }, imap: { host: "imap.gmail.com", port: 993, ssl: true } },
  outlook: { name: "Outlook", smtp: { host: "smtp-mail.outlook.com", port: 587, ssl: false }, imap: { host: "outlook.office365.com", port: 993, ssl: true } }
};

// 根据邮箱地址自动检测服务商
export function detectEmailProvider(email) {
  if (!email || !email.includes("@")) return null;
  const domain = email.split("@")[1].toLowerCase();
  
  const providerMap = {
    "qq.com": "qq",
    "163.com": "mail163",
    "126.com": "mail126",
    "gmail.com": "gmail",
    "outlook.com": "outlook",
    "hotmail.com": "outlook"
  };
  
  return providerMap[domain] || null;
}

// 获取服务商配置
export function getProviderConfig(provider) {
  return EMAIL_PROVIDERS[provider] || null;
}

// 验证邮箱格式
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// 生成邮件摘要
export function generateEmailSummary(body, maxLength = 100) {
  if (!body) return "";
  const text = body.replace(/<[^>]*>/g, ""); // 移除HTML标签
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// 格式化日期
export function formatEmailDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  
  // 昨天
  if (diff < 48 * 60 * 60 * 1000) {
    return "昨天";
  }
  
  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString("zh-CN", { weekday: "short" });
  }
  
  // 其他
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
