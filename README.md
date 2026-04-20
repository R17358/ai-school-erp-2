# 🏫 SchoolSphere ERP — AI-Powered School Management System

A full-featured, AI-integrated School ERP system supporting multiple schools with role-based access control, automated scheduling, intelligent insights, and modern UI/UX.

## 🏗️ Architecture

```
school-erp/
├── frontend/          # React.js + Redux + Tailwind CSS
├── backend/           # Node.js + Express + Prisma + PostgreSQL
├── ai-service/        # Python FastAPI + LangChain + RAG
└── docs/              # API docs, ERD, setup guides
```

## 🧩 Tech Stack

| Layer        | Tech                                               |
|--------------|----------------------------------------------------|
| Frontend     | React 18, Redux Toolkit, React Router v6, TailwindCSS |
| Backend      | Node.js, Express, Prisma ORM, JWT, Zod             |
| Database     | PostgreSQL (Supabase)                              |
| AI Service   | Python, FastAPI, LangChain, OpenAI/Gemini, RAG     |
| Storage      | Cloudinary                                         |
| Auth         | JWT + Refresh Tokens + Role-Based Access Control   |

## 👥 Role Hierarchy & Permissions

| Role         | Access Level                                        |
|--------------|-----------------------------------------------------|
| Super Admin  | Full access across all schools                     |
| Principal    | Full CRUD on all school data                       |
| Vice Principal | CRUD on teachers, students, limited staff         |
| Teacher      | Read students, manage attendance, results          |
| Staff        | Limited: own profile, notices                      |
| Watchman/Peon| Own profile, daily log                            |
| Student      | Read own data, timetable, results, notices         |
| Parent       | Read child's data, fees, attendance, results       |

## 🤖 AI Features

1. **Auto Timetable Generator** — Generates conflict-free timetables using teacher availability, subjects, and classrooms
2. **Seating Arrangement AI** — Exam seating auto-assignment with roll-number logic
3. **Study Planner** — Personalized roadmaps from syllabus + student performance
4. **Note Generator** — Simple language notes from syllabus topics using RAG
5. **Question Paper Generator** — Bloom's taxonomy-based QP generation
6. **Result Analyzer** — AI insights on student performance trends
7. **Fee Defaulter Predictor** — ML-based early warning for fee dues
8. **Leave Approval Suggestion** — AI recommends approval based on history

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (or Supabase account)
- Cloudinary account

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Fill in your credentials
npx prisma migrate dev
npm run dev
```

### 2. AI Service Setup
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🌐 Multi-School Support
Each school gets:
- Unique `school_code` for URL routing
- Custom logo + branding via Cloudinary
- Isolated data with shared infrastructure
- Custom AI model API key per school (optional)

## 📊 Key Modules
- 👨‍🎓 Student Management (enrollment, profile, documents)
- 👩‍🏫 Teacher & Staff Management (HRMS)
- 📅 Attendance (daily, subject-wise)
- 📋 Timetable (AI-generated)
- 📝 Examination & Results
- 💰 Fees & Payments
- 💼 Leave Management
- 📢 Notice Board & Communication
- 🏖️ Holiday & Calendar Management
- 🤖 AI Assistant (per-school RAG chatbot)
