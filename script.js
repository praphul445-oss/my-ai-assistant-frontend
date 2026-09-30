/* =========================================================
   MY AI ASSISTANT
   Frontend JavaScript
   Supabase Auth + Render FastAPI + Groq + Per-user RAG
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "https://jjuuilevlddifxoitffp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_eQFWdaObL0JtrBmkwqJ_sw_lzbtjt-I";

const BACKEND_URL =
    "https://ai-chatbot-website-zlqu.onrender.com";


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;
let currentSection = "chat";
let isSending = false;


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("=================================");
    console.log("My AI Assistant starting...");
    console.log("Supabase:", SUPABASE_URL);
    console.log("Backend:", BACKEND_URL);
    console.log("=================================");

    setupInputEvents();

    await checkInitialSession();

    setupAuthListener();
});


/* =========================================================
   INITIAL SESSION CHECK
   ========================================================= */

async function checkInitialSession() {

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            showLoggedOutState();
            return;
        }

        const session = data?.session;

        if (session?.user) {

            console.log(
                "Existing session found:",
                session.user.email
            );

            await handleLoggedInUser(session.user);

        } else {

            console.log("No active session.");

            showLoggedOutState();
        }

    } catch (error) {

        console.error(
            "Initial session check failed:",
            error
        );

        showLoggedOutState();
    }
}


/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

function setupAuthListener() {

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Auth event:",
                event
            );

            if (session?.user) {

                currentUser = session.user;

                await handleLoggedInUser(
                    session.user
                );

            } else {

                currentUser = null;

                showLoggedOutState();
            }
        }
    );
}


/* =========================================================
   HANDLE LOGGED-IN USER
   ========================================================= */

async function handleLoggedInUser(user) {

    currentUser = user;

    console.log(
        "Logged in user:",
        user.email
    );

    updateUserAccountUI(user);

    hideAuthScreens();

    $("appShell").hidden = false;

    showSection("chat");

    loadLocalHistory();

    await loadDocumentsList();
}


/* =========================================================
   LOGGED-OUT STATE
   ========================================================= */

function showLoggedOutState() {

    currentUser = null;

    if ($("appShell")) {
        $("appShell").hidden = true;
    }

    if ($("authScreen")) {
        $("authScreen").hidden = true;
    }

    if ($("welcomeScreen")) {
        $("welcomeScreen").hidden = false;
    }
}


/* =========================================================
   HIDE AUTH SCREENS
   ========================================================= */

function hideAuthScreens() {

    if ($("welcomeScreen")) {
        $("welcomeScreen").hidden = true;
    }

    if ($("authScreen")) {
        $("authScreen").hidden = true;
    }
}


/* =========================================================
   WELCOME / AUTH SCREEN
   ========================================================= */

function openAuthScreen(mode = "login") {

    if ($("welcomeScreen")) {
        $("welcomeScreen").hidden = true;
    }

    if ($("authScreen")) {
        $("authScreen").hidden = false;
    }

    showAuthForm(mode);

    clearAuthMessage();
}


function backToWelcome() {

    if ($("authScreen")) {
        $("authScreen").hidden = true;
    }

    if ($("welcomeScreen")) {
        $("welcomeScreen").hidden = false;
    }

    clearAuthMessage();
}


/* =========================================================
   AUTH TABS
   ========================================================= */

function showAuthForm(type) {

    const loginForm = $("loginForm");
    const signupForm = $("signupForm");

    const loginTab = $("loginTab");
    const signupTab = $("signupTab");

    if (type === "signup") {

        if (loginForm) {
            loginForm.classList.remove("active");
        }

        if (signupForm) {
            signupForm.classList.add("active");
        }

        if (loginTab) {
            loginTab.classList.remove("active");
        }

        if (signupTab) {
            signupTab.classList.add("active");
        }

    } else {

        if (signupForm) {
            signupForm.classList.remove("active");
        }

        if (loginForm) {
            loginForm.classList.add("active");
        }

        if (signupTab) {
            signupTab.classList.remove("active");
        }

        if (loginTab) {
            loginTab.classList.add("active");
        }
    }

    clearAuthMessage();
}


/* =========================================================
   AUTH MESSAGE
   ========================================================= */

function showAuthMessage(message, type = "error") {

    const element = $("authMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        "auth-message " + type;
}


function clearAuthMessage() {

    const element = $("authMessage");

    if (!element) {
        return;
    }

    element.textContent = "";
    element.className = "auth-message";
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(event) {

    event.preventDefault();

    const email =
        $("loginEmail")?.value.trim();

    const password =
        $("loginPassword")?.value;

    const button =
        $("loginButton");

    if (!email || !password) {

        showAuthMessage(
            "Please enter your email and password."
        );

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Logging in...";
    }

    clearAuthMessage();

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            console.error(
                "Login error:",
                error
            );

            showAuthMessage(
                error.message || "Login failed."
            );

            return;
        }

        if (!data?.session) {

            showAuthMessage(
                "Login succeeded, but no session was returned."
            );

            return;
        }

        console.log(
            "Login successful."
        );

        showAuthMessage(
            "Login successful.",
            "success"
        );

        currentUser = data.user;

        await handleLoggedInUser(
            data.user
        );

    } catch (error) {

        console.error(
            "Login exception:",
            error
        );

        showAuthMessage(
            "Something went wrong while logging in."
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Login";
        }
    }
}


/* =========================================================
   SIGN UP
   ========================================================= */

async function signupUser(event) {

    event.preventDefault();

    const email =
        $("signupEmail")?.value.trim();

    const password =
        $("signupPassword")?.value;

    const confirmPassword =
        $("signupConfirmPassword")?.value;

    const button =
        $("signupButton");

    if (!email || !password || !confirmPassword) {

        showAuthMessage(
            "Please fill in all fields."
        );

        return;
    }

    if (password !== confirmPassword) {

        showAuthMessage(
            "Passwords do not match."
        );

        return;
    }

    if (password.length < 6) {

        showAuthMessage(
            "Password must be at least 6 characters."
        );

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Creating...";
    }

    clearAuthMessage();

    try {

        const { data, error } =
            await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

        if (error) {

            console.error(
                "Signup error:",
                error
            );

            showAuthMessage(
                error.message || "Account creation failed."
            );

            return;
        }

        /*
         * If Supabase email confirmation is enabled,
         * data.session will be null.
         */

        if (!data?.session) {

            showAuthMessage(
                "Account created. Check your email to confirm your account.",
                "success"
            );

            return;
        }

        showAuthMessage(
            "Account created successfully.",
            "success"
        );

        currentUser = data.user;

        await handleLoggedInUser(
            data.user
        );

    } catch (error) {

        console.error(
            "Signup exception:",
            error
        );

        showAuthMessage(
            "Something went wrong while creating your account."
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Create Account";
        }
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

    try {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {

            console.error(
                "Logout error:",
                error
            );

            return;
        }

        currentUser = null;

        showLoggedOutState();

        console.log(
            "Logged out."
        );

    } catch (error) {

        console.error(
            "Logout exception:",
            error
        );
    }
}


/* =========================================================
   USER UI
   ========================================================= */

function updateUserAccountUI(user) {

    const email =
        user?.email || "User";

    const emailElement =
        $("userEmail");

    const avatarElement =
        $("userAvatar");

    if (emailElement) {
        emailElement.textContent = email;
    }

    if (avatarElement) {

        const firstLetter =
            email.charAt(0).toUpperCase();

        avatarElement.textContent =
            firstLetter || "U";
    }
}


/* =========================================================
   IMPORTANT:
   GET THE REAL SUPABASE ACCESS TOKEN
   ========================================================= */

async function getAccessToken() {

    try {

        let { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "getSession error:",
                error
            );

            return null;
        }

        let session = data?.session;

        /*
         * If there is no session, try refreshing it.
         */

        if (!session) {

            console.log(
                "No session. Trying refresh..."
            );

            const refreshResult =
                await supabaseClient.auth.refreshSession();

            if (refreshResult.error) {

                console.error(
                    "refreshSession error:",
                    refreshResult.error
                );

                return null;
            }

            session =
                refreshResult.data?.session;
        }

        if (!session) {

            console.error(
                "No active Supabase session."
            );

            return null;
        }

        if (!session.access_token) {

            console.error(
                "Session exists but access_token is missing."
            );

            return null;
        }

        /*
         * THIS is the token that goes into:
         *
         * Authorization:
         * Bearer <access_token>
         *
         * DO NOT use SUPABASE_PUBLISHABLE_KEY here.
         */

        console.log(
            "Supabase access token obtained."
        );

        return session.access_token;

    } catch (error) {

        console.error(
            "Token error:",
            error
        );

        return null;
    }
}


/* =========================================================
   BACKEND REQUEST HELPER
   ========================================================= */

async function backendRequest(
    endpoint,
    options = {}
) {

    const token =
        await getAccessToken();

    if (!token) {

        handleSessionExpired();

        throw new Error(
            "No valid login session."
        );
    }

    const headers = {
        ...(options.headers || {}),
        "Authorization":
            "Bearer " + token
    };

    /*
     * Only add Content-Type automatically
     * when we are not sending FormData.
     */

    if (!(options.body instanceof FormData)) {

        headers["Content-Type"] =
            "application/json";
    }

    console.log(
        "Backend request:",
        endpoint
    );

    const response =
        await fetch(
            BACKEND_URL + endpoint,
            {
                ...options,
                headers: headers
            }
        );

    /*
     * 401 = Supabase token rejected by Render.
     */

    if (response.status === 401) {

        console.error(
            "Backend returned 401:",
            endpoint
        );

        handleSessionExpired();

        throw new Error(
            "Your login session is invalid or expired."
        );
    }

    /*
     * 403 = request understood but forbidden.
     */

    if (response.status === 403) {

        throw new Error(
            "You do not have permission to perform this action."
        );
    }

    /*
     * Other server errors.
     */

    if (!response.ok) {

        let message =
            "Server error " +
            response.status;

        try {

            const errorData =
                await response.json();

            if (errorData?.detail) {
                message =
                    errorData.detail;
            }

        } catch (_) {
            // Ignore JSON parsing failure.
        }

        throw new Error(message);
    }

    return response;
}


/* =========================================================
   SESSION EXPIRED
   ========================================================= */

async function handleSessionExpired() {

    console.warn(
        "Session expired or rejected."
    );

    try {
        await supabaseClient.auth.signOut();
    } catch (_) {
        // Ignore logout error.
    }

    currentUser = null;

    showLoggedOutState();

    showAuthMessage(
        "Your login session expired. Please log in again."
    );

    openAuthScreen("login");
}


/* =========================================================
   CHAT
   ========================================================= */

async function sendMessage() {

    if (isSending) {
        return;
    }

    const input =
        $("userInput");

    const message =
        input?.value.trim();

    if (!message) {
        return;
    }

    if (!currentUser) {

        openAuthScreen("login");

        return;
    }

    isSending = true;

    const sendButton =
        $("sendButton");

    if (sendButton) {
        sendButton.disabled = true;
    }

    /*
     * Remove welcome message.
     */

    removeWelcomeMessage();

    /*
     * Add user message.
     */

    addChatMessage(
        message,
        "user"
    );

    /*
     * Clear input.
     */

    input.value = "";
    autoResizeTextarea();

    /*
     * Thinking message.
     */

    const thinkingElement =
        addThinkingMessage();

    try {

        console.log(
            "Sending message to backend..."
        );

        const response =
            await backendRequest(
                "/chat",
                {
                    method: "POST",

                    body: JSON.stringify({
                        message: message
                    })
                }
            );

        const data =
            await response.json();

        removeThinkingMessage(
            thinkingElement
        );

        if (!data?.reply) {

            addChatMessage(
                "⚠️ The server returned an empty response.",
                "assistant"
            );

            return;
        }

        addChatMessage(
            data.reply,
            "assistant"
        );

        saveLocalHistory(
            message,
            data.reply
        );

    } catch (error) {

        console.error(
            "Chat error:",
            error
        );

        removeThinkingMessage(
            thinkingElement
        );

        addChatMessage(
            "⚠️ " +
            (error.message ||
                "Sorry, I couldn't connect to the AI server."),
            "assistant"
        );

    } finally {

        isSending = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        input?.focus();
    }
}


/* =========================================================
   ADD CHAT MESSAGE
   ========================================================= */

function addChatMessage(
    text,
    role
) {

    const chatbox =
        $("chatbox");

    if (!chatbox) {
        return null;
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        role === "user"
            ? "message user-message"
            : "message assistant-message";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    /*
     * Convert simple markdown safely.
     */

    content.innerHTML =
        formatMessage(text);

    wrapper.appendChild(content);

    chatbox.appendChild(wrapper);

    chatbox.scrollTop =
        chatbox.scrollHeight;

    return wrapper;
}


/* =========================================================
   MESSAGE FORMATTER
   ========================================================= */

function formatMessage(text) {

    if (text === null ||
        text === undefined) {

        return "";
    }

    let safe =
        escapeHTML(String(text));

    /*
     * Code blocks
     */

    safe = safe.replace(
        /```([\s\S]*?)```/g,
        "<pre><code>$1</code></pre>"
    );

    /*
     * Bold
     */

    safe = safe.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    /*
     * Inline code
     */

    safe = safe.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    /*
     * Bullet points
     */

    safe = safe.replace(
        /^\s*[•*-]\s+(.*)$/gm,
        "• $1"
    );

    /*
     * New lines
     */

    safe = safe.replace(
        /\n/g,
        "<br>"
    );

    return safe;
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   THINKING MESSAGE
   ========================================================= */

function addThinkingMessage() {

    const chatbox =
        $("chatbox");

    if (!chatbox) {
        return null;
    }

    const element =
        document.createElement("div");

    element.className =
        "message assistant-message thinking-message";

    element.innerHTML = `
        <div class="message-content">
            <span>Thinking...</span>
        </div>
    `;

    chatbox.appendChild(element);

    chatbox.scrollTop =
        chatbox.scrollHeight;

    return element;
}


function removeThinkingMessage(
    element
) {

    if (element &&
        element.parentNode) {

        element.parentNode.removeChild(
            element
        );
    }
}


/* =========================================================
   REMOVE WELCOME MESSAGE
   ========================================================= */

function removeWelcomeMessage() {

    const welcome =
        document.querySelector(
            ".welcome-message"
        );

    if (welcome) {
        welcome.remove();
    }
}


/* =========================================================
   NEW CHAT
   ========================================================= */

async function newChat() {

    if (!currentUser) {
        openAuthScreen("login");
        return;
    }

    const confirmed =
        confirm(
            "Start a new chat? Your current conversation memory will be cleared."
        );

    if (!confirmed) {
        return;
    }

    try {

        await backendRequest(
            "/reset",
            {
                method: "POST"
            }
        );

        clearChatUI();

        localStorage.removeItem(
            getHistoryStorageKey()
        );

        console.log(
            "New chat started."
        );

    } catch (error) {

        console.error(
            "New chat error:",
            error
        );

        alert(
            error.message ||
            "Could not reset the conversation."
        );
    }
}


/* =========================================================
   CLEAR CHAT UI
   ========================================================= */

function clearChatUI() {

    const chatbox =
        $("chatbox");

    if (!chatbox) {
        return;
    }

    chatbox.innerHTML = `
        <div class="welcome-message">

            <div class="welcome-icon">
                🤖
            </div>

            <h2>
                How can I help you?
            </h2>

            <p>
                Ask me anything or upload a document
                to work with your knowledge base.
            </p>

        </div>
    `;
}


/* =========================================================
   CHAT HISTORY
   ========================================================= */

function getHistoryStorageKey() {

    if (!currentUser?.id) {
        return "my_ai_assistant_history";
    }

    return (
        "my_ai_assistant_history_" +
        currentUser.id
    );
}


function loadLocalHistory() {

    const history =
        localStorage.getItem(
            getHistoryStorageKey()
        );

    if (!history) {
        return;
    }

    try {

        const messages =
            JSON.parse(history);

        if (!Array.isArray(messages)) {
            return;
        }

        renderHistoryList(messages);

    } catch (error) {

        console.error(
            "History load error:",
            error
        );
    }
}


function saveLocalHistory(
    userMessage,
    assistantReply
) {

    const key =
        getHistoryStorageKey();

    let history = [];

    try {

        const existing =
            localStorage.getItem(key);

        if (existing) {

            history =
                JSON.parse(existing);

            if (!Array.isArray(history)) {
                history = [];
            }
        }

    } catch (_) {

        history = [];
    }

    history.push({
        user: userMessage,
        assistant: assistantReply,
        timestamp:
            new Date().toISOString()
    });

    /*
     * Keep last 50 conversations in browser.
     */

    history =
        history.slice(-50);

    localStorage.setItem(
        key,
        JSON.stringify(history)
    );
}


function renderHistoryList(
    history
) {

    const container =
        $("historyList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!history.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🕘</div>
                <h3>No chat history yet</h3>
                <p>Your previous conversations will appear here.</p>
            </div>
        `;

        return;
    }

    [...history]
        .reverse()
        .forEach(item => {

            const element =
                document.createElement("div");

            element.className =
                "history-item";

            const date =
                item.timestamp
                    ? new Date(
                        item.timestamp
                    ).toLocaleString()
                    : "";

            element.innerHTML = `
                <div>
                    <strong>
                        ${escapeHTML(
                            item.user || "Chat"
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            item.assistant || ""
                        ).substring(0, 180)}
                    </p>

                    <small>
                        ${escapeHTML(date)}
                    </small>
                </div>
            `;

            container.appendChild(
                element
            );
        });
}


/* =========================================================
   CLEAR CHAT HISTORY
   ========================================================= */

async function clearChatHistory() {

    if (!currentUser) {
        return;
    }

    const confirmed =
        confirm(
            "Clear your conversation history?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await backendRequest(
            "/reset",
            {
                method: "POST"
            }
        );

        localStorage.removeItem(
            getHistoryStorageKey()
        );

        renderHistoryList([]);

        clearChatUI();

        console.log(
            "History cleared."
        );

    } catch (error) {

        console.error(
            "Clear history error:",
            error
        );

        alert(
            error.message ||
            "Could not clear history."
        );
    }
}


/* =========================================================
   DOCUMENTS
   ========================================================= */

async function loadDocumentsList() {

    const container =
        $("documentsList");

    if (!container ||
        !currentUser) {

        return;
    }

    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📄</div>
            <p>Loading documents...</p>
        </div>
    `;

    try {

        const response =
            await backendRequest(
                "/documents",
                {
                    method: "GET"
                }
            );

        const data =
            await response.json();

        const documents =
            data?.documents || [];

        renderDocuments(
            documents
        );

    } catch (error) {

        console.error(
            "Documents error:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Could not load documents</h3>
                <p>
                    ${escapeHTML(
                        error.message ||
                        "Server error"
                    )}
                </p>
            </div>
        `;
    }
}


function renderDocuments(
    documents
) {

    const container =
        $("documentsList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!documents.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>

                <h3>No documents yet</h3>

                <p>
                    Upload a PDF to create your
                    personal AI knowledge base.
                </p>
            </div>
        `;

        return;
    }

    documents.forEach(document => {

        const item =
            document.createElement
            ? document.createElement("div")
            : null;

        if (!item) {
            return;
        }

        item.className =
            "document-item";

        item.innerHTML = `
            <div class="document-icon">
                📄
            </div>

            <div class="document-info">

                <strong>
                    ${escapeHTML(
                        document.filename ||
                        "Unknown PDF"
                    )}
                </strong>

                <span>
                    ${Number(
                        document.chunks || 0
                    )} chunks
                </span>

            </div>
        `;

        container.appendChild(
            item
        );
    });
}


/* =========================================================
   PDF FILE SELECTION
   ========================================================= */

function selectPDF() {

    const input =
        $("pdfInput");

    if (!input) {
        return;
    }

    input.value = "";

    input.click();
}


/* =========================================================
   PDF INPUT EVENT
   ========================================================= */

document.addEventListener(
    "change",
    async (event) => {

        if (
            event.target &&
            event.target.id === "pdfInput"
        ) {

            const file =
                event.target.files?.[0];

            if (file) {
                await uploadPDF(file);
            }
        }
    }
);


/* =========================================================
   PDF UPLOAD
   ========================================================= */

async function uploadPDF(file) {

    if (!currentUser) {

        openAuthScreen("login");

        return;
    }

    if (!file) {
        return;
    }

    if (
        !file.name
            .toLowerCase()
            .endsWith(".pdf")
    ) {

        showUploadStatus(
            "Only PDF files are supported.",
            true
        );

        return;
    }

    /*
     * Backend limit = 10 MB.
     */

    const maxBytes =
        10 * 1024 * 1024;

    if (file.size > maxBytes) {

        showUploadStatus(
            "PDF is too large. Maximum size is 10 MB.",
            true
        );

        return;
    }

    showUploadStatus(
        "Uploading and processing PDF...",
        false
    );

    try {

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        const response =
            await backendRequest(
                "/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (!data?.success) {

            showUploadStatus(
                data?.message ||
                "PDF upload failed.",
                true
            );

            return;
        }

        showUploadStatus(
            `PDF uploaded successfully: ${data.filename}`,
            false
        );

        await loadDocumentsList();

    } catch (error) {

        console.error(
            "PDF upload error:",
            error
        );

        showUploadStatus(
            error.message ||
            "PDF upload failed.",
            true
        );
    }
}


/* =========================================================
   UPLOAD STATUS
   ========================================================= */

function showUploadStatus(
    message,
    isError = false
) {

    const element =
        $("uploadStatus");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "upload-status" +
        (isError ? " error" : " success");

    setTimeout(() => {

        if (
            element.textContent ===
            message
        ) {

            element.textContent = "";
            element.className =
                "upload-status";
        }

    }, 6000);
}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

function selectImage() {

    const input =
        $("imageInput");

    if (!input) {
        return;
    }

    input.value = "";

    input.click();
}


document.addEventListener(
    "change",
    (event) => {

        if (
            event.target &&
            event.target.id === "imageInput"
        ) {

            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            /*
             * Your current FastAPI backend has
             * PDF upload only.
             *
             * Vision will be connected later.
             */

            showUploadStatus(
                "Vision/image analysis is not connected yet.",
                true
            );
        }
    }
);


/* =========================================================
   NAVIGATION
   ========================================================= */

function showSection(
    section
) {

    currentSection =
        section;

    const sections = [
        "chat",
        "history",
        "documents",
        "vision",
        "hardware",
        "settings"
    ];

    sections.forEach(name => {

        const element =
            $(name + "Section");

        if (!element) {
            return;
        }

        element.classList.toggle(
            "active",
            name === section
        );
    });


    /*
     * Sidebar buttons
     */

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(button => {

        const onclick =
            button.getAttribute(
                "onclick"
            ) || "";

        button.classList.toggle(
            "active",
            onclick.includes(
                "'" + section + "'"
            )
        );
    });


    /*
     * Page titles
     */

    const titles = {

        chat: {
            title: "AI Chat",
            subtitle:
                "Your personal AI assistant"
        },

        history: {
            title: "Chat History",
            subtitle:
                "Your previous conversations"
        },

        documents: {
            title: "Documents",
            subtitle:
                "Your personal AI knowledge base"
        },

        vision: {
            title: "Vision",
            subtitle:
                "Image understanding"
        },

        hardware: {
            title: "Hardware",
            subtitle:
                "Connect your AI assistant to hardware"
        },

        settings: {
            title: "Settings",
            subtitle:
                "Manage your assistant"
        }
    };

    const page =
        titles[section] ||
        titles.chat;

    if ($("pageTitle")) {
        $("pageTitle").textContent =
            page.title;
    }

    if ($("pageSubtitle")) {
        $("pageSubtitle").textContent =
            page.subtitle;
    }


    /*
     * Special section actions
     */

    if (section === "history") {
        loadLocalHistory();
    }

    if (section === "documents") {
        loadDocumentsList();
    }


    /*
     * Close mobile sidebar
     */

    closeSidebar();
}


/* =========================================================
   ATTACHMENT MENU
   ========================================================= */

function toggleAttachmentMenu() {

    const menu =
        $("attachmentMenu");

    if (!menu) {
        return;
    }

    menu.classList.toggle(
        "show"
    );
}


document.addEventListener(
    "click",
    (event) => {

        const menu =
            $("attachmentMenu");

        const button =
            document.querySelector(
                ".attachment-btn"
            );

        if (!menu) {
            return;
        }

        if (
            !menu.contains(event.target) &&
            event.target !== button
        ) {

            menu.classList.remove(
                "show"
            );
        }
    }
);


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function toggleSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        $("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.toggle(
            "open"
        );
    }

    if (overlay) {
        overlay.classList.toggle(
            "show"
        );
    }
}


function closeSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        $("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.remove(
            "open"
        );
    }

    if (overlay) {
        overlay.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   TEXTAREA
   ========================================================= */

function setupInputEvents() {

    const input =
        $("userInput");

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        autoResizeTextarea
    );

    input.addEventListener(
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


function autoResizeTextarea() {

    const input =
        $("userInput");

    if (!input) {
        return;
    }

    input.style.height =
        "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            160
        ) + "px";
}


/* =========================================================
   KEYBOARD SHORTCUT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
         * Ctrl + K = focus chat
         */

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            const input =
                $("userInput");

            if (input) {
                input.focus();
            }
        }
    }
);


/* =========================================================
   DEBUG FUNCTION
   =========================================================
   Useful from Chrome Console:
   
   testBackend()
   
   It checks the public backend endpoint.
   ========================================================= */

async function testBackend() {

    try {

        const response =
            await fetch(
                BACKEND_URL + "/"
            );

        const data =
            await response.json();

        console.log(
            "BACKEND TEST:",
            data
        );

        return data;

    } catch (error) {

        console.error(
            "BACKEND TEST FAILED:",
            error
        );

        return null;
    }
}


/* =========================================================
   DEBUG AUTH TOKEN
   =========================================================
   
   IMPORTANT:
   This prints only token length/prefix.
   It does NOT print the complete token.
   ========================================================= */

async function testAuthToken() {

    const token =
        await getAccessToken();

    if (!token) {

        console.error(
            "AUTH TEST: No access token."
        );

        return false;
    }

    console.log(
        "AUTH TEST: Access token exists."
    );

    console.log(
        "Token length:",
        token.length
    );

    console.log(
        "Token starts with:",
        token.substring(0, 20) + "..."
    );

    /*
     * A Supabase access token should NOT be:
     *
     * sb_publishable_...
     *
     * That is the public project key.
     */

    if (
        token.startsWith(
            "sb_publishable_"
        )
    ) {

        console.error(
            "ERROR: Publishable key is being used as access token."
        );

        return false;
    }

    return true;
}


/* =========================================================
   DEBUG CHAT REQUEST
   ========================================================= */

async function testChatConnection() {

    try {

        console.log(
            "Testing authenticated /chat..."
        );

        const response =
            await backendRequest(
                "/chat",
                {
                    method: "POST",

                    body: JSON.stringify({
                        message:
                            "Hello"
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "CHAT TEST RESULT:",
            data
        );

        return data;

    } catch (error) {

        console.error(
            "CHAT TEST FAILED:",
            error
        );

        return null;
    }
}


/* =========================================================
   EXPORT DEBUG FUNCTIONS
   ========================================================= */

window.testBackend =
    testBackend;

window.testAuthToken =
    testAuthToken;

window.testChatConnection =
    testChatConnection;

window.getAccessToken =
    getAccessToken;

window.sendMessage =
    sendMessage;

window.newChat =
    newChat;

window.logoutUser =
    logoutUser;

window.loginUser =
    loginUser;

window.signupUser =
    signupUser;

window.showSection =
    showSection;

window.openAuthScreen =
    openAuthScreen;

window.backToWelcome =
    backToWelcome;

window.showAuthForm =
    showAuthForm;

window.selectPDF =
    selectPDF;

window.selectImage =
    selectImage;

window.toggleAttachmentMenu =
    toggleAttachmentMenu;

window.toggleSidebar =
    toggleSidebar;

window.closeSidebar =
    closeSidebar;

window.clearChatHistory =
    clearChatHistory;


/* =========================================================
   STARTUP COMPLETE
   ========================================================= */

console.log(
    "My AI Assistant script.js loaded successfully."
);
