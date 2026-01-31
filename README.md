# ArabianRizz 🧞‍♂️ - The Uncensored AI Wingman

**Stop getting rejected. Get Loved. Get Laid.**

ArabianRizz is a cutting-edge **AI Dating Wingman** that helps men navigate modern dating with confidence. Unlike censored tools like ChatGPT, our AI is **unfiltered**, **spicy**, and **persuasive**.

## 🔥 Key Features

### 1. Uncensored AI Chat (`Hermes 2 Mixtral`)
*   **No Filters:** Get real, bold, and flirty advice that actually works.
*   **Dialect Support:** Specialized in Arabic dialects (Egyptian, Levantine, Gulf) and English slang.
*   **Hookup Generator:** One-click spicy lines to close the deal.

### 2. "My Persona" RAG System
*   **Personalized:** The AI learns from *you*. Add your job, hobbies, and style to the "My Persona" tab.
*   **Contextual:** It retrieves your bio during chats to suggest dates you'd actually enjoy.
*   **Vector Search:** Powered by MongoDB Atlas Vector Search.

### 3. Art Generation (`DALL-E 3`)
*   **Visual Rizz:** Generate custom images of the girl in specific scenarios to send back.
*   **Cloudinary Storage:** All generated art is saved securely.

### 4. Monetization Ready
*   **Credit System:** Users buy credit packs (Starter, Playboy, Rizz God) via Stripe.
*   **Pay-Per-Use:** Deducts credits for high-value actions (Art Gen: 3 credits, Wingman Reply: 1 credit).

### 5. Sexy & Polished UI
*   **Modern Design:** Glassmorphism, smooth animations, and a premium purple aesthetic.
*   **Mobile First:** Optimized for use on the go (in the club, at the bar).

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   pnpm (`npm i -g pnpm`)
*   MongoDB Atlas Account
*   Clerk Account
*   Stripe Account
*   OpenRouter API Key

### Installation

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/als7ly/ArabianRizz.git
    cd ArabianRizz
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Copy `.env.example` to `.env.local` and fill in your keys.
    *(See `docs/DEPLOYMENT.md` for the full list)*

4.  **Run Development Server:**
    ```bash
    pnpm dev
    ```

## 📚 Documentation

We have detailed guides for every aspect of the project:

*   **[Deployment Guide](docs/DEPLOYMENT.md):** How to deploy to Vercel & setup MongoDB Atlas Vector Search.
*   **[Testing Guide](docs/TESTING_GUIDE.md):** Manual QA checklist and how to run tests.
*   **[AI Strategy](docs/AI_STRATEGY.md):** Deep dive into the Uncensored Model and RAG architecture.
*   **[Marketing Strategy](docs/MARKETING_STRATEGY.md):** Launch plan, ad hooks, and SEO keywords.

## 🛠️ Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Shadcn UI + Framer Motion (Animations)
*   **Database:** MongoDB (Mongoose) + Atlas Vector Search
*   **Auth:** Clerk
*   **Payments:** Stripe
*   **AI:** OpenRouter (LLM) + OpenAI (Embeddings/DALL-E/TTS) + Google Cloud Vision (OCR)

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
