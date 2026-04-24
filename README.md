# 🚀 Smart Study Platform

A modern **AI-powered study platform** built with React that helps students manage notes and interact with an AI assistant for learning.

---

## ✨ Features

### 📚 Notes Management

* Create, edit, and delete notes
* Categorize notes by subject
* Clean and minimal UI
* Data persistence using localStorage

### 🤖 AI Assistant

* Chat-based AI interface
* Real-time responses using Gemini API
* Smooth chat UI with auto-scroll
* Typing indicator

### 🎨 UI/UX

* Modern, minimal design (inspired by Notion & ChatGPT)
* Responsive layout
* Smooth animations and transitions
* Light/Dark theme support (optional)

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite)
* **Styling:** CSS (custom, no Tailwind)
* **State Management:** React Hooks
* **AI Integration:** Google Gemini API
* **HTTP Client:** Axios

---

## 📂 Project Structure

```
client/
│
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Notes.jsx
│   │   ├── AI.jsx
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── notes.css
│   │   ├── ai.css
│   │
│   ├── App.jsx
│   ├── main.jsx
│
├── .env
├── package.json
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/smart-study-platform.git
cd smart-study-platform/client
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Add environment variables

Create a `.env` file in the root:

```env
VITE_GEMINI_KEY=your_api_key_here
```

---

### 4️⃣ Run the project

```bash
npm run dev
```

---

## 🔑 API Setup (Gemini)

1. Go to: https://makersuite.google.com/app/apikey
2. Generate API key
3. Paste it into `.env`


npm install react-markdown
---

## 🚀 Future Improvements

* ✅ Markdown & code block support in chat
* ✅ Streaming AI responses (typing effect)
* ✅ Backend integration for secure API calls
* ✅ User authentication
* ✅ Cloud note storage
* ✅ File upload & AI summarization

---

## 🧠 Learning Highlights

* React state management (useState, useEffect)
* API integration with AI models
* Building clean UI without frameworks
* Debugging real-world API issues
* Creating production-like frontend architecture

---

## 🤝 Contributing

Feel free to fork the repo and submit pull requests.

---

## 📜 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

**Pavan Kumar Gupta**

---

⭐ If you like this project, consider giving it a star!
