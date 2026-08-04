export const getDocumentAsync = (_options?: unknown) =>
  Promise.resolve({ canceled: true, assets: [] as Array<{ uri: string; name: string; mimeType?: string }> });
