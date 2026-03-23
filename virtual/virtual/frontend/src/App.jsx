import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import UserContext from "./context/UserContext";
import { userDataContext } from "./context/UserContext";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Customize from "./pages/Customize";
import Home from "./pages/Home";
import Customize2 from "./pages/Customize2";
import History from "./pages/History";

// ✅ Separated so we can use context inside
function AppRoutes() {
  const { userData, loading } = useContext(userDataContext)

  // ✅ Wait for user fetch to complete before rendering any routes
  if (loading) {
    return (
      <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center'>
        <h1 className='text-white text-[20px]'>Loading...</h1>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/customize" element={<Customize />} />
      <Route path="/customize2" element={<Customize2 />} />
      <Route path="/history" element={userData ? <History /> : <Navigate to="/signin" />} />
      <Route path="/" element={userData ? <Home /> : <Navigate to="/signin" />} />
      <Route path="*" element={<Navigate to="/signin" />} />
    </Routes>
  )
}

function App() {
  return (
    <AppRoutes />
  );
}

export default App;