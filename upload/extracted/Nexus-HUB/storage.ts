export async function storagePut(key: string, body: string, contentType: string) {
  console.log(`[Storage] Putting file: ${key} (${contentType})`);
  return {
    url: `https://nexus-storage.s3.amazonaws.com/${key}`,
    key,
  };
}

export async function storageGet(key: string) {
  console.log(`[Storage] Getting file: ${key}`);
  return null;
}
