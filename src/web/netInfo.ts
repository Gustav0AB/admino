export type NetInfoState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

const NetInfo = {
  addEventListener(listener: (state: NetInfoState) => void) {
    const notify = () => listener({ isConnected: navigator.onLine, isInternetReachable: navigator.onLine });
    window.addEventListener("online", notify);
    window.addEventListener("offline", notify);
    notify();
    return () => {
      window.removeEventListener("online", notify);
      window.removeEventListener("offline", notify);
    };
  }
};

export default NetInfo;
