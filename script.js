/* =========================================================
   MY AI ASSISTANT
   Authentication + Chatbot + PDF/RAG + Supabase Cloud History
   Hardware Pairing + Hardware Status (v10.0)
   ========================================================= */

/* 1. SUPABASE */

const SUPABASE_URL = "https://jjuuilevlddifxoitffp.supabase.co";

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

    if (error) {
        console.error("Session retrieval error:", error);
        return null;
    }

    return data?.session?.access_token || null;
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

let hardwarePairingExpiryTimer = null;
let hardwarePairingExpiresAt = null;
let hardwarePairingCodeValue = null;

let hardwarePairingRequestInProgress = false;
let hardwareStatusRequestInProgress = false;

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

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }

    if (signupForm) {
        signupForm.addEventListener("submit", signupUser);
    }

    const pairingButton =
        document.getElementById("generateHardwarePairingCode");

    const refreshButton =
        document.getElementById("refreshHardwareStatus");

    const copyButton =
        document.getElementById("copyHardwarePairingCode");

    if (pairingButton) {
        pairingButton.addEventListener(
            "click",
            generateHardwarePairingCode
        );
    } else {
        console.error(
            "Hardware pairing button not found. Check the ID in index.html."
        );
    }

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadHardwareStatus
        );
    }

    if (copyButton) {
        copyButton.addEventListener(
            "click",
            copyHardwarePairingCode
        );
    }

    if (pdfInput) {
        pdfInput.addEventListener("change", function () {
            if (pdfInput.files?.length) {
                uploadPDF(pdfInput.files[0]);
            }
        });
    }

    if (imageInput) {
        imageInput.addEventListener("change", function () {
            if (imageInput.files?.length) {
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

        if (data?.session?.user) {
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

    clearHardwarePairingState();
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
    if (!user?.id) return;

    if (welcomeScreen) welcomeScreen.hidden = true;
    if (authScreen) authScreen.hidden = true;
    if (appShell) appShell.hidden = false;

    const differentUser = currentUserId !== user.id;

    if (differentUser) {
        currentMessages = [];
        currentConversationId = null;
        clearHardwarePairingState();
        resetChatboxToWelcome();
    }

    currentUserId = user.id;

    updateUserDisplay(user);
    autoResizeInput();

    setTimeout(loadHistoryList, 100);
}

/* 10. USER DISPLAY */

function updateUserDisplay(user) {
    if (!user) return;

    const email = user.email || "User";

    if (userEmail) userEmail.textContent = email;

    if (userAvatar) {
        userAvatar.textContent = email.charAt(0).toUpperCase();
    }
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

    const isLogin = form === "login";

    loginForm.classList.toggle("active", isLogin);
    signupForm.classList.toggle("active", !isLogin);
    loginTab.classList.toggle("active", isLogin);
    signupTab.classList.toggle("active", !isLogin);
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

    showAuthMessage("Signing you in...");

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            showAuthMessage(error.message || "Login failed.", "error");
            return;
        }

        if (data?.user) {
            showAuthMessage("Login successful.", "success");
            showApp(data.user);
        } else {
            showAuthMessage(
                "Login succeeded, but no user session was returned.",
                "error"
            );
        }
    } catch (error) {
        console.error("Login error:", error);
        showAuthMessage("Unable to log in. Please try again.", "error");
    } finally {
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }
    }
}

/* 13. SIGNUP */

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

    if (!email || !password || !confirmPassword) {
        showAuthMessage("Please fill in all fields.", "error");
        return;
    }

    if (password.length < 6) {
        showAuthMessage(
            "Password must contain at least 6 characters.",
            "error"
        );
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

    showAuthMessage("Creating your account...");

    try {
        const { data, error } =
            await supabaseClient.auth.signUp({
                email,
                password
            });

        if (error) {
            showAuthMessage(error.message || "Signup failed.", "error");
            return;
        }

        if (data?.session && data?.user) {
            showAuthMessage("Account created successfully.", "success");
            showApp(data.user);
        } else {
            showAuthMessage(
                "Account created. Check your email to confirm your account, then log in.",
                "success"
            );

            showAuthForm("login");
        }
    } catch (error) {
        console.error("Signup error:", error);
        showAuthMessage(
            "Unable to create your account. Please try again.",
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
    if (!confirm("Are you sure you want to log out?")) return;

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Logout error:", error);
            alert("Unable to log out. Please try again.");
            return;
        }

        showLoginScreen();
    } catch (error) {
        console.error("Logout exception:", error);
        alert("Something went wrong while logging out.");
    }
}

/* 15. CHAT */

async function sendMessage() {
    if (!userInput) return;

    const message = userInput.value.trim();

    if (!message || !currentUserId) return;

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
            body: JSON.stringify({ message })
        });

        if (response.status === 401) {
            await handleSessionExpired();
            throw new Error("Session expired.");
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            throw new Error(
                "Chat request failed (" + response.status + "). " +
                errorText.slice(0, 250)
            );
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

        updateMessage(
            thinkingMessage,
            "Sorry, I couldn't connect to the AI server. Please try again."
        );

        const lastMessage =
            currentMessages[currentMessages.length - 1];

        if (lastMessage?.role === "user") {
            currentMessages.pop();
        }
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

    const contentDiv =
        messageElement.querySelector(".message-content");

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

    const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
        showUploadStatus("Please select a PDF file.", "error");
        return;
    }

    if (!currentUserId) {
        showUploadStatus(
            "Please log in again before uploading.",
            "error"
        );
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

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                "Upload failed with status " + response.status
            );
        }

        const successful =
            data.success === true ||
            data.status === "success";

        showUploadStatus(
            data.message ||
                (successful
                    ? "PDF uploaded successfully."
                    : "Upload completed, but success was not confirmed."),
            successful ? "success" : "error"
        );

        if (successful) loadDocumentsList();
    } catch (error) {
        console.error("PDF upload error:", error);
        showUploadStatus(
            error.message || "PDF upload failed. Please try again.",
            "error"
        );
    } finally {
        if (pdfInput) pdfInput.value = "";
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

    list.innerHTML = documentsEmptyState(
        "Loading...",
        "Getting your documents."
    );

    try {
        const token = await getAccessToken();

        if (!token) {
            await handleSessionExpired();
            return;
        }

        const response = await fetch(BACKEND_URL + "/documents", {
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

        const documents = Array.isArray(data.documents)
            ? data.documents
            : [];

        if (!documents.length) {
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

            const chunks = Number(doc.chunks) || 0;
            const chunkText = chunks === 1
                ? "1 section"
                : chunks + " sections";

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

/* 19. HARDWARE UI HELPERS */

function setHardwareBadge(label, state) {
    const badge = document.getElementById("hardwareConnectionBadge");
    if (!badge) return;

    const colors = {
        online: "#39ff8c",
        offline: "#ff5c6c",
        checking: "#ffc66d",
        error: "#ff5c6c",
        default: "#8a97a6"
    };

    const color = colors[state] || colors.default;

    badge.replaceChildren();

    const dot = document.createElement("span");
    dot.className = "hardware-status-dot";
    dot.style.backgroundColor = color;

    const text = document.createElement("span");
    text.textContent = label;

    badge.append(dot, text);
    badge.style.color = color;
}

function setHardwareNotice(message, type = "") {
    const notice = document.getElementById("hardwareNotice");
    if (!notice) return;

    notice.textContent = message;

    notice.style.borderLeftColor =
        type === "error" ? "#ff5c6c" :
        type === "success" ? "#39ff8c" :
        "#00e5ff";
}

function formatHardwareLastSeen(value) {
    if (!value) return "No activity yet";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Unknown";

    return date.toLocaleString();
}

function formatHardwareComponentStatus(value) {
    if (value === true) return "Connected";
    if (value === false) return "Not detected";

    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    return "Not reported";
}

function clearHardwarePairingState() {
    stopHardwarePairingCountdown();

    hardwarePairingCodeValue = null;
    hardwarePairingExpiresAt = null;

    const panel = document.getElementById("hardwarePairingPanel");
    const codeElement = document.getElementById("hardwarePairingCode");
    const countdown = document.getElementById("hardwarePairingCountdown");

    if (panel) panel.hidden = true;
    if (codeElement) codeElement.textContent = "------";
    if (countdown) countdown.textContent = "";
}

/* 20. LOAD HARDWARE STATUS */

async function loadHardwareStatus() {
    if (!currentUserId) {
        setHardwareBadge("Not connected", "offline");

        const backendElement =
            document.getElementById("hardwareBackendStatus");

        if (backendElement) {
            backendElement.textContent = "Log in required";
        }

        setHardwareNotice(
            "Log in to check hardware status or generate a pairing code."
        );

        return;
    }

    if (hardwareStatusRequestInProgress) return;

    hardwareStatusRequestInProgress = true;

    const refreshButton =
        document.getElementById("refreshHardwareStatus");

    const userAtStart = currentUserId;

    const backendElement =
        document.getElementById("hardwareBackendStatus");

    const lastSeenElement =
        document.getElementById("hardwareLastSeen");

    const microphoneElement =
        document.getElementById("hardwareMicrophoneStatus");

    const audioElement =
        document.getElementById("hardwareAudioStatus");

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Checking...";
    }

    setHardwareBadge("Checking...", "checking");

    if (backendElement) backendElement.textContent = "Checking...";

    try {
        const token = await getAccessToken();

        if (!token) {
            await handleSessionExpired();
            return;
        }

        const response = await fetch(
            BACKEND_URL + "/hardware/status",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            await handleSessionExpired();
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                "Hardware status request failed (" +
                response.status +
                ")."
            );
        }

        if (currentUserId !== userAtStart) return;

        const devices = Array.isArray(data.devices)
            ? data.devices
            : [];

        const device =
            data.device ||
            devices.find(item =>
                item.online === true || item.status === "online"
            ) ||
            devices[0] ||
            data;

        const online =
            device.online === true ||
            device.status === "online" ||
            data.online === true ||
            data.status === "online";

        const verified =
            device.verified === true ||
            device.is_verified === true ||
            data.verified === true ||
            data.is_verified === true;

        setHardwareBadge(
            online ? "Online" : "Offline",
            online ? "online" : "offline"
        );

        if (backendElement) {
            backendElement.textContent =
                verified ? "Verified" : "Not verified";
        }

        if (lastSeenElement) {
            lastSeenElement.textContent = formatHardwareLastSeen(
                device.last_seen ||
                device.last_heartbeat ||
                device.last_activity ||
                data.last_seen
            );
        }

        const components = device.components || {};

        if (microphoneElement) {
            microphoneElement.textContent =
                formatHardwareComponentStatus(components.microphone);
        }

        if (audioElement) {
            audioElement.textContent =
                formatHardwareComponentStatus(
                    components.audio ?? components.speaker
                );
        }

        setHardwareNotice(
            online
                ? "The backend reports that your device is online."
                : "The backend responded, but your ESP32-S3 is not reported online. Generate a pairing code and complete pairing in the device firmware."
        );
    } catch (error) {
        console.error("Hardware status error:", error);

        if (currentUserId !== userAtStart) return;

        setHardwareBadge("Status unavailable", "error");

        if (backendElement) {
            backendElement.textContent = "Request failed";
        }

        setHardwareNotice(
            "Could not load hardware status: " +
            (error.message || "Unknown error") +
            " Check the backend deployment and try again.",
            "error"
        );
    } finally {
        hardwareStatusRequestInProgress = false;

        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent = "Refresh status";
        }
    }
}

/* 21. GENERATE TEMPORARY HARDWARE PAIRING CODE */

async function generateHardwarePairingCode() {
    const button =
        document.getElementById("generateHardwarePairingCode");

    const panel =
        document.getElementById("hardwarePairingPanel");

    const codeElement =
        document.getElementById("hardwarePairingCode");

    const countdownElement =
        document.getElementById("hardwarePairingCountdown");

    if (hardwarePairingRequestInProgress) return;

    if (!currentUserId) {
        setHardwareNotice(
            "Please log in before generating a pairing code.",
            "error"
        );
        return;
    }

    hardwarePairingRequestInProgress = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Generating...";
    }

    setHardwareNotice("Requesting a temporary pairing code...");

    try {
        const token = await getAccessToken();

        if (!token) {
            await handleSessionExpired();
            return;
        }

        /*
         * This endpoint must exist on your deployed backend.
         * The frontend cannot create a valid pairing code by itself.
         */

        const response = await fetch(
            BACKEND_URL + "/hardware/pairing-code",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    device_name: "ESP32-S3"
                })
            }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            await handleSessionExpired();
            return;
        }

        if (!response.ok) {
            let message =
                data.detail ||
                data.message ||
                data.error ||
                "";

            if (Array.isArray(message)) {
                message = message
                    .map(item => item.msg || JSON.stringify(item))
                    .join("; ");
            }

            if (!message) {
                if (response.status === 404) {
                    message =
                        "The backend pairing endpoint was not found. Deploy the /hardware/pairing-code route first.";
                } else if (response.status === 405) {
                    message =
                        "The pairing endpoint does not accept POST requests. Check the backend route.";
                } else if (response.status === 429) {
                    message =
                        "Too many pairing requests. Wait a moment and try again.";
                } else if (response.status >= 500) {
                    message =
                        "The backend encountered a server error. Check the Render logs.";
                } else {
                    message =
                        "Pairing request failed with HTTP " + response.status + ".";
                }
            }

            throw new Error(message);
        }

        /*
         * Accept common response formats:
         * { pairing_code: "123456" }
         * { code: "123456" }
         * { pairingCode: "123456" }
         */

        const code =
            data.pairing_code ??
            data.pairingCode ??
            data.code ??
            data.temporary_code ??
            data.temporaryCode;

        if (code === undefined || code === null || String(code).trim() === "") {
            console.error(
                "Pairing endpoint returned no recognized code field:",
                data
            );

            throw new Error(
                "The backend responded successfully but returned no pairing code. Check its JSON response format."
            );
        }

        hardwarePairingCodeValue = String(code).trim();

        let expiresIn = Number(
            data.expires_in ??
            data.expires_in_seconds ??
            data.expiresIn ??
            600
        );

        if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
            expiresIn = 600;
        }

        if (data.expires_at) {
            const parsedExpiry = new Date(data.expires_at).getTime();

            hardwarePairingExpiresAt =
                Number.isFinite(parsedExpiry)
                    ? parsedExpiry
                    : Date.now() + expiresIn * 1000;
        } else {
            hardwarePairingExpiresAt = Date.now() + expiresIn * 1000;
        }

        if (codeElement) {
            codeElement.textContent = hardwarePairingCodeValue;
        }

        if (panel) panel.hidden = false;

        if (countdownElement) {
            countdownElement.textContent = "";
        }

        startHardwarePairingCountdown();

        setHardwareNotice(
            "Pairing code generated successfully. Enter it into your ESP32-S3 pairing process before it expires. Generating a code alone does not connect the device.",
            "success"
        );
    } catch (error) {
        console.error("Generate pairing code error:", error);

        setHardwareNotice(
            "Could not generate pairing code: " +
            (error.message || "Unknown error"),
            "error"
        );
    } finally {
        hardwarePairingRequestInProgress = false;

        if (button) {
            button.disabled = false;
            button.textContent = "Generate pairing code";
        }
    }
}

/* 22. PAIRING CODE COUNTDOWN */

function startHardwarePairingCountdown() {
    stopHardwarePairingCountdown();

    const countdownElement =
        document.getElementById("hardwarePairingCountdown");

    const codeElement =
        document.getElementById("hardwarePairingCode");

    const panel =
        document.getElementById("hardwarePairingPanel");

    function updateCountdown() {
        if (!hardwarePairingExpiresAt) return;

        const remaining = Math.max(
            0,
            Math.ceil(
                (hardwarePairingExpiresAt - Date.now()) / 1000
            )
        );

        if (remaining <= 0) {
            stopHardwarePairingCountdown();

            hardwarePairingCodeValue = null;
            hardwarePairingExpiresAt = null;

            if (countdownElement) {
                countdownElement.textContent =
                    "This pairing code has expired. Generate a new one.";
            }

            if (codeElement) {
                codeElement.textContent = "EXPIRED";
            }

            return;
        }

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        if (countdownElement) {
            countdownElement.textContent =
                "Expires in " +
                minutes +
                ":" +
                String(seconds).padStart(2, "0") +
                ".";
        }

        if (panel) panel.hidden = false;
    }

    updateCountdown();

    hardwarePairingExpiryTimer =
        setInterval(updateCountdown, 1000);
}

function stopHardwarePairingCountdown() {
    if (hardwarePairingExpiryTimer !== null) {
        clearInterval(hardwarePairingExpiryTimer);
        hardwarePairingExpiryTimer = null;
    }
}

/* 23. COPY PAIRING CODE */

async function copyHardwarePairingCode() {
    if (!hardwarePairingCodeValue) {
        setHardwareNotice(
            "There is no active pairing code. Generate a new one first.",
            "error"
        );
        return;
    }

    try {
        if (!navigator.clipboard?.writeText) {
            throw new Error("Clipboard API is unavailable.");
        }

        await navigator.clipboard.writeText(
            hardwarePairingCodeValue
        );

        setHardwareNotice(
            "Pairing code copied. Treat it as a temporary secret.",
            "success"
        );
    } catch (error) {
        console.error("Copy pairing code error:", error);

        setHardwareNotice(
            "Clipboard access failed. Select the displayed code and copy it manually.",
            "error"
        );
    }
}

/* 24. IMAGE UPLOAD */

function selectImage() {
    if (!imageInput) return;

    toggleAttachmentMenu(false);
    imageInput.click();
}

async function handleImageSelected(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showUploadStatus("Please select a valid image.", "error");
        if (imageInput) imageInput.value = "";
        return;
    }

    if (!currentUserId) {
        showUploadStatus(
            "Please log in before uploading an image.",
            "error"
        );
        if (imageInput) imageInput.value = "";
        return;
    }

    showUploadStatus(
        "Image selected. Preparing preview...",
        "loading"
    );

    try {
        const reader = new FileReader();

        reader.onload = function () {
            const dataUrl = reader.result;

            addMessage("user", "[Image selected: " + file.name + "]");

            showUploadStatus(
                "Image preview is ready. Image analysis requires a supported backend vision endpoint.",
                "success"
            );

            const preview = document.createElement("img");

            preview.src = dataUrl;
            preview.alt = "Selected image preview";
            preview.style.maxWidth = "240px";
            preview.style.maxHeight = "240px";
            preview.style.objectFit = "contain";
            preview.style.borderRadius = "10px";
            preview.style.display = "block";
            preview.style.marginTop = "8px";

            if (chatbox) {
                const messages = chatbox.querySelectorAll(".message");
                const lastMessage = messages[messages.length - 1];
                const content = lastMessage?.querySelector(".message-content");

                if (content) content.appendChild(preview);
            }

            if (userInput) {
                userInput.value =
                    "Please analyze the image I selected: " +
                    file.name +
                    "\n\nThe image must be sent to a supported backend vision endpoint for analysis.";

                autoResizeInput();
                userInput.focus();
            }
        };

        reader.onerror = function () {
            showUploadStatus("Unable to read the selected image.", "error");
        };

        reader.readAsDataURL(file);
    } catch (error) {
        console.error("Image selection error:", error);

        showUploadStatus(
            "Unable to prepare the selected image.",
            "error"
        );
    } finally {
        if (imageInput) imageInput.value = "";
    }
}

/* 25. UPLOAD STATUS */

function showUploadStatus(message, type = "") {
    if (!uploadStatus) return;

    uploadStatus.textContent = message;
    uploadStatus.className = "upload-status";

    if (type) uploadStatus.classList.add(type);
}

/* 26. ATTACHMENT MENU */

function toggleAttachmentMenu(forceState) {
    if (!attachmentMenu) return;

    if (typeof forceState === "boolean") {
        attachmentMenu.classList.toggle("active", forceState);
    } else {
        attachmentMenu.classList.toggle("active");
    }
}

/* 27. CHAT INPUT RESIZE */

function autoResizeInput() {
    if (!userInput) return;

    userInput.style.height = "auto";

    userInput.style.height =
        Math.min(userInput.scrollHeight, 180) + "px";
}

/* 28. SCROLL CHAT */

function scrollToBottom() {
    if (!chatbox) return;

    chatbox.scrollTop = chatbox.scrollHeight;
}

/* 29. NEW CHAT */

function newChat() {
    currentConversationId = null;
    currentMessages = [];

    resetChatboxToWelcome();

    if (userInput) {
        userInput.value = "";
        autoResizeInput();
        userInput.focus();
    }

    showSection("chat");
}

/* 30. NAVIGATION */

function showSection(sectionName) {
    const sections = [
        "chat",
        "history",
        "documents",
        "vision",
        "hardware",
        "settings"
    ];

    sections.forEach(function (name) {
        const section = document.getElementById(name + "Section");

        if (section) {
            section.classList.toggle("active", name === sectionName);
        }
    });

    document.querySelectorAll(".nav-item").forEach(function (button) {
        const label = button.textContent.trim().toLowerCase();

        const active =
            (sectionName === "chat" && label.includes("chat") && !label.includes("history")) ||
            (sectionName === "history" && label.includes("history")) ||
            (sectionName === "documents" && label.includes("documents")) ||
            (sectionName === "hardware" && label.includes("hardware")) ||
            (sectionName === "vision" && label.includes("vision")) ||
            (sectionName === "settings" && label.includes("settings"));

        button.classList.toggle("active", active);
    });

    const titles = {
        chat: ["AI Chat", "Your personal AI assistant"],
        history: ["Chat History", "Your previous conversations"],
        documents: ["Documents", "Your PDF knowledge base"],
        vision: ["Vision", "Image understanding"],
        hardware: ["Hardware", "Connect your ESP32-S3"],
        settings: ["Settings", "Manage your assistant"]
    };

    const heading = titles[sectionName];

    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    if (heading && pageTitle) pageTitle.textContent = heading[0];
    if (heading && pageSubtitle) pageSubtitle.textContent = heading[1];

    if (sectionName === "history") loadHistoryList();
    if (sectionName === "documents") loadDocumentsList();
    if (sectionName === "hardware") loadHardwareStatus();

    closeSidebar();
}

/* 31. MOBILE SIDEBAR */

function toggleSidebar() {
    document.body.classList.toggle("sidebar-open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.toggle(
            "active",
            document.body.classList.contains("sidebar-open")
        );
    }
}

function closeSidebar() {
    document.body.classList.remove("sidebar-open");

    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
}

/* 32. ESCAPE HTML */

function escapeHTML(value) {
    const element = document.createElement("div");

    element.textContent =
        value === null || value === undefined ? "" : String(value);

    return element.innerHTML;
}

/* 33. CONVERSATION HISTORY */


async function createConversation(firstMessage) {
    if (!currentUserId) return;

    try {
        const result = await supabaseClient
            .from("chat_conversations")
            .insert({
                user_id: currentUserId,
                title: String(firstMessage).slice(0, 80),
                messages: currentMessages
            })
            .select()
            .single();

        if (result.error) {
            console.warn(
                "Cloud conversation was not saved:",
                result.error.message
            );
            return;
        }

        if (result.data) {
            currentConversationId = result.data.id;
        }

        await loadHistoryList();
    } catch (error) {
        console.error("Create conversation error:", error);
    }
}

async function updateCloudConversation() {
    if (!currentUserId || !currentConversationId) return;

    try {
        const result = await supabaseClient
            .from("chat_conversations")
            .update({ messages: currentMessages })
            .eq("id", currentConversationId)
            .eq("user_id", currentUserId);

        if (result.error) {
            console.warn(
                "Conversation update failed:",
                result.error.message
            );
        }
    } catch (error) {
        console.error("Update conversation error:", error);
    }
}

async function loadHistoryList() {
    const historyList = document.getElementById("historyList");

    if (!historyList || !currentUserId) return;

    const userAtStart = currentUserId;

    historyList.textContent = "Loading history...";

    try {
        const result = await supabaseClient
            .from("chat_conversations")
            .select("id, title, messages, created_at")
            .eq("user_id", userAtStart)
            .order("created_at", { ascending: false })
            .limit(50);

        if (result.error) throw result.error;
        if (currentUserId !== userAtStart) return;

        const conversations = result.data || [];

        historyList.innerHTML = "";

        if (!conversations.length) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🕘</div>
                    <h3>No conversations yet</h3>
                    <p>Your saved conversations will appear here.</p>
                </div>
            `;
            return;
        }

        conversations.forEach(function (conversation) {
            const item = document.createElement("div");
            item.className = "history-item";

            const title = document.createElement("div");
            title.className = "history-title";
            title.textContent =
                conversation.title || "Untitled conversation";

            const date = document.createElement("div");
            date.className = "history-date";
            date.textContent =
                formatHardwareLastSeen(conversation.created_at);

            item.append(title, date);

            item.addEventListener("click", function () {
                openConversation(conversation);
            });

            historyList.appendChild(item);
        });
    } catch (error) {
        console.error("Load history error:", error);

        historyList.textContent =
            "History could not be loaded. Check your Supabase table and access policies.";
    }
}

function openConversation(conversation) {
    if (!conversation) return;

    currentConversationId = conversation.id;

    currentMessages = Array.isArray(conversation.messages)
        ? conversation.messages
        : [];

    if (chatbox) chatbox.innerHTML = "";

    currentMessages.forEach(function (message) {
        if (!message?.role) return;
        addMessage(message.role, message.content || "");
    });

    showSection("chat");
}

async function clearChatHistory() {
    if (!currentUserId) return;

    if (!confirm("Delete all saved conversations? This cannot be undone.")) {
        return;
    }

    try {
        const result = await supabaseClient
            .from("chat_conversations")
            .delete()
            .eq("user_id", currentUserId);

        if (result.error) throw result.error;

        currentConversationId = null;
        currentMessages = [];

        await loadHistoryList();

        alert("Saved chat history cleared.");
    } catch (error) {
        console.error("Clear history error:", error);

        alert(
            "Could not clear history. Check your database access policies."
        );
    }
}


/* =========================================================
   END OF SCRIPT
   ========================================================= */
