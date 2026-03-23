import React, { useContext, useState } from 'react'
import { IoEye } from "react-icons/io5";
import { IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios"

function SignUp() {
  const [showPassword,setShowPassword]=useState(false)
  const {serverUrl,setUserData}=useContext(userDataContext)
  const navigate=useNavigate()
  const [name,setName]=useState("")
  const [email,setEmail]=useState("")
  const [loading,setLoading]=useState(false)
  const [password,setPassword]=useState("")
  const [err,setErr]=useState("")

  const handleSignUp=async (e)=>{
    e.preventDefault()
    setErr("")
    setLoading(true)
    
    try {
      // Use serverUrl from context (localhost:8000)
      const result = await axios.post(`${serverUrl}/api/auth/signup`, {
        name: name.trim(),
        email: email.trim(),
        password
      }, { withCredentials: true })

      // Set userData to the actual user object (handle both wrappers)
      setUserData(result.data?.data || result.data)
      navigate("/customize")
      
      // Clear form
      setName("")
      setEmail("")
      setPassword("")
      
    } catch (error) {
      console.log("Signup error:", error)
      setLoading(false)
      
      if (error.response?.data?.message) {
        setErr(error.response.data.message)
      } else if (error.message) {
        setErr(error.message.includes('Network') ? 'Backend not running - start on port 8000' : error.message)
      } else {
        setErr('Signup failed - please try again')
      }
    }
    setLoading(false)  // ✅ FIXED: Always reset loading
  }

  return (
    <div className='w-full h-[100vh] bg-cover flex justify-center items-center' style={{
      backgroundImage: 'url("https://img.freepik.com/premium-photo/android-futuristic-robot-ai-beautiful-robot-girl-cyberpunk-style-looking-up-background_968517-169220.jpg?w=2000")'
    }}>
      <form className='w-[90%] h-[600px] max-w-[500px] bg-[#00000062] backdrop-blur shadow-lg shadow-black flex flex-col items-center justify-center gap-[20px] px-[20px]' onSubmit={handleSignUp}>
        <h1 className='text-white text-[30px] font-semibold mb-[30px]'>Register to <span className='text-blue-400'>Virtual Assistant</span></h1>
        
        <input type="text" placeholder='Enter your Name' className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]' required onChange={(e)=>setName(e.target.value)} value={name}/>
        <input type="email" placeholder='Email' className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]' required onChange={(e)=>setEmail(e.target.value)} value={email}/>
        
        <div className='w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative'>
         <input type={showPassword?"text":"password"} placeholder='password' className='w-full h-full rounded-full outline-none bg-transparent placeholder-gray-300 px-[20px] py-[10px]' required onChange={(e)=>setPassword(e.target.value)} value={password}/>
         {!showPassword && <IoEye className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-[white] cursor-pointer' onClick={()=>setShowPassword(true)}/>}
         {showPassword && <IoEyeOff className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-[white] cursor-pointer' onClick={()=>setShowPassword(false)}/>}
        </div>
        
        {err.length>0 && <p className='text-red-500 text-[17px]'>*{err}</p>}
        
        <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer disabled:opacity-50' disabled={loading}>
          {loading?"Loading...":"Sign Up"}
        </button>

        <p className='text-[white] text-[18px] cursor-pointer' onClick={()=>navigate("/signin")}>Already have an account ? <span className='text-blue-400'>Sign In</span></p>
      </form>
    </div>
  )
}

export default SignUp
