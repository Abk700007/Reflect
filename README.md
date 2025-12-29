# 🌑 REFLECT


> *"An AI-powered void that listens to the silence between your thoughts."*

**Reflect** is an ambient web experience designed to be a digital sanctuary. Unlike traditional chatbots that rush to solve problems, Reflect acts as a mystical mirror—using the biological reasoning capabilities of **Google Gemini 2.5** to understand the *emotional texture* of your words, visualize them as color, and return a poetic fragment of insight.

---

## ✨ Features

### 🧠 The Brain: Gemini 2.5 Flash
We bypass standard conversational AI in favor of **Gemini 2.5's** deep reasoning.
* **Structured Output:** The AI returns raw JSON containing a poetic reflection, an abstract emotional state (e.g., "Quiet Burnout"), and a calculated hex color code based on color theory.
* **Atmospheric Bleed:** The entire room's lighting shifts subtly to match the detected emotion.

### 🎨 The Visuals: "Living 2D"
We achieved a high-budget 3D feel using purely 2D technologies.
* **Parallax Depth:** Custom physics hooks map mouse movement to the background layers. The Snow, the Orb, and the Void move at different velocities, creating a deep window effect.
* **Void Snow:** A procedural particle system generated via React `useMemo` for efficient, eerie drifting ash.

### 🔊 The Sound: Procedural Audio
* **Drone Layer:** A constant, low-frequency ambient loop sets the mood.
* **Reactive Chime:** A specific "Shimmer" sound triggers exactly when the AI insight is revealed, creating a Pavlovian sense of relief.

---

## 🛠️ Tech Stack

* **Frontend:** React (TypeScript) + Vite
* **Animation Engine:** Framer Motion (Complex staggers, AnimatePresence, Physics Springs)
* **AI Model:** Google Gemini 2.5 Flash (via Google Generative AI SDK)
* **Audio:** Howler.js
* **Styling:** Tailwind CSS + Custom CSS Animations

---

## 🚀 Getting Started

### 1. Clone the Repository
```
git clone https://github.com/abk700007/Reflect.git
cd reflect
```
### 2. Install Dependencies
```
npm install
```
### 3. Configure the AI
Create a .env file in the root directory and add your Google Gemini API key:
```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```
### 4. Enter the Void
```
npm run dev
```
Open http://localhost:5173 in your browser.
