import axios from "axios"
import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import moment from "moment"

const getWeatherForLocation = async () => {
  try {
    const geo = await axios.get("https://geolocation-db.com/json/")

    const lat = (geo?.data?.latitude != null) ? geo.data.latitude : 28.6139
    const lon = (geo?.data?.longitude != null) ? geo.data.longitude : 77.2090

    const weather = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    )

    const cw = weather?.data?.current_weather
    if (!cw) {
      console.error("Weather data missing in response")
      return null
    }

    return `Current temp ${cw.temperature}°C, wind ${cw.windspeed} km/h, conditions code ${cw.weathercode}.`
  } catch (err) {
    console.error("Weather fetch error", err)
    return null
  }
}

const fetchElevenLabsAudioBase64 = async (text, voiceIdInput = null) => {
  const key = process.env.ELEVENLABS_API_KEY
  const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"
  const voiceId = voiceIdInput || defaultVoiceId

  console.log("fetchElevenLabsAudioBase64 - Text:", text, "VoiceIdInput:", voiceIdInput, "Final VoiceId:", voiceId)

  if (!key) {
    throw new Error("ELEVENLABS_API_KEY not configured")
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`

  const response = await axios.post(
    url,
    {
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    },
    {
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      responseType: "arraybuffer",
    }
  )

  return Buffer.from(response.data, "binary").toString("base64")
}

const buildLocalAssistantFallback = (command) => {
    const normalized = command.toLowerCase().trim()

    const stripPrefix = (value) => {
        return value
            .replace(/^(search|find|play|open|show)\s+/i, "")
            .replace(/^(on|in)\s+(google|youtube)\s+/i, "")
            .trim()
    }

    if (/\b(date|today'?s date)\b/i.test(normalized)) {
        return {
            type: "get-date",
            userInput: command,
            response: `current date is ${moment().format("YYYY-MM-DD")}`
        }
    }

    if (/\b(time|current time|what time)\b/i.test(normalized)) {
        return {
            type: "get-time",
            userInput: command,
            response: `current time is ${moment().format("hh:mm A")}`
        }
    }

    if (/\b(day|today)\b/i.test(normalized) && /\b(what|which|is)\b/i.test(normalized)) {
        return {
            type: "get-day",
            userInput: command,
            response: `today is ${moment().format("dddd")}`
        }
    }

    if (/\b(month)\b/i.test(normalized)) {
        return {
            type: "get-month",
            userInput: command,
            response: `this month is ${moment().format("MMMM")}`
        }
    }

    if (/\bcalculator\b/i.test(normalized)) {
        return {
            type: "calculator-open",
            userInput: "calculator",
            response: "Opening calculator search now."
        }
    }

    if (/\binstagram\b/i.test(normalized)) {
        return {
            type: "instagram-open",
            userInput: "instagram",
            response: "Opening Instagram."
        }
    }

    if (/\bfacebook\b/i.test(normalized)) {
        return {
            type: "facebook-open",
            userInput: "facebook",
            response: "Opening Facebook."
        }
    }

    if (/\bweather\b/i.test(normalized)) {
        const cleanedWeatherQuery = normalized
            .replace(/\b(show|tell|give|what(?:'s| is)|can you|please|today'?s|update|updates)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim()

        return {
            type: "weather-show",
            userInput: cleanedWeatherQuery || "weather today",
            response: "Fetching weather now."
        }
    }

    if (/\b(youtube|yt)\b/i.test(normalized)) {
        const cleaned = stripPrefix(
            normalized
                .replace(/\b(search|find)\b.*\bon\s+youtube\b/i, "")
                .replace(/\b(play|search|find)\b/i, "")
                .replace(/\byoutube\b|\byt\b/gi, "")
                .trim()
        )

        return {
            type: /\bplay\b/i.test(normalized) ? "youtube-play" : "youtube-search",
            userInput: cleaned && cleaned.length > 0 ? cleaned : "popular",
            response: /\bplay\b/i.test(normalized) ? "Playing on YouTube now." : "Searching YouTube."
        }
    }

    if (/\bgoogle\b/i.test(normalized) || /\b(search|find)\b/i.test(normalized)) {
        const cleaned = stripPrefix(
            normalized
                .replace(/\b(search|find)\b/i, "")
                .replace(/\bon\s+google\b/i, "")
                .replace(/\bgoogle\b/i, "")
                .trim()
        )

        return {
            type: "google-search",
            userInput: cleaned || command,
            response: "Searching that on Google."
        }
    }

    return {
        type: "general",
        userInput: command,
        response: "I heard you. Smart answers are temporarily limited, but basic commands still work."
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.error('getCurrentUser: missing req.user or req.user.id')
            return res.status(401).json({ message: 'Invalid token or user not authenticated' })
        }
        const userId = req.user.id
        const user = await User.findById(userId).select("-password")
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        console.error('getCurrentUser error:', error)
        return res.status(500).json({ message: error.message || "get current user error" })
    }
}

export const updateAssistant = async (req, res) => {
    try {
        const assistantName = req.body.assistantName
        const gender = req.body.gender
        const updateFields = {}

        if (assistantName) {
            updateFields.assistantName = assistantName
        }

        if (gender && ["male", "female", "neutral"].includes(gender)) {
            updateFields.gender = gender
        }

        if (req.file) {
            const cloudinaryResult = await uploadOnCloudinary(req.file.path)
            if (!cloudinaryResult || !cloudinaryResult.secure_url) {
                return res.status(500).json({ message: "Image upload failed" })
            }
            updateFields.assistantImage = cloudinaryResult.secure_url
        } else if (req.body.imageUrl) {
            updateFields.assistantImage = req.body.imageUrl
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No valid fields provided to update" })
        }

        // FIX: replaced deprecated { new: true } with { returnDocument: 'after' }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateFields,
            { returnDocument: 'after' }
        ).select("-password")

        return res.status(200).json(user)
    } catch (error) {
        console.error("Update error:", error)
        return res.status(500).json({ message: "updateAssistant error: " + error.message })
    }
}

export const askToAssistant = async (req, res) => {
    try {
        const { command } = req.body
        if (!command || typeof command !== "string") {
            return res.status(400).json({ response: "Please say a valid command." })
        }
        console.log("Asking Assistant for user ID:", req.user.id)
        const user = await User.findById(req.user.id)
        if (!user) {
            console.error("User not found for ID:", req.user.id)
            return res.status(404).json({ message: "User not found" })
        }

        if (user.history.length >= 50) {
            user.history = user.history.slice(-49)
        }
        user.history.push(command)
        await user.save()

        const userName = user.name
        const assistantName = user.assistantName || "Assistant"

        console.log("Calling Gemini with command:", command)
        let result
        try {
            result = await geminiResponse(command, assistantName, userName)
        } catch (error) {
            console.error('Gemini call failed:', error.message)
            return res.status(200).json(buildLocalAssistantFallback(command))
        }

        console.log("Gemini Result:", result)
        const jsonMatch = result.match(/{[\s\S]*}/)
        if (!jsonMatch) {
            console.error('Gemini result not a JSON:', result)
            return res.status(200).json(buildLocalAssistantFallback(command))
        }

        let gemResult
        try {
            gemResult = JSON.parse(jsonMatch[0])
        } catch (err) {
            console.error('JSON parse error:', err, 'Result:', result)
            return res.status(200).json(buildLocalAssistantFallback(command))
        }

        const type = gemResult.type

        // FIX: normalize empty userInput from model to the original command
        // so downstream handlers always have a non-empty search term
        const safeUserInput = gemResult.userInput?.trim() || command

        switch (type) {
            case 'get-date':
                return res.json({
                    type,
                    userInput: safeUserInput,
                    response: `current date is ${moment().format("YYYY-MM-DD")}`
                })
            case 'get-time':
                return res.json({
                    type,
                    userInput: safeUserInput,
                    response: `current time is ${moment().format("hh:mm A")}`
                })
            case 'get-day':
                return res.json({
                    type,
                    userInput: safeUserInput,
                    response: `today is ${moment().format("dddd")}`
                })
            case 'get-month':
                return res.json({
                    type,
                    userInput: safeUserInput,
                    response: `this month is ${moment().format("MMMM")}`
                })
            case 'google-search':
            case 'youtube-search':
            case 'youtube-play':
            case 'general':
            case "calculator-open":
            case "instagram-open":
            case "facebook-open":
                return res.json({
                    type,
                    userInput: safeUserInput,
                    response: gemResult.response,
                })
            case "weather-show": {
                const weatherText = await getWeatherForLocation()
                if (weatherText) {
                    return res.json({
                        type,
                        userInput: safeUserInput,
                        response: weatherText
                    })
                }
                return res.json({
                    type,
                    userInput: safeUserInput,
                    response: "Unable to get live weather. Showing quick search."
                })
            }
            default:
                console.warn('Unexpected type from Groq:', type, 'Falling back to local assistant')
                return res.status(200).json(buildLocalAssistantFallback(command))
        }
    } catch (error) {
        console.error("askToAssistant error:", error)
        return res.status(500).json({ response: "ask assistant error" })
    }
}

export const elevenlabsTts = async (req, res) => {
  try {
    const { text, gender } = req.body
    console.log("ElevenLabs TTS request - Text:", text, "Gender:", gender)

    let voiceId
    if (gender === "female") {
      voiceId = process.env.ELEVENLABS_VOICE_ID_FEMALE || "EXAVITQu4vr4xnSDxMaL"
      console.log("Selected female voice ID:", voiceId)
    } else if (gender === "male") {
      voiceId = process.env.ELEVENLABS_VOICE_ID_MALE || "ErXwobaYiN019PkySvjV"
      console.log("Selected male voice ID:", voiceId)
    } else {
      voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"
      console.log("Selected default voice ID:", voiceId)
    }

    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Text is required" })
    }

    const audioBase64 = await fetchElevenLabsAudioBase64(text, voiceId)
    return res.status(200).json({ audioBase64 })
  } catch (error) {
    console.error("elevenlabsTts route error:", error)
    return res.status(500).json({ message: error.message || "ElevenLabs TTS error" })
  }
}