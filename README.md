# 🧠 LNX Vault

**Your own private, self-hostable digital vault — powered by GitHub Auth and S3.**
Create directories, upload files, write beautiful markdowns, and access it all from a minimal web UI.
Perfect for dotfiles, resumes, personal notes, and more — with support for public/private access control.

> 🌐 Live Demo: [lnx.parthkapoor.me](https://lnx.parthkapoor.me)

---

## ✨ Features

- 🔐 **GitHub Authentication** with Admin access control
- 🪣 **S3-Backed Storage** (DigitalOcean Spaces, AWS S3, etc.)
- 📂 **Directory and File Management** via Web
- 📝 **Markdown Editor** for notes, resumes, and guides
- 🌐 **Public/Private Access** for files and folders
- 🚀 **One-Click Deploy on Vercel**

---

## ⚙️ Tech Stack

- **Frontend**: Next.js (TypeScript)
- **Auth**: [Better Stack Auth](https://betterstack.com/)
- **Storage**: S3-compatible (Spaces, AWS, etc.)
- **Cache**: Upstash Redis
- **Markdown**: MDX Rendering

---

## 🚀 Self-Hosting Guide

### 1. 🍴 Clone the Repository

```bash
git clone https://github.com/parthkapoor-dev/lnx-vault.git
cd lnx-vault
````

---

### 2. 🧪 Set Up Environment Variables

Create a `.env` file in the root:

```env
# Your live or local URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Better Auth
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth App
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GITHUB_ADMIN_EMAIL=""

# Upstash Redis
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# S3 / Spaces
SPACES_KEY=""
SPACES_SECRET=""
SPACES_BUCKET=""
```

> 💡 You can use [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces) or any S3-compatible provider.

---

### 3. 🧑‍💻 Run Locally

```bash
npm install
npm run dev
```

Now open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 4. ☁️ Deploy on Vercel (Recommended)

1. Push the repo to your GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Import Project"**, choose your repo
4. Set the environment variables in Vercel dashboard
5. Click **Deploy**

Done 🎉 Your personalized cloud vault is now live!

---

## 🔐 Admin Access

By default, only the GitHub account marked as "admin" in your `.env`-connected auth logic can:

* Create/upload/edit files & markdowns
* Add/remove directories
* Toggle public/private flags

---

## 📄 License

MIT © [Parth Kapoor](https://parthkapoor.me)

---

## 🌟 Star This Project

If this helped you organize your digital life — consider giving it a ⭐ on GitHub!
