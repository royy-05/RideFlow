// src/features/auth/authService.js
import axios from "../../Utils/axios";

export const loginUser = (data) => {
  return axios.post("/auth/login", data);
};

export const signupUser = (data) => {
  return axios.post("/auth/signup", data);
};