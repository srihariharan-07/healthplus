import axios from 'axios';

const API = axios.create({ baseURL: 'https://healthplus-gzh5.onrender.com/api' });
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const patientLogin    = (data) => API.post('/auth/patient-login', data);
export const doctorLogin     = (data) => API.post('/auth/doctor-login', data);
export const registerPatient = (data) => API.post('/auth/register', data);

export const getDoctors = () => API.get('/doctors');

export const getQueue    = (doctorId) => API.get(`/queue/${doctorId}`);
export const joinQueue   = (data)     => API.post('/queue/join', data);
export const updateQueue = (id, data) => API.patch(`/queue/${id}`, data);

export const getVisits          = (patientId) => API.get(`/visits/patient/${patientId}`);
export const createVisit        = (data)      => API.post('/visits', data);
export const getPrescriptions   = (visitId)   => API.get(`/visits/${visitId}/prescriptions`);
export const addPrescription    = (visitId, data) => API.post(`/visits/${visitId}/prescriptions`, data);
export const updatePrescription = (id, data)  => API.patch(`/visits/prescriptions/${id}`, data);
export const uploadProfilePic = (data) => API.post('/upload', data);
export const updatePatient    = (id, data) => API.patch(`/patients/${id}`, data);
export const searchPatients = (query) => API.get(`/patients/search?q=${query}`);