import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"

function Home() {

  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()

  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const synthRef = useRef(null)

  const useElevenLabs = !!import.meta.env.VITE_USE_ELEVENLABS

  const getElevenLabsVoiceId = () => {
    const gender = (userData?.gender || "neutral").toLowerCase()
    const name = (userData?.assistantName || "").toLowerCase()

    console.log("Voice selection - Gender:", gender, "Name:", name)

    if (gender === "female") {
      const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID_FEMALE || "EXAVITQu4vr4xnSDxMaL"
      console.log("Selected female voice:", voiceId)
      return voiceId
    }

    if (gender === "male") {
      const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID_MALE || "ErXwobaYiN019PkySvjV"
      console.log("Selected male voice:", voiceId)
      return voiceId
    }

    if (/female|girl|woman|she|her/.test(name)) {
      const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID_FEMALE || "EXAVITQu4vr4xnSDxMaL"
      console.log("Selected female voice (name-based):", voiceId)
      return voiceId
    }

    if (/male|boy|man|he|him/.test(name)) {
      const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID_MALE || "ErXwobaYiN019PkySvjV"
      console.log("Selected male voice (name-based):", voiceId)
      return voiceId
    }

    const defaultVoiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"
    console.log("Selected default voice:", defaultVoiceId)
    return defaultVoiceId
  }

  useEffect(() => {
    synthRef.current = window.speechSynthesis

    const loadVoices = () => {
      if (synthRef.current) {
        const voices = synthRef.current.getVoices()
        console.log("Loaded voices:", voices.length)
      }
    }

    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices
      loadVoices()
    }
  }, [])

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      navigate("/signin")
      console.log(error)
    }
  }

  const startRecognition = () => {
    if (!recognitionRef.current) return
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current.start()
        console.log("Recognition started")
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Recognition start error:", error)
        }
      }
    }
  }

  const speak = (text) => {
    if (!synthRef.current) {
      console.warn("Speech Synthesis not supported")
      return
    }

    console.log("Speaking:", text)
    const utterence = new SpeechSynthesisUtterance(text)
    utterence.lang = 'en-US'

    const voices = synthRef.current.getVoices()
    console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`))

    const userGender = (userData?.gender || "neutral").toLowerCase()
    console.log("User gender for voice selection:", userGender)

    // Try to select different voices for male/female
    let selectedVoice = null

    if (userGender === "female") {
      // Try to find a female-sounding voice (usually higher pitch names)
      selectedVoice = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('woman') ||
        v.name.toLowerCase().includes('girl') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('hazel') ||
        v.name.toLowerCase().includes('samantha')
      )
      console.log("Selected female voice:", selectedVoice?.name)
    } else if (userGender === "male") {
      // Try to find a male-sounding voice (usually lower pitch names)
      selectedVoice = voices.find(v =>
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('man') ||
        v.name.toLowerCase().includes('boy') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('alex') ||
        v.name.toLowerCase().includes('james')
      )
      console.log("Selected male voice:", selectedVoice?.name)
    }

    // If no gender-specific voice found, use any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en'))
      console.log("Using default English voice:", selectedVoice?.name)
    }

    if (selectedVoice) {
      utterence.voice = selectedVoice
      console.log("Final voice selected:", selectedVoice.name, "Gender:", userGender)

      // Adjust pitch and rate for more distinct male/female voices
      if (userGender === "female") {
        utterence.pitch = 1.2  // Higher pitch for female
        utterence.rate = 1.1   // Slightly faster for female
      } else if (userGender === "male") {
        utterence.pitch = 0.8  // Lower pitch for male
        utterence.rate = 0.9   // Slightly slower for male
      }
    } else {
      console.log("No suitable voice found, using browser default")
    }

    isSpeakingRef.current = true

    utterence.onend = () => {
      setAiText("")
      isSpeakingRef.current = false
      setTimeout(() => {
        startRecognition()
      }, 800)
    }

    utterence.onerror = (error) => {
      console.error("Speech synthesis error:", error)
      setAiText("")
      isSpeakingRef.current = false
      setTimeout(() => {
        startRecognition()
      }, 800)
    }

    synthRef.current.cancel()
    synthRef.current.speak(utterence)
  }

  const playElevenLabs = async (text) => {
    try {
      const gender = (userData?.gender || "neutral").toLowerCase()
      console.log("Attempting ElevenLabs TTS with gender:", gender)

      const result = await axios.post(
        `${serverUrl}/api/user/tts`,
        { text, gender },
        { withCredentials: true }
      )

      const audioBase64 = result?.data?.audioBase64
      if (audioBase64) {
        console.log("ElevenLabs audio received, playing...")
        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`)
        isSpeakingRef.current = true
        audio.onended = () => {
          setAiText("")
          isSpeakingRef.current = false
          setTimeout(() => {
            startRecognition()
          }, 800)
        }
        audio.onerror = (error) => {
          console.error("Audio playback error:", error)
          setAiText("")
          isSpeakingRef.current = false
          setTimeout(() => {
            startRecognition()
          }, 800)
        }
        await audio.play()
        return
      } else {
        console.warn("No audio data received from ElevenLabs")
      }
    } catch (error) {
      console.error("ElevenLabs TTS error:", error)
      console.log("Falling back to browser speech synthesis")
    }

    // Fallback to browser speech synthesis
    speak(text)
  }



  const handleCommand = async (data) => {
    if (!data) return

    const { type, userInput, response } = data

    if (useElevenLabs) {
      await playElevenLabs(response)
    } else {
      speak(response)
    }

    if (type === 'google-search') {
      const query = encodeURIComponent(userInput)
      const googleUrl = `https://www.google.com/search?q=${query}`
      try {
        const popup = window.open(googleUrl, '_blank', 'noopener,noreferrer')
        if (!popup || popup.closed) {
          alert(`Google search for "${userInput}" opened in new tab.`)
        }
      } catch (error) {
        console.error('Google search popup failed:', error)
        alert(`Could not open Google search. Please search for "${userInput}" manually.`)
      }
    }
    if (type === 'calculator-open') {
      const calcUrl = `https://www.google.com/search?q=calculator`
      try {
        const popup = window.open(calcUrl, '_blank', 'noopener,noreferrer')
        if (!popup || popup.closed) {
          alert('Calculator opened in new tab.')
        }
      } catch (error) {
        console.error('Calculator popup failed:', error)
        alert('Could not open calculator. Please search for "calculator" on Google.')
      }
    }
    if (type === "instagram-open") {
      try {
        const popup = window.open(`https://www.instagram.com/`, '_blank', 'noopener,noreferrer')
        if (!popup || popup.closed) {
          alert('Instagram opened in new tab.')
        }
      } catch (error) {
        console.error('Instagram popup failed:', error)
        alert('Could not open Instagram.')
      }
    }
    if (type === "facebook-open") {
      try {
        const popup = window.open(`https://www.facebook.com/`, '_blank', 'noopener,noreferrer')
        if (!popup || popup.closed) {
          alert('Facebook opened in new tab.')
        }
      } catch (error) {
        console.error('Facebook popup failed:', error)
        alert('Could not open Facebook.')
      }
    }
    if (type === "weather-show") {
      // Weather is spoken via TTS above, no need to open Google
      console.log("Weather spoken:", response)
      return
    }
    if (type === 'youtube-search' || type === 'youtube-play') {
      let query = userInput

      if (query) {
        query = query
          .replace(/\b(youtube|yt|on youtube)\b/gi, '')
          .replace(/^\s*(search|find|play)\s+/i, '')
          .trim()
      }

      if (!query) {
        query = 'music'
      }

      const encodedQuery = encodeURIComponent(query)
      const youtubeUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`

      try {
        const popup = window.open(youtubeUrl, '_blank', 'noopener,noreferrer')
        if (!popup || popup.closed) {
          // Popup blocked or failed, show user-friendly message
          alert(`YouTube search for "${query}" opened in new tab. If popup was blocked, please allow popups for this site.`)
          // Try again with user interaction
          setTimeout(() => {
            window.open(youtubeUrl, '_blank', 'noopener,noreferrer')
          }, 100)
        }
      } catch (error) {
        console.error('YouTube popup failed:', error)
        alert(`Could not open YouTube. Please search for "${query}" manually on YouTube.`)
      }

      console.log('Opening YouTube with query:', query)
    }
  }

  useEffect(() => {
    if (!userData) return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognitionRef.current = recognition

    let isMounted = true

    recognition.onstart = () => {
      isRecognizingRef.current = true
      setListening(true)
    }

    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          startRecognition()
        }, 1000)
      }
    }

    recognition.onerror = (event) => {
      isRecognizingRef.current = false
      setListening(false)
    }

    recognition.onresult = async (e) => {
      if (!userData?.assistantName) return

      console.log("Speech event", e)

      const transcript =
        e.results[e.results.length - 1][0].transcript.trim()

      console.log("Final transcript", transcript)

      if (!transcript) return

      const textLower = transcript.toLowerCase()
      const assistantName = (userData?.assistantName || "assistant").toLowerCase()

      const shouldHandle =
        textLower.includes(assistantName) ||
        textLower.startsWith("assistant") ||
        textLower.startsWith("hey assistant") ||
        textLower.startsWith("hey") ||
        textLower.startsWith("ok")

      if (!shouldHandle) {
        console.log("Activation phrase not found; ignored")
        return
      }

      setUserText(transcript)
      recognition.stop()
      isRecognizingRef.current = false
      setListening(false)

      try {
        const data = await getGeminiResponse(transcript)
        console.log("AI Data:", data)
        handleCommand(data)
        setAiText(data?.response)
      } catch (error) {
        console.error("Gemini Error:", error)
        speak("Sorry, I'm having trouble connecting to the brain.")
      } finally {
        setUserText("")
      }
    }

    recognition.start()

    return () => {
      isMounted = false
      recognition.stop()
      isRecognizingRef.current = false
      setListening(false)
    }

  }, [userData])

  if (!userData) {
    return (
      <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center'>
        <h1 className='text-white text-[20px]'>Loading...</h1>
      </div>
    )
  }

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>

      {ham && (
        <div
          className='absolute inset-0 z-30'
          onClick={() => setHam(false)}
        />
      )}

      <div className='absolute top-6 right-6 text-white text-[28px] cursor-pointer z-50'>
        {ham ? (
          <RxCross1 onClick={() => setHam(false)} />
        ) : (
          <CgMenuRight onClick={() => setHam(true)} />
        )}
      </div>

      {ham && (
        <div className='absolute top-0 right-0 w-[220px] h-full bg-[#0a0a2e] flex flex-col items-start justify-center gap-[20px] px-[30px] z-40 shadow-lg'>
          <button
            onClick={() => { setHam(false); navigate("/customize") }}
            className='text-white text-[16px] font-semibold hover:text-blue-400 transition'
          >
            Customize Image
          </button>
          <button
            onClick={() => { setHam(false); navigate("/history") }}
            className='text-white text-[16px] font-semibold hover:text-blue-400 transition'
          >
            History
          </button>
          <button
            onClick={() => { setHam(false); handleLogOut() }}
            className='text-white text-[16px] font-semibold hover:text-red-400 transition'
          >
            Log Out
          </button>
        </div>
      )}

      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData.assistantImage || userImg} alt="assistant" className='h-full object-cover' />
      </div>

      <h1 className='text-white text-[18px] font-semibold'>
        I'm {userData.assistantName || "Assistant"}
      </h1>

      {!aiText && <img src={userImg} alt="" className='w-[200px]' />}
      {aiText && <img src={aiImg} alt="" className='w-[200px]' />}

      <h1 className='text-white text-[18px] font-semibold'>
        {userText ? userText : aiText ? aiText : null}
      </h1>

    </div>
  )
}

export default Home