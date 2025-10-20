// =============================
// Notes
// =============================
//
// - "createMsgElement": أنشئ عنصر رسالة — ابحث عنها وتأكد من فهمها جيدًا.
// - "scrollToBottom": دالة تمرير للأسفل — افهم كيف تعمل.
// - "typingEffect": فيها تأثير الكتابة التدريجي — ابحث عنها وراجع كيف تعمل.
// - "generateResponse": الدالة الأساسية لجلب رد البوت.
// - داخل generateResponse فيه ميزة مخصصة: رد تلقائي بالاسم والمطور، افهمها جيدًا.
// - التزم بترتيب الدوال لتسهيل الصيانة.
// - لا تنسَ تحديث الصور أو المسارات في الكود حسب مشروعك.
// - جميع التعليقات التعليمية مضافة لتوضيح المنطق، يمكن حذفها في الإنتاج.
//

// =============================
// Element Selectors
// =============================
const container = document.querySelector(".container");
const chatsContianer = document.querySelector(".chat-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

// =============================
// API Setup
// =============================

const API_URL = "https://chatbot-nu-livid.vercel.app/api/chat";

// =============================
// Global Variables
// =============================
let typingInterval, controller;
const chatHistory = [];
const userData = { message: "", file: {} };

// =============================
// Helper Functions
// =============================

// Create message element
const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Scroll to bottom of container
const scrollToBottom = () => {
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
};

// Typing effect function
const typingEffect = (text, textElement, botrMsgDiv) => {
  textElement.textContent = "";
  const word = text.split(" ");
  let wordIndex = 0;

  typingInterval = setInterval(() => {
    if (wordIndex < word.length) {
      textElement.textContent +=
        (wordIndex === 0 ? "" : " ") + word[wordIndex++];
      scrollToBottom(); // ✅ أثناء الكتابة
    } else {
      clearInterval(typingInterval);
      botrMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");

      scrollToBottom(); // ✅ بعد الانتهاء تأكد ننزل آخر شيء
    }
  }, 10);
};

// =============================
// API Response Handler
// =============================
/**
 * ✅ التعديل هنا: الدالة تستقبل الآن userMessage كمعامل
 * هذا يحل مشكلة ReferenceError: userMessage is not defined
 */
const generateResponse = async (userMessage, botrMsgDiv) => {
  const textElement = botrMsgDiv.querySelector(".message-text"); // 🔹 Feature: bot responds with its name and creator info // ✳️ الآن يمكن استخدام userMessage لأنه تم تمريره كمعامل
  controller = new AbortController();

  const lowerMsg = userMessage.toLowerCase(); // Check if user is asking about bot's name or creator

  const isAskingAboutNameOrCreator =
    lowerMsg.includes("اسمك") ||
    lowerMsg.includes("مين طورك") ||
    lowerMsg.includes("من طورك") ||
    lowerMsg.includes("مين صنعك") ||
    lowerMsg.includes("who made you") ||
    lowerMsg.includes("your name") ||
    lowerMsg.includes("developer") ||
    lowerMsg.includes("creator") ||
    lowerMsg.includes("what is your name") ||
    lowerMsg.includes("اش اسمك") ||
    lowerMsg.includes("ماهو اسمك");

  if (isAskingAboutNameOrCreator) {
    let reply = ""; // Detect message language (Arabic or English)

    if (/[أ-ي]/.test(userMessage)) {
      reply = "اسمي Shandhor، والي طورني هو عبدالرحمن 💻";
    } else {
      reply = "My name is Shandhor, and I was created by Abdulrhman 💻";
    }

    textElement.textContent = reply;
    botrMsgDiv.classList.remove("loading"); // إزالة حالة التحميل
    return; // Stop here (don’t call the API)
  } // Add user message and file data to chat history & search about this code

  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: (({ fileName, isImage, ...rest }) => rest)(
                userData.file
              ),
            },
          ]
        : []),
    ],
  });

  try {
    // Send chat history to API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message); // Get the bot response and show it with typing effect

    const botMessage = data.candidates[0].content.parts[0].text
      .replaceAll(/\*\*([^*]+)\*\*/g, "$1")
      .trim();

    typingEffect(botMessage, textElement, botrMsgDiv);
    chatHistory.push({ role: "model", parts: [{ text: botMessage }] });
    // console.log(chatHistory);
  } catch (error) {
    // console.log(error);
    textElement.style.color = "#d62939";
    textElement.textContent =
      error.name === "AbortError" ? "Response Generation Stop." : error.message;
    botrMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {}; // Clear file data after each submission
  }
};

// =============================
// Form Submission Handler
// =============================
const handelFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding"))
    return;

  promptInput.value = "";
  userData.message = userMessage; // User message element
  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");

  // Generate user message HTML with optional file attachment
  // Search About this code:
  //from:
  const userMsgHtml = `
<p class="message-text"></p>
${
  userData.file.data
    ? userData.file.isImage
      ? `<img src="data:${userData.file.mime_type};base64,
${userData.file.data}" class="img-attachment" />`
      : `<p class="file-attachment"><span
class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`
    : ""
}`; // to here

  const userMsgDiv = createMsgElement(userMsgHtml, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContianer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    // Bot message placeholder
    const botMsgHtml = `<img src="Images/logo.png" class="avatar"><p class="message-text">Just a sec...</p>`;
    const botrMsgDiv = createMsgElement(botMsgHtml, "bot-message", "loading");
    chatsContianer.appendChild(botrMsgDiv);
    scrollToBottom();
    generateResponse(userMessage, botrMsgDiv);
  }, 600);
};

// =============================
// Event Listener
// =============================

// Handle file input change (file upload)
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = ""; // Reset file input
    const base64String = e.target.result.split(",")[1]; // Get base64 string without metadata
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add(
      "active",
      isImage ? "img-attached" : "file-attached"
    ); // ✅ Store the file data inside onload

    userData.file = {
      fileName: file.name,
      data: base64String,
      mime_type: file.type,
      isImage,
    };
  };
});

// Cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {}; // Clear file data
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");
});

// Stop responsing
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  userData.file = {}; // Clear file data
  controller?.abort();
  clearInterval(typingInterval);
  chatsContianer
    .querySelector(".bot-message.loading")
    .classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

// Delete All Chats
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContianer.innerHTML = "";
  document.body.classList.remove("bot-responding", "chats-active");
});

// Handle suggestions click (hide and show)
const suggestions = document.querySelectorAll(".suggestions-itme");
suggestions.forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit")); // Search about this method
  });
});

// Show and hide controls for mobile on prompt input focus
document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const shouldHide =
    target.classList.contains("prompt-input") ||
    (wrapper.classList.contains("hide-controls") &&
      (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
});

// Theme Toggle
themeToggle.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

promptForm.addEventListener("submit", handelFormSubmit);
promptForm
  .querySelector("#add-file-btn")
  .addEventListener("click", () => fileInput.click());

function adjustChatPadding() {
  const container = document.querySelector(".container");
  const prompt = document.querySelector(".prompt-container");
  if (!container || !prompt) return;

  const promptHeight = prompt.offsetHeight;
  container.style.paddingBottom = `${promptHeight + 20}px`; // 20px زيادة صغيرة مريحة
}

// شغّلها مرة عند تحميل الصفحة
adjustChatPadding();

// وأعد حسابها لو تغيّر حجم الشاشة أو تغيّر ارتفاع الـ prompt (مهم للموبايل)
window.addEventListener("resize", adjustChatPadding);
window.addEventListener("orientationchange", adjustChatPadding);
