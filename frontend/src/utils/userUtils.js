import poto from "../assets/poto.jpg";
import { API_ORIGIN } from "../service/api";

export const DEFAULT_USER_DISPLAY_NAME = "user";
export const DEFAULT_USER_AVATAR = poto;

export const hasUserPhoto = (user) => Boolean(user?.foto?.toString().trim());
export const getUserPhotoUrl = (user) =>
  hasUserPhoto(user) ? `${API_ORIGIN}${user.foto}` : DEFAULT_USER_AVATAR;

export const getUserProfilePhotoUrl = (user, cacheKey) =>
  hasUserPhoto(user)
    ? `${API_ORIGIN}${user.foto}?t=${cacheKey}`
    : DEFAULT_USER_AVATAR;

export const getUserDisplayName = (user, defaultName = DEFAULT_USER_DISPLAY_NAME) => {
  const fullName = user?.nama_lengkap?.toString().trim();
  const username = user?.username?.toString().trim();
  return fullName || username || defaultName;
};
