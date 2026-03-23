import axios from "axios"

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiKey = process.env.GROQ_API_KEY
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant"

    if (!apiKey) throw new Error("GROQ_API_KEY not configured")

    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}.
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
  "userInput": "<cleaned search query without youtube/google references>",
  "response": "<a short spoken response to read out loud to the user>"
}

Instructions:
- "type": determine the intent of the user.
- "userInput": For search queries, extract ONLY the search term (remove "youtube", "google", "search", "play" etc). Example: user says "search cat videos on youtube" -> userInput should be "cat videos"
- "response": A short voice-friendly reply, e.g., "Sure, playing it now", "Here's what I found", "Today is Tuesday", etc.

Type meanings:
- "general": factual or informational question that doesn't require external search
- "google-search": user wants to search something on Google
- "youtube-search": user wants to search videos on YouTube
- "youtube-play": user wants to directly play a video or song on YouTube
- "calculator-open": user wants to open a calculator
- "instagram-open": user wants to open Instagram
- "facebook-open": user wants to open Facebook
- "weather-show": user wants to know the weather
- "get-time": user asks for current time
- "get-date": user asks for today's date
- "get-day": user asks what day it is
- "get-month": user asks for the current month

CRITICAL EXAMPLES for YouTube:
- User: "play music on youtube" -> type: "youtube-play", userInput: "music"
- User: "search funny videos on youtube" -> type: "youtube-search", userInput: "funny videos"
- User: "play despacito" -> type: "youtube-play", userInput: "despacito"

Important:
- If the user asks who created you or who made you, respond that you were created by ${userName}.
- Only respond with the JSON object, nothing else. No extra text, no markdown, no code fences.

User input: ${command}`

    console.log("Calling Groq API:", `${model} (${apiKey.substring(0, 5)}...)`)

    const result = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    )

    const content = result?.data?.choices?.[0]?.message?.content
    if (!content || typeof content !== "string") {
      throw new Error("No text response from Groq")
    }

    let responseText = content.trim()
    responseText = responseText.replace(/```json\n?|\n?```/g, "").trim()

    // Validate that the response is parseable JSON before returning
    JSON.parse(responseText)

    return responseText
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data
    if (status) {
      console.error("Groq API failure:", status, JSON.stringify(data, null, 2))
    } else {
      console.error("Groq API failure:", error.message)
    }
    throw new Error("AI assistant unavailable")
  }
}

// FIXED: Correct ElevenLabs auth header (xi-api-key instead of Authorization Bearer)
// FIXED: Added API key existence check
// FIXED: Added try/catch for proper error handling
// FIXED: Exported so it can be used in other files
export const eleven = async (text) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured")

    const r = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream",
      { text },
      {
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    )

    return Buffer.from(r.data, "binary").toString("base64")
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data
    if (status) {
      console.error("ElevenLabs API failure:", status, JSON.stringify(data, null, 2))
    } else {
      console.error("ElevenLabs API failure:", error.message)
    }
    throw new Error("Text-to-speech unavailable")
  }
}

export default geminiResponse