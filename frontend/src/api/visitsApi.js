import axiosClient from "./axiosClient";

// axiosClient.baseURL already includes /api

export const createVisitApi = async (formData) => {
  const { data } = await axiosClient.post("/visits", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const fetchVisitsApi = async (params) => {
  const { data } = await axiosClient.get("/visits", { params });
  return data;
};

export const updateVisitApi = async (id, formData) => {
  const { data } = await axiosClient.patch(`/visits/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteVisitApi = async (id) => {
  const { data } = await axiosClient.delete(`/visits/${id}`);
  return data;
};