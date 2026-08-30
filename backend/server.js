import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// ======================================================
// PATH SETUP
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// EXPRESS
// ======================================================

const app = express();

const PORT = process.env.PORT || 3000;

// ======================================================
// API KEY
// ======================================================

if (!process.env.GEMINI_API_KEY) {
    console.error("");
    console.error("❌ GEMINI_API_KEY is missing.");
    console.error("Check: backend/.env");
    console.error("");
    process.exit(1);
}

// ======================================================
// GEMINI
// ======================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(
    express.json({
        limit: "1mb"
    })
);

// ======================================================
// FRONTEND
// ======================================================

const frontendPath = path.join(__dirname, "..");

app.use(express.static(frontendPath));

// ======================================================
// AI PERSONALITIES
// ======================================================

const instructions = {

    chat: `
You are Companion AI, a friendly general-purpose AI companion.

Have natural, helpful conversations.
Be clear, respectful, supportive and human-like.

Remember relevant information from the conversation.
Do not pretend to be human.
`,

    tutor: `
You are the Tutor inside Companion AI.

Teach step by step.
Adapt explanations to the student's level.
Use simple examples.
Help the student understand rather than simply giving answers.

Ask useful questions when appropriate.
`,

    study: `
You are a study assistant.

Help students understand subjects,
revise lessons, create study plans,
make practice questions and prepare for exams.

Break difficult subjects into manageable steps.
`,

    science: `
You are a science tutor.

Explain scientific concepts accurately.
Start with fundamentals and gradually move toward
deeper explanations.

Use real-world examples whenever useful.
`,

    mathematics: `
You are a mathematics tutor.

Solve problems step by step.
Explain the reasoning behind important steps.
Check calculations carefully.

Do not skip important reasoning.
`,

    coding: `
You are a programming tutor and software development assistant.

Help users learn programming,
debug code, design applications and understand
software development concepts.

When providing code:
- Explain what it does.
- Explain where to put it.
- Explain how to run it.
- Point out important errors or improvements.
`,

    ideas: `
You are an innovation and brainstorming assistant.

Help turn ideas into practical projects.

Explore:
- Problem
- Solution
- Users
- Features
- Technology
- Feasibility
- Cost
- Improvements
- Future possibilities

Be creative but realistic.
`,

    career: `
You are a career guidance assistant.

Help users explore careers, skills,
education, projects and career paths.

Give practical and realistic guidance.
`,

    general: `
You are a knowledgeable general-purpose assistant.

Answer questions clearly.
Explain difficult concepts in an understandable way.
Use examples when useful.
`

};

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        status: "online",
        service: "Companion AI",
        gemini: "configured",
        model: "gemini-3.6-flash"
    });

});

// ======================================================
// CHAT API
// ======================================================

app.post("/api/chat", async (req, res) => {

    try {

        const {
            message,
            category = "chat",
            history = []
        } = req.body;

        // ==================================================
        // VALIDATE MESSAGE
        // ==================================================

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {

            return res.status(400).json({

                success: false,

                error: "Message is required."

            });

        }

        // ==================================================
        // CATEGORY
        // ==================================================

        const selectedCategory =
            instructions[category]
                ? category
                : "chat";

        const systemInstruction =
            instructions[selectedCategory];

        // ==================================================
        // CONVERSATION HISTORY
        // ==================================================

        const safeHistory =
            Array.isArray(history)
                ? history
                    .filter(item => {

                        return (
                            item &&
                            typeof item.role === "string" &&
                            (
                                typeof item.content === "string" ||
                                typeof item.text === "string"
                            )
                        );

                    })
                    .slice(-20)
                : [];

        const contents = [];

        for (const item of safeHistory) {

            // Support both:
            // content
            // text

            const text =
                typeof item.content === "string"
                    ? item.content
                    : item.text;

            if (!text || !text.trim()) {
                continue;
            }

            contents.push({

                role:
                    item.role === "assistant" ||
                    item.role === "model"
                        ? "model"
                        : "user",

                parts: [
                    {
                        text: text.trim()
                    }
                ]

            });

        }

        // ==================================================
        // CURRENT USER MESSAGE
        // ==================================================

        contents.push({

            role: "user",

            parts: [
                {
                    text: message.trim()
                }
            ]

        });

        // ==================================================
        // GEMINI REQUEST
        // ==================================================

        console.log("");
        console.log("🤖 Gemini request");
        console.log("Category:", selectedCategory);
        console.log("History:", safeHistory.length);
        console.log("Message:", message.trim());

        const response =
            await ai.models.generateContent({

                model: "gemini-3.6-flash",

                contents,

                config: {

                    systemInstruction,

                    temperature: 0.7,

                    maxOutputTokens: 2048

                }

            });

        // ==================================================
        // GET RESPONSE
        // ==================================================

        const reply =
            response.text?.trim();

        // ==================================================
        // EMPTY RESPONSE
        // ==================================================

        if (!reply) {

            console.error(
                "❌ Gemini returned an empty response."
            );

            return res.status(500).json({

                success: false,

                error:
                    "Gemini returned an empty response."

            });

        }

        // ==================================================
        // SEND RESPONSE
        // ==================================================

        console.log("✅ Gemini response received");

        return res.json({

            success: true,

            reply,

            category: selectedCategory

        });

    }

    // ======================================================
    // ERROR HANDLING
    // ======================================================

    catch (error) {

        console.error("");
        console.error("======================================");
        console.error("❌ GEMINI REQUEST FAILED");
        console.error("======================================");

        console.error(
            "Name:",
            error?.name
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "Status:",
            error?.status
        );

        console.error(
            "Code:",
            error?.code
        );

        console.error(
            "Cause:",
            error?.cause
        );

        console.error("======================================");
        console.error("");

        return res.status(500).json({

            success: false,

            error:
                error?.message ||
                "Companion AI could not respond."

        });

    }

});

// ======================================================
// API 404
// ======================================================

app.use("/api", (req, res) => {

    return res.status(404).json({

        success: false,

        error: "API endpoint not found."

    });

});

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("          COMPANION AI");
    console.log("======================================");
    console.log("");
    console.log("✅ Server is running");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("");
    console.log("🤖 Gemini AI: Configured");
    console.log("🧠 Model: gemini-3.6-flash");
    console.log("💬 Conversation memory: Enabled");
    console.log("======================================");
    console.log("");

});