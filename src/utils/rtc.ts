export const disableRtc = () => {
  Object.defineProperty(window, 'RTCPeerConnection', {
    get: () => {
      return {};
    },
  });
  Object.defineProperty(window, 'RTCDataChannel', {
    get: () => {
      return {};
    },
  });
};
