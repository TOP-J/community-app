// utils/media.js
export const BASE_URL = "http://192.168.8.102:8000";

export function getFullMediaUrl(pathOrObj) {
  if (!pathOrObj) return null;

  // handle object shape e.g. { url: "/media/..." }
  let path = pathOrObj;
  if (typeof pathOrObj === "object" && pathOrObj !== null) {
    if (pathOrObj.url) path = pathOrObj.url;
    else return null;
  }

  // already a full url
  if (typeof path === "string" && path.startsWith("http")) return path;

  if (typeof path === "string" && path.trim() !== "") {
    // ensure leading slash
    if (!path.startsWith("/")) path = `/${path}`;
    return `${BASE_URL}${path}`;
  }

  return null;
}
