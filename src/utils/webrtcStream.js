import Peer from 'peerjs';

export const getCameraBroadcasterPeerId = (cameraId = 'CAM-01') => {
  return 'queuesense-stream-' + String(cameraId).toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Start broadcasting local camera video stream to any connected viewers
 */
export function startBroadcasting(cameraId, mediaStream, onViewerCountChange) {
  const peerId = getCameraBroadcasterPeerId(cameraId);
  const peer = new Peer(peerId, {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    }
  });

  const activeCalls = new Set();

  peer.on('open', (id) => {
    console.log('[QueueSense WebRTC] Broadcaster online with ID:', id);
  });

  peer.on('call', (call) => {
    console.log('[QueueSense WebRTC] Incoming viewer call from:', call.peer);
    call.answer(mediaStream);
    activeCalls.add(call);

    call.on('close', () => {
      activeCalls.delete(call);
      if (onViewerCountChange) onViewerCountChange(activeCalls.size);
    });

    if (onViewerCountChange) onViewerCountChange(activeCalls.size);
  });

  peer.on('error', (err) => {
    console.warn('[QueueSense WebRTC] Broadcaster warning:', err.type);
  });

  return {
    peer,
    stop: () => {
      activeCalls.forEach(c => c.close());
      peer.destroy();
    }
  };
}

/**
 * Connect to a live camera broadcaster stream from another device
 */
export function connectToBroadcast(cameraId, onStream, onError) {
  const broadcasterPeerId = getCameraBroadcasterPeerId(cameraId);
  const viewerPeer = new Peer({
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    }
  });

  let call = null;

  viewerPeer.on('open', () => {
    console.log('[QueueSense WebRTC] Viewer connecting to broadcaster:', broadcasterPeerId);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dummyStream = canvas.captureStream ? canvas.captureStream(1) : null;

      if (!dummyStream) {
        if (onError) onError(new Error('Browser does not support canvas captureStream'));
        return;
      }

      call = viewerPeer.call(broadcasterPeerId, dummyStream);

      if (!call) {
        if (onError) onError(new Error('Could not initiate call to broadcaster'));
        return;
      }

      call.on('stream', (remoteStream) => {
        console.log('[QueueSense WebRTC] Received live video stream from broadcaster!');
        if (onStream) onStream(remoteStream);
      });

      call.on('close', () => {
        console.log('[QueueSense WebRTC] Call closed');
      });

      call.on('error', (err) => {
        console.warn('[QueueSense WebRTC] Call error:', err);
        if (onError) onError(err);
      });
    } catch (err) {
      console.warn('[QueueSense WebRTC] Call failed:', err);
      if (onError) onError(err);
    }
  });

  viewerPeer.on('error', (err) => {
    console.warn('[QueueSense WebRTC] Viewer error:', err.type);
    if (onError) onError(err);
  });

  return {
    peer: viewerPeer,
    stop: () => {
      if (call) call.close();
      viewerPeer.destroy();
    }
  };
}

