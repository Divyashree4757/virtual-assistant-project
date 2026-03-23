import axios from "axios";
import React, { createContext, useEffect, useState, useCallback } from "react";

export const userDataContext = createContext();

function UserContext({ children }) {
  const serverUrl = "http://localhost:8000";
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ ADD THIS
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleCurrentUser = useCallback(async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });
      setUserData(result.data);
    } catch (error) {
      console.log("No user found:", error.response?.status);
      setUserData(null);
    } finally {
      setLoading(false); // ✅ ADD THIS
    }
  }, [serverUrl]);

  const getGeminiResponse = async (command) => {
    try {
      const result = await axios.post(`${serverUrl}/api/user/asktoassistant`, { command }, {
        withCredentials: true
      });
      return result.data;
    } catch (error) {
      const fallback = error?.response?.data;
      if (fallback?.response) {
        return {
          type: fallback.type || "general",
          userInput: fallback.userInput || command,
          response: fallback.response,
        };
      }
      throw error;
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, [handleCurrentUser]);

  const value = {
    serverUrl,
    userData,
    setUserData,
    loading, // ✅ ADD THIS
    backendImage,
    setBackendImage,
    frontendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage,
    getGeminiResponse,
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;