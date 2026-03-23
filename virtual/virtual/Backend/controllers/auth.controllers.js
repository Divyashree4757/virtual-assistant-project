import genToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "email already exists !" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be at least 6 characters !" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      password: hashedPassword,
      email,
      assistantName: name,  // ✅ FIXED: Frontend expects this
      assistantImage: "",   // ✅ FIXED: Frontend expects this
    });

    const token = genToken(user._id);  // ✅ FIXED: No await needed

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",  // ✅ FIXED: Localhost works
      secure: process.env.NODE_ENV === "production",                    // ✅ FIXED: Localhost works
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        assistantName: user.assistantName,
        assistantImage: user.assistantImage,
        history: user.history || []
      }
    });
  } catch (error) {
    console.error('signUp error:', error)
    return res.status(500).json({ message: error.message || 'signUp internal error' });  // log full error
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "email does not exists !" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "incorrect password" });
    }

    const token = genToken(user._id);  // ✅ FIXED: No await needed

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        assistantName: user.assistantName,
        assistantImage: user.assistantImage,
        history: user.history || []
      }
    });
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: error.message || 'login internal error' });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "log out successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
