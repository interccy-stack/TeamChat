/**
 * WebRTC工具函数
 * P2P通信封装
 */

// 创建PeerConnection
export async function createPeerConnection(config, onIceCandidate, onConnectionStateChange) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  });
  
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate?.(event.candidate);
    }
  };
  
  pc.onconnectionstatechange = () => {
    onConnectionStateChange?.(pc.connectionState);
  };
  
  return pc;
}

// 创建DataChannel
export function createDataChannel(pc, label, onMessage, onOpen, onClose) {
  const channel = pc.createDataChannel(label, { ordered: true });
  
  channel.onopen = () => onOpen?.();
  channel.onclose = () => onClose?.();
  channel.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage?.(message);
    } catch (err) {
      console.error("消息解析失败:", err);
    }
  };
  
  return channel;
}

// 检查WebRTC支持
export function isWebRTCSupported() {
  return !!(window.RTCPeerConnection && window.RTCSessionDescription);
}

// 获取连接状态文本
export function getConnectionStatusText(status) {
  const statusMap = {
    "new": "新建",
    "connecting": "连接中",
    "connected": "已连接",
    "disconnected": "已断开",
    "failed": "失败",
    "closed": "已关闭"
  };
  return statusMap[status] || status;
}
