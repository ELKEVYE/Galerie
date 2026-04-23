import { apiClient, publicClient, setAccessToken } from "./client";

export async function registerUser(payload) {
  const response = await publicClient.post("/auth/register/", payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await publicClient.post("/auth/login/", payload);
  return response.data;
}

export async function refreshAccessToken(refreshToken) {
  const response = await publicClient.post("/token/refresh/", {
    refresh: refreshToken,
  });

  const { access } = response.data;
  setAccessToken(access);
  return access;
}

export async function fetchCurrentUser() {
  const response = await apiClient.get("/auth/me/");
  return response.data;
}

export async function fetchPhotos() {
  const response = await apiClient.get("/auth/photos/");
  return response.data;
}

export async function uploadPhotos(entries) {
  const formData = new FormData();

  entries.forEach((entry) => {
    formData.append("images", entry.file);
    formData.append("descriptions", entry.description);
    formData.append("dates", entry.date);
  });

  const response = await apiClient.post("/auth/photos/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function updatePhoto(photoId, payload) {
  if (payload.image instanceof File) {
    const formData = new FormData();
    formData.append("image", payload.image);
    formData.append("description", payload.description);
    formData.append("date", payload.date);

    const response = await apiClient.patch(`/auth/photos/${photoId}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  const response = await apiClient.patch(`/auth/photos/${photoId}/`, payload);
  return response.data;
}

export async function deletePhoto(photoId) {
  await apiClient.delete(`/auth/photos/${photoId}/`);
}
