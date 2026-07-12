/**
 * useEmail Hook
 * 邮箱相关状态和操作
 */
import { useState, useEffect, useCallback } from 'react';
import { EmailAPI } from '../utils/api';
import { EmailStorage } from '../utils/storage';

export function useEmail() {
  const [config, setConfig] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 加载配置
  useEffect(() => {
    const savedConfig = EmailStorage.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);
  
  // 保存配置
  const saveConfig = useCallback(async (newConfig) => {
    try {
      const result = await EmailAPI.saveConfig(newConfig);
      if (result.success) {
        setConfig(newConfig);
        EmailStorage.setConfig(newConfig);
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);
  
  // 获取邮件列表
  const fetchEmails = useCallback(async (folder = "inbox") => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await EmailAPI.getEmails(folder);
      if (result.success) {
        setEmails(result.emails);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 发送邮件
  const sendEmail = useCallback(async (data) => {
    try {
      const result = await EmailAPI.sendEmail(data);
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);
  
  // 测试连接
  const testConnection = useCallback(async () => {
    if (!config) return { success: false, message: "未配置邮箱" };
    
    try {
      const result = await EmailAPI.testConnection(config);
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [config]);
  
  return {
    config,
    emails,
    loading,
    error,
    saveConfig,
    fetchEmails,
    sendEmail,
    testConnection
  };
}
