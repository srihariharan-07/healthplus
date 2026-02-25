# 🏥 HealthPlus — Full Stack Hospital Management System

A complete **MERN Stack** hospital management system with real-time queue management, patient care plans, and medication tracking.

🌐 **Live Demo:** [healthplus-pi.vercel.app](https://healthplus-pi.vercel.app)

---

## 🚀 Features

### 👨‍⚕️ Doctor Portal
- Secure doctor login with JWT authentication
- Live queue management — call next patient, end sessions
- View patient triage info (complaint & symptoms)
- Search patient records by name or Patient ID
- Create visit records with clinical notes
- Add prescriptions to visits
- Track patient medication adherence with dates

### 🧑‍💼 Patient Portal
- Patient registration & login
- Join doctor queues with real-time token tracking
- Submit pre-visit triage info (complaint & symptoms)
- View estimated wait time and queue position
- Access full care plan — visit history & follow-ups
- Mark daily medications as taken
- View medication adherence percentage
- Upload profile picture

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT (JSON Web Tokens) |
| Password Security | bcryptjs |
| HTTP Client | Axios |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## 📁 Project Structure
```
healthplus/
├── frontend/          # React application
│   ├── src/
│   │   ├── App.js     # Main application with all components
│   │   └── api.js     # Axios API helper functions
│   └── package.json
│
├── backend/           # Express REST API
│   ├── models/        # Mongoose schemas
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Queue.js
│   │   ├── Visit.js
│   │   └── Prescription.js
│   ├── routes/        # API routes
│   │   ├── auth.js
│   │   ├── doctors.js
│   │   ├── queue.js
│   │   ├── visits.js
│   │   ├── patients.js
│   │   └── upload.js
│   ├── middleware/
│   │   └── auth.js    # JWT verification
│   ├── server.js      # Express app entry point
│   └── seed.js        # Database seeder
│
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB installed locally
- Git

### 1. Clone the repository
```bash
git clone https://github.com/srihariharan-07/healthplus.git
cd healthplus
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthplus
JWT_SECRET=healthplus_super_secret_key_2024
```

Seed the database:
```bash
node seed.js
```

Start the backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```

App will open at `http://localhost:3000`

---

## 🔐 Test Credentials

### Doctors
| Name | Email | Password |
|---|---|---|
| Dr. Vijay | vijay@health.plus | 123 |
| Dr. Ajith | ajith@health.plus | 123 |
| Dr. Vikram | vikram@health.plus | 123 |

### Patients
| Name | Patient ID | Email | Password |
|---|---|---|---|
| John Doe | P1001 | john@example.com | 123 |
| Smith Jain | P1002 | smith@example.com | 123 |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new patient |
| POST | /api/auth/patient-login | Patient login |
| POST | /api/auth/doctor-login | Doctor login |

### Doctors
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/doctors | Get all doctors |

### Queue
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/queue/:doctorId | Get doctor's queue |
| POST | /api/queue/join | Join a queue |
| PATCH | /api/queue/:id | Update queue entry |

### Visits & Prescriptions
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/visits/patient/:id | Get patient visits |
| POST | /api/visits | Create new visit |
| GET | /api/visits/:id/prescriptions | Get prescriptions |
| POST | /api/visits/:id/prescriptions | Add prescription |
| PATCH | /api/visits/prescriptions/:id | Update prescription |

### Patients
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/patients/search?q= | Search patients |
| PATCH | /api/patients/:id | Update patient |

---

## 👨‍💻 Author

**Srihariharan**
- GitHub: [@srihariharan-07](https://github.com/srihariharan-07)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).