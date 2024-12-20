import axios from "axios";
import baseUrl from "../api/apiConfig";

// Helper function to get the token from local storage
const getAuthToken = () => {
  return localStorage.getItem("token");
};

const upsertUser = async (userData) => {
  try {
    const response = await axios.post(`${baseUrl.users}`, userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      return { success: false, message: "Username already exists." };
    }
    console.error("Error creating the user:", error);
    throw error;
  }
};

const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${baseUrl.login}`, {
      username,
      password,
    });
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

const removeAccount = async (username) => {
  try {
    const token = getAuthToken(); // Retrieve the token
    const response = await axios.delete(`${baseUrl.users}/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Add Bearer token to headers
      },
    });
    return response.data;
  } catch (error) {
    console.error("Account Removed:", error);
    throw error;
  }
};

const sendOtp = async (email,purpose) => {
  try {
    const token = getAuthToken(); // Retrieve the token
    const response = await axios.post(`${baseUrl.login}/send-otp`, {
      email,purpose
    }, {
      headers: {
        Authorization: `Bearer ${token}`, // Add Bearer token to headers
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send OTP:", error);
    throw error;
  }
};

const verifyOtp = async (email, otp) => {
  try {
    const token = getAuthToken(); // Retrieve the token
    const response = await axios.post(`${baseUrl.login}/verify-otp`, {
      email,
      otp,
    }, {
      headers: {
        Authorization: `Bearer ${token}`, // Add Bearer token to headers
      },
    });
    return response.data; // Assuming the API returns a success flag or similar
  } catch (error) {
    console.error("Failed to verify OTP:", error);
    throw error;
  }
};

const UserManagement = {
  upsertUser,
  loginUser,
  removeAccount,
  sendOtp,
  verifyOtp,
};

// Export the object
export default UserManagement;
