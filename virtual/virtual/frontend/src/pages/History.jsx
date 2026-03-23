import React, { useContext } from 'react'
import { userDataContext } from '../context/UserContext'
import { MdKeyboardBackspace } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

function History() {
  const { userData } = useContext(userDataContext)
  const navigate = useNavigate()

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col p-[20px] relative '>
      <MdKeyboardBackspace className='absolute top-[30px] left-[30px] text-white cursor-pointer w-[25px] h-[25px]' onClick={() => navigate("/")} />
      <h1 className='text-white mb-[40px] text-[30px] text-center '>Command <span className='text-blue-200'>History</span> </h1>
      
      <div className='w-full max-w-[800px] h-[70%] overflow-y-auto bg-[#00000044] rounded-2xl p-[20px] flex flex-col gap-[10px]'>
        {userData?.history?.length > 0 ? (
          userData.history.map((command, index) => (
            <div key={index} className='bg-[#ffffff11] p-[15px] rounded-lg text-white text-[18px] border-l-4 border-blue-400'>
              {command}
            </div>
          ))
        ) : (
          <p className='text-white text-center text-[20px] opacity-50 mt-[50px]'>No history found yet</p>
        )}
      </div>
    </div>
  )
}

export default History
