// ==========================================
// COMPANION AI
// Main Application
// ==========================================

// ==========================================
// CATEGORY INFORMATION
// ==========================================

const categories = {

    chat: {
        name: "Chat",
        icon: "💬",
        description: "General conversation",
        placeholder: "Talk about anything..."
    },

    tutor: {
        name: "Tutor",
        icon: "🎓",
        description: "Learn step by step",
        placeholder: "What would you like to learn?"
    },

    study: {
        name: "Study",
        icon: "📚",
        description: "Study and preparation",
        placeholder: "What are you studying?"
    },

    science: {
        name: "Science",
        icon: "🔬",
        description: "Explore science",
        placeholder: "Ask a science question..."
    },

    mathematics: {
        name: "Mathematics",
        icon: "➗",
        description: "Solve and understand mathematics",
        placeholder: "Enter a mathematics problem..."
    },

    coding: {
        name: "Coding",
        icon: "💻",
        description: "Programming and technology",
        placeholder: "Ask a coding question..."
    },

    ideas: {
        name: "Ideas",
        icon: "💡",
        description: "Brainstorm and create",
        placeholder: "What's your idea?"
    },

    career: {
        name: "Career",
        icon: "💼",
        description: "Career and future planning",
        placeholder: "What are you thinking about?"
    },

    general: {
        name: "General",
        icon: "🌎",
        description: "General knowledge",
        placeholder: "Ask anything..."
    }

};


// ==========================================
// APPLICATION STATE
// ==========================================

let currentCategory = "chat";

// Conversation history
let conversationHistory = [];

// Prevent multiple simultaneous sends
let isWaitingForAI = false;


// ==========================================
// GET ELEMENTS
// ==========================================

const categoryButtons =
    document.querySelectorAll(".category");

const categoryIcon =
    document.getElementById("categoryIcon");

const categoryName =
    document.getElementById("categoryName");

const categoryDescription =
    document.getElementById("categoryDescription");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const messages =
    document.getElementById("messages");

const newChatButton =
    document.getElementById("newChat");


// ==========================================
// CHECK REQUIRED ELEMENTS
// ==========================================

if (!messageInput) {
    console.error("Companion AI: #messageInput was not found.");
}

if (!sendButton) {
    console.error("Companion AI: #sendButton was not found.");
}

if (!messages) {
    console.error("Companion AI: #messages was not found.");
}


// ==========================================
// CATEGORY SELECTION
// ==========================================

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        const category =
            button.dataset.category;

        if (categories[category]) {
            selectCategory(category);
        }

    });

});


function selectCategory(category) {

    if (!categories[category]) {
        return;
    }

    currentCategory = category;

    // Reset conversation when switching category
    conversationHistory = [];

    const data =
        categories[category];


    // Remove active state

    categoryButtons.forEach(button => {

        button.classList.remove("active");

    });


    // Activate selected category

    const selectedButton =
        document.querySelector(
            `[data-category="${category}"]`
        );

    if (selectedButton) {

        selectedButton.classList.add("active");

    }


    // Update header

    if (categoryIcon) {
        categoryIcon.textContent =
            data.icon;
    }

    if (categoryName) {
        categoryName.textContent =
            data.name;
    }

    if (categoryDescription) {
        categoryDescription.textContent =
            data.description;
    }


    // Update input placeholder

    if (messageInput) {
        messageInput.placeholder =
            data.placeholder;
    }


    // Show category welcome

    showWelcome(data);

}


// ==========================================
// SHOW WELCOME SCREEN
// ==========================================

function showWelcome(data) {

    if (!messages) {
        return;
    }

    messages.innerHTML = `

        <div class="welcome">

            <div class="welcome-icon">
                ${data.icon}
            </div>

            <h1>
                ${escapeHTML(data.name)}
            </h1>

            <p>
                ${escapeHTML(data.description)}

                <br><br>

                Ask me anything and
                let's explore it together.
            </p>

        </div>

    `;

}


// ==========================================
// SEND BUTTON
// ==========================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );

}


// ==========================================
// ENTER KEY
// ==========================================

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    if (isWaitingForAI) {
        return;
    }


    const text =
        messageInput.value.trim();


    // Don't send empty messages

    if (!text) {
        return;
    }


    // Remove welcome screen

    const welcome =
        document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }


    // Add user message

    addMessage(
        text,
        "user"
    );


    // Add user message to history

    conversationHistory.push({
        role: "user",
        content: text
    });


    // Clear input

    messageInput.value = "";

    messageInput.style.height =
        "42px";


    // Disable sending

    isWaitingForAI = true;

    setSendButtonState(true);


    // Show typing indicator

    showTyping();


    try {

        // ==================================
        // SEND TO EXPRESS BACKEND
        // ==================================

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: text,

                        category:
                            currentCategory,

                        history:
                            conversationHistory

                    })

                }
            );


        // ==================================
        // CHECK HTTP RESPONSE
        // ==================================

        if (!response.ok) {

            let errorMessage =
                `Server error (${response.status})`;

            try {

                const errorData =
                    await response.json();

                if (errorData.error) {
                    errorMessage =
                        errorData.error;
                }

            } catch {

                // Ignore JSON parsing error

            }

            throw new Error(errorMessage);

        }


        // ==================================
        // READ JSON
        // ==================================

        const data =
            await response.json();


        // ==================================
        // VALIDATE AI RESPONSE
        // ==================================

        if (
            !data ||
            !data.reply ||
            !data.reply.trim()
        ) {

            throw new Error(
                "The AI returned an empty response."
            );

        }


        // ==================================
        // HIDE TYPING
        // ==================================

        hideTyping();


        // ==================================
        // SHOW AI RESPONSE
        // ==================================

        addMessage(
            data.reply,
            "assistant"
        );


        // ==================================
        // SAVE AI RESPONSE
        // ==================================

        conversationHistory.push({
            role: "assistant",
            content: data.reply
        });


    } catch (error) {

        console.error(
            "Companion AI error:",
            error
        );


        hideTyping();


        addMessage(
            "⚠️ I couldn't connect to the AI right now. " +
            "Please check that the Companion AI server is running.",
            "assistant"
        );

    } finally {

        isWaitingForAI = false;

        setSendButtonState(false);

        messageInput.focus();

    }

}


// ==========================================
// SEND BUTTON STATE
// ==========================================

function setSendButtonState(disabled) {

    if (!sendButton) {
        return;
    }

    sendButton.disabled =
        disabled;

    if (disabled) {

        sendButton.style.opacity =
            "0.6";

        sendButton.style.cursor =
            "wait";

    } else {

        sendButton.style.opacity =
            "";

        sendButton.style.cursor =
            "";

    }

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, type) {

    if (!messages) {
        return;
    }


    const message =
        document.createElement("div");

    message.className =
        `message ${type}`;


    // ==================================
    // MESSAGE BUBBLE
    // ==================================

    const avatar =
        document.createElement("div");

    avatar.className =
        "avatar";


    if (type === "user") {

        avatar.textContent =
            "You";

    } else {

        avatar.textContent =
            "✦";

    }


    const bubble =
        document.createElement("div");

    bubble.className =
        "bubble";


    // IMPORTANT:
    // textContent prevents HTML injection.

    bubble.textContent =
        text;


    if (type === "user") {

        message.appendChild(
            bubble
        );

        message.appendChild(
            avatar
        );

    } else {

        message.appendChild(
            avatar
        );

        message.appendChild(
            bubble
        );

    }


    messages.appendChild(
        message
    );


    // Scroll to newest message

    messages.scrollTop =
        messages.scrollHeight;

}


// ==========================================
// TYPING INDICATOR
// ==========================================

function showTyping() {

    if (!messages) {
        return;
    }


    // Don't create duplicates

    if (
        document.getElementById(
            "typingMessage"
        )
    ) {
        return;
    }


    const typing =
        document.createElement("div");


    typing.id =
        "typingMessage";

    typing.className =
        "message assistant";


    typing.innerHTML = `

        <div class="avatar">
            ✦
        </div>

        <div class="typing">

            <span></span>
            <span></span>
            <span></span>

        </div>

    `;


    messages.appendChild(
        typing
    );


    messages.scrollTop =
        messages.scrollHeight;

}


// ==========================================
// HIDE TYPING
// ==========================================

function hideTyping() {

    const typing =
        document.getElementById(
            "typingMessage"
        );


    if (typing) {

        typing.remove();

    }

}


// ==========================================
// NEW CHAT
// ==========================================

if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        () => {

            // Clear conversation

            conversationHistory = [];


            // Restore welcome

            showWelcome(
                categories[currentCategory]
            );


            // Clear input

            messageInput.value = "";

            messageInput.style.height =
                "42px";


            messageInput.focus();

        }
    );

}


// ==========================================
// AUTO-RESIZE TEXTAREA
// ==========================================

if (messageInput) {

    messageInput.addEventListener(
        "input",
        function () {

            this.style.height =
                "42px";


            this.style.height =
                Math.min(
                    this.scrollHeight,
                    140
                ) + "px";

        }
    );

}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


// ==========================================
// INITIALIZE
// ==========================================

function initializeCompanionAI() {

    // Set default category

    selectCategory(
        currentCategory
    );


    // Focus input

    if (messageInput) {
        messageInput.focus();
    }


    console.log(
        "🤖 Companion AI frontend initialized."
    );

}


// ==========================================
// START
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCompanionAI
    );

} else {

    initializeCompanionAI();

}