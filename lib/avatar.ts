export function getAvatarUrl(seed: string, avatarId?: string | null) {
  if (avatarId) {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId =
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ??
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
    const bucketId = process.env.APPWRITE_AVATARS_BUCKET_ID;

    if (endpoint && projectId && bucketId) {
      return `${endpoint}/storage/buckets/${bucketId}/files/${avatarId}/preview?project=${projectId}`;
    }
  }

  const encoded = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encoded}&backgroundColor=f97316&shapeColor=ffffff`;
}
