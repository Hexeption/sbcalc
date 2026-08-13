const normalizeBasePath = (value: string | undefined): string => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") return "";

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
};

export const getSiteBasePath = (): string =>
  normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export const withBasePath = (path: string): string => {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("blob:")) {
    return path;
  }

  const basePath = getSiteBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/") return `${basePath}/`;
  return `${basePath}${normalizedPath}`;
};

export const getHeadTextureUrl = (textureId: string): string =>
  `https://mc-heads.net/head/${encodeURIComponent(textureId)}`;
