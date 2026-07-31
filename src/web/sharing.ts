export const isAvailableAsync = () => Promise.resolve(Boolean(navigator.share));
export const shareAsync = async (uri: string, _options?: unknown) => {
  if (navigator.share) await navigator.share({ url: uri });
  else window.open(uri, "_blank", "noopener,noreferrer");
};

export default { isAvailableAsync, shareAsync };
