# Deployment Guide

This app is optimized for deployment on **Vercel** (frontend/backend) with **MongoDB Atlas** (database).

## Prerequisites
1.  **Vercel Account:** [Sign up](https://vercel.com)
2.  **MongoDB Atlas:** Create a cluster and get the connection string.
3.  **Clerk:** Create an application for Authentication.
4.  **Stripe:** Create an account for payments.
5.  **OpenRouter:** Get an API key for the Uncensored AI.
6.  **Cloudinary:** Create an account for image storage.
7.  **Google Cloud Vision:** Enable the API for OCR (optional, but recommended).

## Environment Variables
Set these in your Vercel Project Settings > Environment Variables.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Public Key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk Secret Key | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign In Path | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign Up Path | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after login | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after signup | `/` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb+srv://...` |
| `WEBHOOK_SECRET` | Clerk Webhook Secret | `whsec_...` |
| `NEXT_PUBLIC_SERVER_URL` | Your Vercel Domain | `https://arabian-rizz.vercel.app` |
| `OPENROUTER_API_KEY` | **Critical:** For Uncensored AI | `sk-or-v1-...` |
| `OPENAI_API_KEY` | For Embeddings & TTS (Optional if using mocks) | `sk-...` |
| `STRIPE_SECRET_KEY` | Stripe Secret | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Public | `pk_test_...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Name | `my-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary Key | `123456...` |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret | `abcdef...` |
| `GOOGLE_APPLICATION_CREDENTIALS` | **JSON String** of Service Account | `{"type": "service_account"...}` |

## Deployment Steps

1.  **Push to GitHub:** Ensure your code is in a GitHub repository.
2.  **Import to Vercel:** Go to Vercel Dashboard -> Add New -> Project -> Import your repo.
3.  **Configure Env Vars:** Copy/Paste the variables from the table above.
4.  **Deploy:** Click "Deploy".
5.  **Post-Deploy Setup:**
    *   **Clerk Webhooks:** Go to Clerk Dashboard -> Webhooks. Add endpoint: `https://YOUR-DOMAIN.vercel.app/api/webhooks/clerk`. Copy the Signing Secret to `WEBHOOK_SECRET` in Vercel.
    *   **Stripe Webhooks:** Go to Stripe Dashboard -> Webhooks. Add endpoint: `https://YOUR-DOMAIN.vercel.app/api/webhooks/stripe`. Select event `checkout.session.completed`. Copy Signing Secret to `STRIPE_WEBHOOK_SECRET`.

## MongoDB Atlas Vector Search Index
For RAG to work, you MUST create a Search Index in MongoDB Atlas.

1.  Go to Atlas -> Database -> Search -> Create Search Index.
2.  Select **JSON Editor**.
3.  Database: `test` (or your db name), Collection: `messages`.
4.  Paste this configuration:
    ```json
    {
      "name": "vector_index",
      "type": "vectorSearch",
      "fields": [
        {
          "type": "vector",
          "path": "embedding",
          "numDimensions": 1536,
          "similarity": "cosine"
        }
      ]
    }
    ```
5.  Repeat for `userknowledges` collection (same config).

## Troubleshooting
*   **500 Errors on AI:** Check `OPENROUTER_API_KEY` is valid.
*   **Payments failing:** Check `STRIPE_WEBHOOK_SECRET` and ensure the webhook URL is correct in Stripe Dashboard.
*   **RAG returning nothing:** Ensure the Vector Search Index is "Active" in MongoDB Atlas.
