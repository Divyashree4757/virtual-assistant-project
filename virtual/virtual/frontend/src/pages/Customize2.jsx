import React, { useContext, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import axios from 'axios'
import { MdKeyboardBackspace } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

function Customize2() {
    const {userData,backendImage,selectedImage,serverUrl,setUserData}=useContext(userDataContext)
    const [assistantName,setAssistantName]=useState(userData?.assistantName || "")
    const [assistantGender,setAssistantGender]=useState(userData?.gender || "neutral")
    const [loading,setLoading]=useState(false)
    const [error,setError]=useState("")
    const navigate=useNavigate()

    const handleUpdateAssistant=async ()=>{
        setLoading(true)
        setError("")
        try {
            let formData=new FormData()
            formData.append("assistantName",assistantName.trim())
            formData.append("gender", assistantGender)
            if (backendImage) {
                formData.append("assistantImage", backendImage)
            } else if (selectedImage && selectedImage !== "input") {
                formData.append("imageUrl", selectedImage)
            } else {
                throw new Error("No image selected")
            }
            
            // ✅ FIXED: Use serverUrl from context (localhost:8000)
            const result=await axios.post(`${serverUrl}/api/user/update`,formData,{
                withCredentials:true,
                headers: {
                    'Content-Type': 'multipart/form-data'  // ✅ Required for FormData
                }
            })
            setLoading(false)
            console.log(result.data)
            setUserData(result.data)
            navigate("/")  
        } catch (error) {
            setLoading(false)
            console.error("Update failed:", error)
            setError(error.response?.data?.message || error.message || "Update failed")
        }
    }

 return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col p-[20px] relative '>
        <MdKeyboardBackspace className='absolute top-[30px] left-[30px] text-white cursor-pointer w-[25px] h-[25px]' onClick={()=>navigate("/customize")}/>
      <h1 className='text-white mb-[40px] text-[30px] text-center '>Enter Your <span className='text-blue-200'>Assistant Name</span> </h1>
      <input 
        type="text" 
        placeholder='eg. shifra' 
        className='w-full max-w-[600px] h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]' 
        value={assistantName}
        onChange={(e)=>setAssistantName(e.target.value)}
      />
      <div className='w-full max-w-[600px] mt-4'>
        <label className='text-white mb-2 block'>Assistant voice gender:</label>
        <select
          className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white px-[20px] rounded-full text-[18px]'
          value={assistantGender}
          onChange={(e) => setAssistantGender(e.target.value)}
        >
          <option value='neutral'>Neutral</option>
          <option value='female'>Female</option>
          <option value='male'>Male</option>
        </select>
      </div>
      {error && <p className='text-red-400 text-center mb-4'>❌ {error}</p>}
      <button 
        className='min-w-[300px] h-[60px] mt-[30px] text-black font-semibold cursor-pointer bg-white rounded-full text-[19px] disabled:opacity-50' 
        disabled={loading || !assistantName.trim()}
        onClick={handleUpdateAssistant}
      >
        {loading ? "Saving..." : "Finally Create Your Assistant"}
      </button>
    </div>
  )
}

export default Customize2