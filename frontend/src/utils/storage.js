/**
 * 存储工具函数
 * localStorage封装
 */

const STORAGE_PREFIX = "teamchat_";

// 获取存储项
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// 设置存储项
export function setStorageItem(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// 移除存储项
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

// 清空所有存储
export function clearStorage() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

// 蜂巢邮箱专用存储
export const HiveStorage = {
  getMyFaceCode: () => getStorageItem("hive_my_facecode", ""),
  setMyFaceCode: (code) => setStorageItem("hive_my_facecode", code),
  getFriends: () => getStorageItem("hive_friends", []),
  setFriends: (friends) => setStorageItem("hive_friends", friends),
  getMessages: () => getStorageItem("hive_messages", []),
  setMessages: (messages) => setStorageItem("hive_messages", messages)
};

// 邮箱配置存储
export const EmailStorage = {
  getConfig: () => getStorageItem("email_config", null),
  setConfig: (config) => setStorageItem("email_config", config),
  getContacts: () => getStorageItem("email_contacts", []),
  setContacts: (contacts) => setStorageItem("email_contacts", contacts)
};
