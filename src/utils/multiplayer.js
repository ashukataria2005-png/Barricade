import Peer from 'peerjs';

export const formatRoomPeerId = (roomCode) => {
  const sanitized = (roomCode || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `barricade-room-${sanitized}`;
};

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Initializes host peer waiting for guest to connect
 */
export const initHost = ({
  roomCode,
  onConnect,
  onData,
  onError,
  onStatus,
}) => {
  const hostId = formatRoomPeerId(roomCode);
  let activeConn = null;
  let isClosed = false;

  if (onStatus) onStatus('creating-room');

  const peer = new Peer(hostId, {
    config: ICE_CONFIG,
    debug: 1,
  });

  peer.on('open', (id) => {
    if (isClosed) return;
    if (onStatus) onStatus('waiting-for-player');
  });

  peer.on('connection', (conn) => {
    if (isClosed) {
      conn.close();
      return;
    }

    activeConn = conn;

    conn.on('open', () => {
      if (onStatus) onStatus('connected');
      if (onConnect) onConnect(conn);
    });

    conn.on('data', (data) => {
      if (onData) onData(data);
    });

    conn.on('close', () => {
      if (onStatus) onStatus('disconnected');
    });

    conn.on('error', (err) => {
      if (onError) onError(err);
    });
  });

  peer.on('error', (err) => {
    if (onError) onError(err);
  });

  return {
    peer,
    getConnection: () => activeConn,
    sendAction: (payload) => {
      if (activeConn && activeConn.open) {
        try {
          activeConn.send(payload);
        } catch (e) {
          console.error('Failed to send multiplayer action:', e);
        }
      }
    },
    close: () => {
      isClosed = true;
      try {
        if (activeConn) activeConn.close();
        peer.destroy();
      } catch (e) {}
    },
  };
};

/**
 * Connects guest peer to the host's room ID
 */
export const joinRoom = ({
  roomCode,
  onConnect,
  onData,
  onError,
  onStatus,
}) => {
  const targetHostId = formatRoomPeerId(roomCode);
  let isClosed = false;
  let activeConn = null;

  if (onStatus) onStatus('connecting-peer');

  const peer = new Peer({
    config: ICE_CONFIG,
    debug: 1,
  });

  peer.on('open', () => {
    if (isClosed) return;
    if (onStatus) onStatus('connecting-to-host');

    const conn = peer.connect(targetHostId, {
      reliable: true,
    });

    activeConn = conn;

    conn.on('open', () => {
      if (onStatus) onStatus('connected');
      if (onConnect) onConnect(conn);
    });

    conn.on('data', (data) => {
      if (onData) onData(data);
    });

    conn.on('close', () => {
      if (onStatus) onStatus('disconnected');
    });

    conn.on('error', (err) => {
      if (onError) onError(err);
    });
  });

  peer.on('error', (err) => {
    if (onError) onError(err);
  });

  return {
    peer,
    getConnection: () => activeConn,
    sendAction: (payload) => {
      if (activeConn && activeConn.open) {
        try {
          activeConn.send(payload);
        } catch (e) {
          console.error('Failed to send multiplayer action:', e);
        }
      }
    },
    close: () => {
      isClosed = true;
      try {
        if (activeConn) activeConn.close();
        peer.destroy();
      } catch (e) {}
    },
  };
};
