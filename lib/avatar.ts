export function getAvatarUrl(seed: string) {
  const encoded = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encoded}&backgroundColor=f97316&shapeColor=ffffff`;
}
