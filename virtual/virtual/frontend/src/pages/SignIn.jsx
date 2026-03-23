import React, { useContext, useState } from 'react'
import { IoEye } from "react-icons/io5";
import { IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios"

function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const { serverUrl, setUserData } = useContext(userDataContext)
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const handleSignIn = async (e) => {
    e.preventDefault()
    setErr("")
    setLoading(true)

    try {
      // ✅ FIXED: Use serverUrl from context
      let result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email: email.trim(), password },
        { withCredentials: true }
      )

      // Set userData to the user object (support wrapped responses)
      setUserData(result.data?.data || result.data)
      navigate("/customize")
      
      // Clear fields after success
      setEmail("")
      setPassword("")
      
    } catch (error) {
      setLoading(false)
      
      if (error.response?.data?.message) {
        setErr(error.response.data.message)
      } else if (error.message?.includes('Network')) {
        setErr("Connection failed - check if backend is running on port 8000")
      } else {
        setErr("Sign in failed - please try again")
      }
    }
    setLoading(false)
  }

  return (
    <div
      className='w-full h-[100vh] bg-cover flex justify-center items-center'
      style={{
        backgroundImage:
        'url("https://img.freepik.com/premium-photo/android-futuristic-robot-ai-beautiful-robot-girl-cyberpunk-style-looking-up-background_968517-169220.jpg?w=2000")'
      }}
    >
      <form
        autoComplete="off"
        className='w-[90%] h-[600px] max-w-[500px] bg-[#00000062] backdrop-blur shadow-lg shadow-black flex flex-col items-center justify-center gap-[20px] px-[20px]'
        onSubmit={handleSignIn}
      >
        <h1 className='text-white text-[30px] font-semibold mb-[30px]'>
          Sign In to <span className='text-blue-400'>Virtual Assistant</span>
        </h1>

        {/* Hidden fake fields to prevent Chrome autofill */}
        <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
        <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />

        <input
          type="email"
          name="random_email_field"
          autoComplete="new-email"
          placeholder='Email'
          className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className='w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative'>
          <input
            type={showPassword ? "text" : "password"}
            name="random_password_field"
            autoComplete="new-password"
            placeholder='Password'
            className='w-full h-full rounded-full outline-none bg-transparent placeholder-gray-300 px-[20px] py-[10px]'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {!showPassword &&
            <IoEye
              className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer'
              onClick={() => setShowPassword(true)}
            />
          }

          {showPassword &&
            <IoEyeOff
              className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer'
              onClick={() => setShowPassword(false)}
            />
          }
        </div>

        {err && <p className='text-red-500 text-[17px]'>*{err}</p>}

        <button
          className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer disabled:opacity-50'
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>

        <p
          className='text-white text-[18px] cursor-pointer'
          onClick={() => navigate("/signup")}
        >
          Want to create a new account?{" "}
          <span className='text-blue-400'>Sign Up</span>
        </p>
      </form>
    </div>
  )
}

export default SignIn
