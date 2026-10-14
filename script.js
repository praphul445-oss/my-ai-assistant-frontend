```javascript
/* =========================================================
   MY AI ASSISTANT
   Authentication + Chatbot + PDF/RAG + Supabase Cloud History
   Hardware Status Integration (v9.2)
   ========================================================= */

/* 1. SUPABASE */

const SUPABASE_URL =
    "https://jjuuilevlddifxoitffp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_eQFWdaObL0JtrBmkwqJ_sw_lzbtjt-I";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

/* 2. BACKEND */

const BACKEND_URL =
    "https://ai-chatbot-website-zlqu.onrender.com";

/* 3. AUTH TOKEN HELPERS */

async function getAccessToken() {
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error || !data || !data.session) {
        return null;
    }

    return data.session.access_token;
}

async function handleSessionExpired() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.warn("Sign out failed:", error);
    }

    showLoginScreen();
    alert("Your session expired. Please log in again.");
}

/* 4. VARIABLES */

let userInput;
let chatbox;
let sendButton;
let pdfInput;
let imageInput;
let uploadStatus;
let attachmentMenu;

let welcomeScreen;
let authScreen;
let appShell;
let authMessage;

let loginButton;
let signupButton;
let userEmail;
let userAvatar;
let sidebarOverlay;

let currentUserId = null;
let currentMessages = [];
let currentConversationId = null;

const LOGO_SRC =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg stroke='%2339ff8c' stroke-width='4' stroke-linecap='round'%3E%3Cline x1='30' y1='6' x2='30' y2='20'/%3E%3Cline x1='50' y1='6' x2='50' y2='20'/%3E%3Cline x1='70' y1='6' x2='70' y2='20'/%3E%3Cline x1='30' y1='80' x2='30' y2='94'/%3E%3Cline x1='50' y1='80' x2='50' y2='94'/%3E%3Cline x1='70' y1='80' x2='70' y2='94'/%3E%3Cline x1='6' y1='30' x2='20' y2='30'/%3E%3Cline x1='6' y1='50' x2='20' y2='50'/%3E%3Cline x1='6' y1='70' x2='20' y2='70'/%3E%3Cline x1='80' y1='30' x2='94' y2='30'/%3E%3Cline x1='80' y1='50' x2='94' y2='50'/%3E%3Cline x1='80' y1='70' x2='94' y2='70'/%3E%3C/g%3E%3Crect x='20' y='20' width='60' height='60' rx='10' fill='%230b0f14' stroke='%2300e5ff' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='10' fill='none' stroke='%2300e5ff' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%2339ff8c'/%3E%3Cline x1='50' y1='32' x2='50' y2='40' stroke='%2339ff8c' stroke-width='4' stroke-linecap='round'/%3E%3Cline x1='50' y1='60' x2='50' y2='68' stroke='%2339ff8c' stroke-width='4' stroke-linecap='round'/%3E%3Cline x1='32' y1='50' x2='40' y2='50' stroke='%2339ff8c' stroke-width='4' stroke-linecap='round'/%3E%3Cline x1='60' y1='50' x2='68' y2='50' stroke='%2339ff8c' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E";

/* 5. INITIALIZATION */

document.addEventListener("DOMContentLoaded", async function () {
    userInput = document.getElementById("userInput");
    chatbox = document.getElementById("chatbox");
    sendButton = document.getElementById("sendButton");
    pdfInput = document.getElementById("pdfInput");
    imageInput = document.getElementById("imageInput");
    uploadStatus = document.getElementById("uploadStatus");
    attachmentMenu = document.getElementById("attachmentMenu");

    welcomeScreen = document.getElementById("welcomeScreen");
    authScreen = document.getElementById("authScreen");
    appShell = document.getElementById("appShell");
    authMessage = document.getElementById("authMessage");

    loginButton = document.getElementById("loginButton");
    signupButton = document.getElementById("signupButton");
    userEmail = document.getElementById("userEmail");
    userAvatar = document.getElementById("userAvatar");
    sidebarOverlay = document.getElementById("sidebarOverlay");

    if (pdfInput) {
        pdfInput.addEventListener("change", function () {
            if (pdfInput.files && pdfInput.files.length > 0) {
                uploadPDF(pdfInput.files[0]);
            }
        });
    }

    if (imageInput) {
        imageInput.addEventListener("change", function () {
            if (imageInput.files && imageInput.files.length > 0) {
                handleImageSelected(imageInput.files[0]);
            }
        });
    }

    if (userInput) {
        userInput.addEventListener("input", autoResizeInput);

        userInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            showLoginScreen();
            return;
        }

        if (data && data.session && data.session.user) {
            showApp(data.session.user);
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error("Authentication initialization error:", error);
        showLoginScreen();
    }
});

/* 6. LOGIN SCREEN */

function showLoginScreen() {
    if (welcomeScreen) welcomeScreen.hidden = false;
    if (authScreen) authScreen.hidden = true;
    if (appShell) appShell.hidden = true;

    currentUserId = null;
    currentConversationId = null;
    currentMessages = [];

    resetChatboxToWelcome();
    closeSidebar();
    clearAuthMessage();
}

/* 7. RESET CHATBOX */

function resetChatboxToWelcome() {
    if (!chatbox) return;

    chatbox.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <img src="${LOGO_SRC}" alt="AI logo" width="56" height="56">
            </div>
            <h2>How can I help you?</h2>
            <p>Ask me anything or upload a document to work with your knowledge base.</p>
        </div>
    `;
}

/* 8. AUTH SCREENS */

function openAuthScreen(form) {
    if (welcomeScreen) welcomeScreen.hidden = true;
    if (authScreen) authScreen.hidden = false;
    showAuthForm(form || "login");
}

function backToWelcome() {
    if (authScreen) authScreen.hidden = true;
    if (welcomeScreen) welcomeScreen.hidden = false;
    clearAuthMessage();
}

/* 9. SHOW APPLICATION */

function showApp(user) {
    if (!user || !user.id) return;

    if (welcomeScreen) welcomeScreen.hidden = true;
    if (authScreen) authScreen.hidden = true;
    if (appShell) appShell.hidden = false;

    const differentUser = currentUserId !== user.id;

    if (differentUser) {
        currentMessages = [];
        currentConversationId = null;
        resetChatboxToWelcome();
    }

    currentUserId = user.id;
    updateUserDisplay(user);
    autoResizeInput();

    setTimeout(function () {
        loadHistoryList();
    }, 100);
}

/* 10. USER DISPLAY */

function updateUserDisplay(user) {
    if (!user) return;

    const email = user.email || "User";

    if (userEmail) userEmail.textContent = email;
    if (userAvatar) userAvatar.textContent = email.charAt(0).toUpperCase();
}

/* 11. AUTH FORMS */

function showAuthForm(form) {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");

    clearAuthMessage();

    if (!loginForm || !signupForm || !loginTab || !signupTab) {
        console.error("Authentication form elements not found.");
        return;
    }

    if (form === "login") {
        loginForm.classList.add("active");
        signupForm.classList.remove("active");
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
    } else {
        signupForm.classList.add("active");
        loginForm.classList.remove("active");
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
    }
}

function showAuthMessage(message, type = "") {
    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.className = "auth-message";

    if (type) authMessage.classList.add(type);
}

function clearAuthMessage() {
    if (!authMessage) return;

    authMessage.textContent = "";
    authMessage.className = "auth-message";
}

/* 12. LOGIN */

async function loginUser(event) {
    event.preventDefault();

    const emailElement = document.getElementById("loginEmail");
    const passwordElement = document.getElementById("loginPassword");

    if (!emailElement || !passwordElement) {
        showAuthMessage("Login form could not be loaded.", "error");
        return;
    }

    const email = emailElement.value.trim();
    const password = passwordElement.value;

    if (!email || !password) {
        showAuthMessage("Please enter your email and password.", "error");
        return;
    }

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
    }

    clearAuthMessage();

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            console.error("Login error:", error);
            showAuthMessage(error.message || "Login failed.", "error");
            return;
        }

        if (!data || !data.user) {
            showAuthMessage("Login failed: no user session was returned.", "error");
            return;
        }

        showAuthMessage("Login successful.", "success");
        showApp(data.user);
    } catch (error) {
        console.error("Login exception:", error);
        showAuthMessage(error.message || "Something went wrong while logging in.", "error");
    } finally {
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }
    }
}

/* 13. SIGN UP */

async function signupUser(event) {
    event.preventDefault();

    const emailElement = document.getElementById("signupEmail");
    const passwordElement = document.getElementById("signupPassword");
    const confirmElement = document.getElementById("signupConfirmPassword");

    if (!emailElement || !passwordElement || !confirmElement) {
        showAuthMessage("Signup form could not be loaded.", "error");
        return;
    }

    const email = emailElement.value.trim();
    const password = passwordElement.value;
    const confirmPassword = confirmElement.value;

    if (!email) {
        showAuthMessage("Please enter your email.", "error");
        return;
    }

    if (password.length < 6) {
        showAuthMessage("Password must be at least 6 characters.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage("Passwords do not match.", "error");
        return;
    }

    if (signupButton) {
        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";
    }

    clearAuthMessage();

    try {
        const { data, error } =
            await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

        if (error) {
            console.error("Signup error:", error);
            showAuthMessage(error.message || "Account creation failed.", "error");
            return;
        }

        if (data && data.user && !data.session) {
            showAuthMessage(
                "Account created. Please verify your email before logging in.",
                "success"
            );
            return;
        }

        if (data && data.session && data.user) {
            showAuthMessage("Account created successfully.", "success");
            showApp(data.user);
        }
    } catch (error) {
        console.error("Signup exception:", error);
        showAuthMessage(
            error.message || "Something went wrong while creating your account.",
            "error"
        );
    } finally {
        if (signupButton) {
            signupButton.disabled = false;
            signupButton.textContent = "Create Account";
        }
    }
}

/* 14. LOGOUT */

async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            alert("Logout failed. Please try again.");
            return;
        }

        currentUserId = null;
        currentConversationId = null;
        currentMessages = [];

        showLoginScreen();

        const passwordElement = document.getElementById("loginPassword");
        if (passwordElement) passwordElement.value = "";
    } catch (error) {
        console.error("Logout exception:", error);
        alert("Something went wrong while logging out.");
    }
}

/* 15. SEND MESSAGE */

async function sendMessage() {
    if (!userInput) return;

    const message = userInput.value.trim();
    if (!message) return;

    if (!currentUserId) {
        console.warn("No logged-in user.");
        return;
    }

    toggleAttachmentMenu(false);

    if (sendButton) sendButton.disabled = true;
    userInput.disabled = true;

    const wasNewConversation = !currentConversationId;

    addMessage("user", message);
    currentMessages.push({ role: "user", content: message });

    userInput.value = "";
    autoResizeInput();

    const thinkingMessage = addTypingIndicator();

    try {
        const token = await getAccessToken();

        if (!token) {
            await handleSessionExpired();
            throw new Error("No login session.");
        }

        const response = await fetch(BACKEND_URL + "/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ message: message })
        });

        if (response.status === 401) {
            await handleSessionExpired();
            throw new Error("Session expired.");
        }

        if (!response.ok) {
            throw new Error("Server returned " + response.status);
        }

        const data = await response.json();

        const reply =
            data.response ||
            data.message ||
            data.reply ||
            "I couldn't generate a response.";

        updateMessage(thinkingMessage, reply);
        currentMessages.push({ role: "assistant", content: reply });

        if (wasNewConversation) {
            await createConversation(message);
        } else {
            await updateCloudConversation();
        }
    } catch (error) {
        console.error("Chat error:", error);
        updateMessage(thinkingMessage, "Sorry, I couldn't connect to the AI server.");
        currentMessages = currentMessages.slice(0, -1);
    } finally {
        if (sendButton) sendButton.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

/* 16. CHAT MESSAGES */

function addMessage(role, content) {
    const messageDiv = document.createElement("div");

    messageDiv.className =
        role === "user" ? "message user-message" : "message ai-message";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);

    if (chatbox) chatbox.appendChild(messageDiv);

    scrollToBottom();
    return messageDiv;
}

function addTypingIndicator() {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai-message";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    const dots = document.createElement("span");
    dots.className = "typing-dots";

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("span");
        dot.className = "typing-dot";
        dots.appendChild(dot);
    }

    contentDiv.appendChild(dots);
    messageDiv.appendChild(contentDiv);

    if (chatbox) chatbox.appendChild(messageDiv);

    scrollToBottom();
    return messageDiv;
}

function updateMessage(messageElement, content) {
    if (!messageElement) return;

    const contentDiv = messageElement.querySelector(".message-content");

    if (contentDiv) {
        contentDiv.textContent = content;
    } else {
        messageElement.textContent = content;
    }

    scrollToBottom();
}

/* 17. PDF UPLOAD */

function selectPDF() {
    if (!pdfInput) return;

    toggleAttachmentMenu(false);
    pdfInput.click();
}

async function uploadPDF(file) {
    if (!file) return;

    if (file.type !== "application/pdf") {
        showUploadStatus("Please select a PDF file.", "error");
        return;
    }

    if (!currentUserId) {
        showUploadStatus("Please log in again before uploading.", "error");
        return;
    }

    showUploadStatus("Uploading PDF...", "loading");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const token = await getAccessToken();

        if (!token) {
            await handleSessionExpired();
            return;
        }

        const response = await fetch(BACKEND_URL + "/upload", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });

        if (response.status === 401) {
            await handleSessionExpired();
            return;
        }

        if (!response.ok) {
            throw new Error("Upload failed with status " + response.status);
        }

        const data = await response.json();

        showUploadStatus(
            data.message ||
                (data.success ? "PDF uploaded successfully." : "Upload failed."),
            data.success ? "success" : "error"
        );

        if (data.success) loadDocumentsList();
    } catch (error) {
        console.error("PDF upload error:", error);
        showUploadStatus("PDF upload failed.", "error");
    } finally {
        pdfInput.value = "";
    }
}

/* 18. DOCUMENTS LIST */

function documentsEmptyState(title, text) {
    return `
        <div class="empty-state">
            <div class="empty-icon">📄</div>
            <h3>${escapeHTML(title)}</h3>
            <p>${escapeHTML(text)}</p>
        </div>
    `;
}

async function loadDocumentsList() {
    const list = document.getElementById("documentsList");
    if (!list || !currentUserId) return;

    const userAtStart = currentUserId;

    list.innerHTML = documentsEmptyState("Loading...", "Getting your documents.");

    try {
        const token = await getAccessToken();

        if (!token) {
            await handleSessionExpired();
            return;
        }

        const response = await fetch(BACKEND_URL + "/documents", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.status === 401) {
            await handleSessionExpired();
            return;
        }

        if (!response.ok) {
            throw new Error("Server returned " + response.status);
        }

        const data = await response.json();

        if (currentUserId !== userAtStart) return;

        const documents = Array.isArray(data.documents) ? data.documents : [];

        if (documents.length === 0) {
            list.innerHTML = documentsEmptyState(
                "No documents yet",
                "Upload a PDF to add it to your knowledge base."
            );
            return;
        }

        list.innerHTML = "";

        documents.forEach(function (doc) {
            const item = document.createElement("div");
            item.className = "document-item";

            const chunkText =
                doc.chunks === 1 ? "1 section" : doc.chunks + " sections";

            item.innerHTML = `
                <div class="document-icon">📄</div>
                <div class="document-item-main">
                    <div class="document-name">${escapeHTML(doc.filename)}</div>
                    <div class="document-meta">${escapeHTML(chunkText)}</div>
                </div>
            `;

            list.appendChild(item);
        });
    } catch (error) {
        console.error("Load documents error:", error);
        list.innerHTML = documentsEmptyState(
            "Could not load documents",
            "Please try again in a moment."
        );
    }
}

/* 19. HARDWARE STATUS */

async function loadHardwareStatus() {
    const hardwareSection = document.getElementById("hardwareSection");

    if (!hardwareSection || !currentUserId) return;

    const userAtStart = currentUserId;

    // This ID matches the badge in your supplied index.html.
    const badgeElement =
        document.getElementById("hardwareConnectionBadge");

    const backendElement =
        document.getElementById("hardwareBackendStatus");

    const lastSeenElement =
        document.getElementById("hardwareLastSeen");

    const microphoneElement =
        document.getElementById("hardwareMicrophoneStatus");

    const audioElement =
        document.getElementById("hardwareAudioStatus");

    setHardwareBadge("Checking...", "checking");

    if (backendElement) backendElement.textContent = "Checking...";
    if (lastSeenElement) lastSeenElement.textContent = "Checking...";
    if (microphoneElement) microphoneElement.textContent = "Planned";
    if (audioElement) audioElement.textContent = "Planned";

    try {
        const token = await getAccessToken();

        if (!token) {
            await handleSessionExpired();
            return;
        }

        const response = await fetch(BACKEND_URL + "/hardware/status", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (response.status === 401) {
            await handleSessionExpired();
            return;
        }

        if (!response.ok) {
            throw new Error("Hardware status request failed: " + response.status);
        }

        const data = await response.json();

        // Ignore stale results if the account changes during the request.
        if (currentUserId !== userAtStart) return;

        const connected =
            data.status === "connected" && data.verified === true;

        setHardwareBadge(
            connected ? "Connected" : "Not connected",
            connected ? "connected" : "disconnected"
        );

        if (backendElement) {
            backendElement.textContent = data.verified ? "Verified" : "Not verified";
        }

        if (lastSeenElement) {
            lastSeenElement.textContent = formatHardwareLastSeen(data.last_seen);
        }

        if (microphoneElement) {
            microphoneElement.textContent =
                formatHardwareComponentStatus(
                    data.components?.microphone?.status
                );
        }

        if (audioElement) {
            audioElement.textContent =
                formatHardwareComponentStatus(
                    data.components?.audio_output?.status
                );
        }
    } catch (error) {
        console.error("Hardware status error:", error);

        if (currentUserId !== userAtStart) return;

        setHardwareBadge("Status unavailable", "error");

        if (backendElement) backendElement.textContent = "Could not verify";
        if (lastSeenElement) lastSeenElement.textContent = "Unavailable";
    }

}

function setHardwareBadge(label, state) {
    const badge = document.getElementById("hardwareConnectionBadge");
    if (!badge) return;

    badge.replaceChildren();

    const dot = document.createElement("span");
    dot.className = "hardware-status-dot";

    const text = document.createElement("span");
    text.textContent = label;

    badge.append(dot, text);
    badge.dataset.state = state;
    badge.setAttribute("aria-live", "polite");
}

function formatHardwareLastSeen(value) {
    if (!value) return "No activity yet";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();
}

function formatHardwareComponentStatus(value) {
    if (!value) return "Planned";

    const normalized = String(value).toLowerCase();

    if (normalized === "planned") return "Planned";
    if (normalized === "connected") return "Connected";
    if (normalized === "disconnected") return "Disconnected";
    if (normalized === "not_connected") return "Not connected";
    if (normalized === "error") return "Error";

    return String(value);
}

/* 20. IMAGE */

function selectImage() {
    if (!imageInput) return;

    toggleAttachmentMenu(false);
    imageInput.click();
}

function handleImageSelected(file) {
    if (!file) return;

    showUploadStatus(
        "Image selected. Vision integration will be added next.",
        "loading"
    );

    imageInput.value = "";
}

/* 21. UPLOAD STATUS */

function showUploadStatus(message, type = "") {
    if (!uploadStatus) return;

    uploadStatus.textContent = message;
    uploadStatus.className = "upload-status";

    if (type) uploadStatus.classList.add(type);

    if (type === "success") {
        setTimeout(function () {
            if (uploadStatus) uploadStatus.textContent = "";
        }, 5000);
    }
}

/* 22. ATTACHMENT MENU */

function toggleAttachmentMenu(forceState) {
    if (!attachmentMenu) return;

    if (typeof forceState === "boolean") {
        attachmentMenu.classList.toggle("show", forceState);
        return;
    }

    attachmentMenu.classList.toggle("show");
}

/* 23. NEW CHAT */

async function newChat() {
    currentMessages = [];
    currentConversationId = null;

    resetChatboxToWelcome();

    if (userInput) {
        userInput.value = "";
        autoResizeInput();
        userInput.focus();
    }

    showSection("chat");
    closeSidebar();

    try {
        const token = await getAccessToken();

        if (token) {
            await fetch(BACKEND_URL + "/reset", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });
        }
    } catch (error) {
        console.warn("Backend reset failed:", error);
    }
}

/* 24. CREATE CLOUD CONVERSATION */

async function createConversation(firstMessage) {
    if (!currentUserId) return false;

    try {
        const title = firstMessage.substring(0, 45) || "New Conversation";
        const nowIso = new Date().toISOString();

        const { data, error } = await supabaseClient
            .from("chat_conversations")
            .insert({
                user_id: currentUserId,
                title: title,
                messages: currentMessages,
                updated_at: nowIso
            })
            .select("id")
            .single();

        if (error) {
            console.error("Create conversation error:", error);
            return false;
        }

        currentConversationId = data.id;
        loadHistoryList();
        return true;
    } catch (error) {
        console.error("Create conversation exception:", error);
        return false;
    }
}

/* 25. UPDATE CLOUD CONVERSATION */

async function updateCloudConversation() {
    if (!currentUserId || !currentConversationId) return false;

    try {
        const { error } = await supabaseClient
            .from("chat_conversations")
            .update({
                messages: currentMessages,
                updated_at: new Date().toISOString()
            })
            .eq("id", currentConversationId)
            .eq("user_id", currentUserId);

        if (error) {
            console.error("Update conversation error:", error);
            return false;
        }

        loadHistoryList();
        return true;
    } catch (error) {
        console.error("Update conversation exception:", error);
        return false;
    }
}

/* 26. GET HISTORY */

async function getHistories() {
    if (!currentUserId) return [];

    try {
        const { data, error } = await supabaseClient
            .from("chat_conversations")
            .select("id, user_id, title, messages, created_at, updated_at")
            .eq("user_id", currentUserId)
            .order("updated_at", { ascending: false })
            .limit(30);

        if (error) {
            console.error("Get history error:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Get history exception:", error);
        return [];
    }
}

/* 27. LOAD HISTORY */

async function loadHistoryList() {
    const historyList = document.getElementById("historyList");

    if (!historyList || !currentUserId) return;

    const userAtStart = currentUserId;
    const histories = await getHistories();

    if (currentUserId !== userAtStart) return;

    if (histories.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🕘</div>
                <h3>No chat history yet</h3>
                <p>Your conversations will appear here.</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = "";

    histories.forEach(function (conversation) {
        const item = document.createElement("div");
        item.className = "history-item";

        const date = conversation.updated_at
            ? new Date(conversation.updated_at).toLocaleString()
            : "";

        item.innerHTML = `
            <div class="history-item-main">
                <div class="history-title">${escapeHTML(conversation.title || "New Conversation")}</div>
                <div class="history-date">${escapeHTML(date)}</div>
            </div>
            <button class="history-open-btn" type="button">Open</button>
        `;

        const openButton = item.querySelector(".history-open-btn");

        if (openButton) {
            openButton.addEventListener("click", function () {
                restoreConversation(conversation.id);
            });
        }

        historyList.appendChild(item);
    });
}

/* 28. RESTORE CONVERSATION */

async function restoreConversation(id) {
    if (!currentUserId) return;

    try {
        const { data, error } = await supabaseClient
            .from("chat_conversations")
            .select("id, title, messages")
            .eq("id", id)
            .eq("user_id", currentUserId)
            .single();

        if (error) {
            console.error("Restore conversation error:", error);
            return;
        }

        if (!data) return;

        currentConversationId = data.id;
        currentMessages = Array.isArray(data.messages) ? [...data.messages] : [];

        if (chatbox) chatbox.innerHTML = "";

        currentMessages.forEach(function (message) {
            if (message && message.role && typeof message.content !== "undefined") {
                addMessage(message.role, message.content);
            }
        });

        showSection("chat");
        if (userInput) userInput.focus();
    } catch (error) {
        console.error("Restore conversation exception:", error);
    }
}

/* 29. CLEAR HISTORY */

async function clearChatHistory() {
    if (!currentUserId) return;

    const confirmed = confirm(
        "Are you sure you want to permanently delete your chat history?"
    );

    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from("chat_conversations")
            .delete()
            .eq("user_id", currentUserId);

        if (error) {
            console.error("Delete history error:", error);
            alert("Could not clear chat history.");
            return;
        }

        currentMessages = [];
        currentConversationId = null;

        resetChatboxToWelcome();
        await loadHistoryList();
    } catch (error) {
        console.error("Delete history exception:", error);
        alert("Something went wrong while clearing history.");
    }
}

/* 30. SECTION NAVIGATION */

function showSection(section) {
    const sections = {
        chat: document.getElementById("chatSection"),
        history: document.getElementById("historySection"),
        documents: document.getElementById("documentsSection"),
        vision: document.getElementById("visionSection"),
        hardware: document.getElementById("hardwareSection"),
        settings: document.getElementById("settingsSection")
    };

    Object.values(sections).forEach(function (element) {
        if (element) element.classList.remove("active");
    });

    if (sections[section]) {
        sections[section].classList.add("active");
    }

    if (section === "history") loadHistoryList();
    if (section === "documents") loadDocumentsList();

    if (section === "hardware") {
        loadHardwareStatus();
    }

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(function (item) {
        item.classList.remove("active");
    });

    const sectionIndex = {
        chat: 0,
        history: 1,
        documents: 2,
        vision: 3,
        hardware: 4,
        settings: 5
    };

    const index = sectionIndex[section];

    if (index !== undefined && navItems[index]) {
        navItems[index].classList.add("active");
    }

    const titles = {
        chat: ["AI Chat", "Your personal AI assistant"],
        history: ["Chat History", "Your previous conversations"],
        documents: ["Documents", "Your AI knowledge base"],
        vision: ["Vision", "Image understanding"],
        hardware: ["Hardware", "Connect your AI assistant to hardware"],
        settings: ["Settings", "Manage your assistant"]
    };

    const titleData = titles[section];

    if (titleData) {
        const pageTitle = document.getElementById("pageTitle");
        const pageSubtitle = document.getElementById("pageSubtitle");

        if (pageTitle) pageTitle.textContent = titleData[0];
        if (pageSubtitle) pageSubtitle.textContent = titleData[1];
    }

    closeSidebar();
}

/* 31. SIDEBAR */

function toggleSidebar() {
    document.body.classList.toggle("sidebar-open");
}

function openSidebar() {
    document.body.classList.add("sidebar-open");
}

function closeSidebar() {
    document.body.classList.remove("sidebar-open");
}

/* 32. TEXTAREA */

function autoResizeInput() {
    if (!userInput) return;

    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 180) + "px";
}

/* 33. SCROLL */

function scrollToBottom() {
    if (!chatbox) return;
    chatbox.scrollTop = chatbox.scrollHeight;
}

/* 34. ESCAPE HTML */

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
}

/* 35. CLOSE ATTACHMENT MENU */

document.addEventListener("click", function (event) {
    if (!attachmentMenu) return;

    const clickedInside = attachmentMenu.contains(event.target);
    const clickedButton = event.target.closest(".attachment-btn");

    if (!clickedInside && !clickedButton) {
        attachmentMenu.classList.remove("show");
    }
});

/* 36. ESCAPE KEY */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSidebar();
    }
});
```
