/**
 * useWebRTC Hook
 * WebRTC P2P通信
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPeerConnection, createDataChannel, isWebRTCSupported } from '../utils/webrtc';

export function useWebRTC(myFaceCode) {
  const [ready, setReady] = useState(false);
  const [connections, setConnections] = useState({});
  const [dataChannels, setDataChannels] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  
  const connectionsRef = useRef({});
  const channelsRef = useRef({});
  
  // 初始化
  useEffect(() => {
    if (isWebRTCSupported()) {
      setReady(true);
    }
  }, []);
  
  // 连接到对方
  const connect = useCallback(async (targetFaceCode) => {
    if (!ready) return { success: false, message: "WebRTC未就绪" };
    
    try {
      const pc = await createPeerConnection(
        {},
        (candidate) => {
          // 发送ICE候选
          console.log("ICE候选:", candidate);
        },
        (status) => {
          setConnectionStatus(status);
        }
      );
      
      // 创建DataChannel
      const channel = createDataChannel(
        pc,
        "messages",
        (message) => {
          // 收到消息
          console.log("收到消息:", message);
        },
        () => setConnectionStatus("connected"),
        () => setConnectionStatus("disconnected")
      );
      
      connectionsRef.current[targetFaceCode] = pc;
      channelsRef.current[targetFaceCode] = channel;
      
      setConnections({ ...connectionsRef.current });
      setDataChannels({ ...channelsRef.current });
      
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [ready]);
  
  // 发送消息
  const sendMessage = useCallback((targetFaceCode, content) => {
    const channel = channelsRef.current[targetFaceCode];
    if (channel && channel.readyState === "open") {
      const message = {
        id: Date.now(),
        from: myFaceCode,
        content,
        timestamp: Date.now()
      };
      channel.send(JSON.stringify(message));
      return { success: true };
    }
    return { success: false, message: "连接未建立" };
  }, [myFaceCode]);
  
  // 断开连接
  const disconnect = useCallback((targetFaceCode) => {
    const pc = connectionsRef.current[targetFaceCode];
    const channel = channelsRef.current[targetFaceCode];
    
    if (channel) channel.close();
    if (pc) pc.close();
    
    delete connectionsRef.current[targetFaceCode];
    delete channelsRef.current[targetFaceCode];
    
    setConnections({ ...connectionsRef.current });
    setDataChannels({ ...channelsRef.current });
  }, []);
  
  return {
    ready,
    connectionStatus,
    connections,
    dataChannels,
    connect,
    sendMessage,
    disconnect
  };
}
