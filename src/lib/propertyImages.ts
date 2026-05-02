export type PropertyImage = {
  url: string;
  alt: string;
};

export function getPropertyImageUrls(imageUrls: unknown, coverImage: unknown): string[] {
  const gallery = Array.isArray(imageUrls)
    ? imageUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    : [];
  const cover = typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : '';

  if (gallery.length > 0) return gallery;
  return cover ? [cover] : [];
}

export function getPropertyImages(
  imageUrls: unknown,
  coverImage: unknown,
  altPrefix: string,
): PropertyImage[] {
  const urls = getPropertyImageUrls(imageUrls, coverImage);

  return urls.map((url, index) => ({
    url,
    alt: `${altPrefix}${urls.length > 1 ? ` photo ${index + 1}` : ''}`,
  }));
}
