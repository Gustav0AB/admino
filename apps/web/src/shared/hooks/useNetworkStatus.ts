import { useEffect, useState } from "react";

type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const update = () => {
      setStatus({
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
      });
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return status;
}
