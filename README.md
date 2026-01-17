# Sigma AI Career Advisor 🚀

> **An intelligent AI-powered career guidance platform** that helps professionals and students navigate their career journey with personalized recommendations, skill validation, and interview preparation.

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e)](https://supabase.com)

## ✨ Features

### 🎯 Core Capabilities
- **AI Career Advisor** - Conversational AI that provides personalized career guidance
- **Resume Analysis** - Upload and parse resumes with AI-powered insights
- **Skill Validation** - Assess skills against target roles and identify gaps
- **Job Matching** - AI-generated job recommendations based on your profile
- **Interview Prep** - Tailored interview questions and preparation materials
- **Learning Plans** - Personalized learning journeys for skill development

### 🔧 Technical Highlights
- **Sigma Agent Workflow** - Multi-step guided journey from resume upload to job readiness
- **Real-time Chat** - Gemini-style conversational interface
- **Responsive Design** - Optimized for desktop and mobile experiences
- **Dark/Light Mode** - Full theme support with smooth transitions

## 🏗️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Supabase (Database, Auth, Edge Functions) |
| **AI** | Lovable AI Gateway |
| **State** | TanStack React Query |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sigma-ai-advisor.git

# Navigate to project directory
cd sigma-ai-advisor

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── landing/        # Landing page components
│   ├── portfolio/      # Portfolio display components
│   ├── sigma-agent/    # Sigma workflow components
│   └── ui/             # shadcn/ui components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions
├── pages/              # Route page components
├── services/           # API service functions
└── types/              # TypeScript type definitions

supabase/
└── functions/          # Edge functions for AI processing
```

## 🎨 Design System

The project uses a semantic design token system:
- **Colors**: HSL-based with CSS custom properties
- **Typography**: Outfit font family
- **Components**: Extended shadcn/ui with custom variants
- **Animations**: Framer Motion for smooth transitions

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with features overview |
| `/auth` | Authentication (login/signup) |
| `/dashboard` | User dashboard with journey progress |
| `/advisor` | AI career advisor chat interface |
| `/resume` | Resume upload and analysis |
| `/sigma` | Guided career development workflow |
| `/interview` | Interview preparation materials |
| `/projects` | Project ideas and build guidance |
| `/profile` | User profile management |

## 🔐 Authentication

The app supports:
- Email/Password authentication
- OAuth providers (Google, GitHub)
- Protected routes with automatic redirects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Lovable](https://lovable.dev) - AI-powered development platform
- [shadcn/ui](https://ui.shadcn.com) - Beautiful component library
- [Supabase](https://supabase.com) - Open source Firebase alternative

---

<p align="center">
  Built with ❤️ for the Google Hackathon 2025
</p>
