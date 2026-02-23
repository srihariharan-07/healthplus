import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Users, User, Calendar, Clock, ChevronLeft, 
  CheckCircle2, LogOut, Search, Stethoscope, AlertCircle,
  FileText, MapPin, Phone
} from 'lucide-react';
import { 
  patientLogin, doctorLogin, registerPatient,
  getDoctors, getQueue, joinQueue as joinQueueAPI,
  updateQueue, getVisits, createVisit as createVisitAPI,
  getPrescriptions, addPrescription as addPrescriptionAPI,
  updatePrescription, uploadProfilePic, updatePatient,
  searchPatients
} from './api';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getAdherenceRate = (prescription) => {
  if (!prescription.duration.includes('days') || !prescription.dosage.toLowerCase().includes('daily')) return null;
  const duration = parseInt(prescription.duration);
  const start = new Date(prescription.startDate);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  const expected = Math.min(diffDays, duration);
  if (expected <= 0) return 100;
  return Math.round((prescription.dosesTaken.length / expected) * 100);
};

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    serving: 'bg-green-100 text-green-800 border-green-200',
    waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    done: 'bg-gray-100 text-gray-800 border-gray-200',
    default: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
};

export default function App() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]);
  const [visits, setVisits] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [view, setView] = useState('portal');
  const [currentUser, setCurrentUser] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load doctors when app starts
  useEffect(() => {
    getDoctors()
      .then(({ data }) => setDoctors(data))
      .catch(err => console.log('Error loading doctors:', err));
  }, []);

  // Load queue when doctor logs in
  useEffect(() => {
    if (isDoctor && currentUser) {
      getQueue(currentUser._id)
        .then(({ data }) => setQueue(data))
        .catch(err => console.log('Error loading queue:', err));
    }
  }, [isDoctor, currentUser]);

  // Load visits when patient logs in
  useEffect(() => {
    if (!isDoctor && currentUser) {
      getVisits(currentUser._id)
        .then(({ data }) => setVisits(data))
        .catch(err => console.log('Error loading visits:', err));

      getQueue(null)
        .catch(() => {});
    }
  }, [isDoctor, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsDoctor(false);
    setQueue([]);
    setVisits([]);
    setPrescriptions([]);
    setView('portal');
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    const { pid, email, pass } = e.target.elements;
    setLoading(true);
    try {
      const { data } = await patientLogin({
        patientId: pid.value,
        email: email.value,
        password: pass.value
      });
      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      setIsDoctor(false);
      setView('patient-dash');
      setLoginError('');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    const { email, pass } = e.target.elements;
    setLoading(true);
    try {
      const { data } = await doctorLogin({
        email: email.value,
        password: pass.value
      });
      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      setIsDoctor(true);
      setView('doctor-dash');
      setLoginError('');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = e.target.elements;
    if (form.pass.value !== form.confirm.value) {
      setLoginError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await registerPatient({
        patientId: form.pid.value,
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        dob: form.dob.value,
        address: form.address.value,
        password: form.pass.value
      });
      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      setIsDoctor(false);
      setView('patient-dash');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleJoinQueue = async () => {
    if (!selectedDoctorId) return;
    try {
      const { data } = await joinQueueAPI({ doctorId: selectedDoctorId });
      setQueue(prev => [...prev, data]);
      setSelectedDoctorId(null);
    } catch (err) {
      console.log('Error joining queue:', err);
    }
  };

  const submitSymptoms = async (e, entryId) => {
    e.preventDefault();
    const complaint = e.target.complaint.value;
    const symptoms = e.target.symptoms.value;
    try {
      await updateQueue(entryId, { complaint, symptoms });
      setQueue(prev => prev.map(q => q._id === entryId ? { ...q, complaint, symptoms } : q));
    } catch (err) {
      console.log('Error updating queue:', err);
    }
  };

  const toggleMedication = async (id) => {
  const today = getTodayStr();
  const presc = prescriptions.find(p => p._id === id);
  if (!presc || !presc.dosesTaken) return;
  const taken = presc.dosesTaken.includes(today);
    const newDoses = taken
      ? presc.dosesTaken.filter(d => d !== today)
      : [...presc.dosesTaken, today];
    try {
      await updatePrescription(id, { dosesTaken: newDoses });
      setPrescriptions(prev => prev.map(p => p._id === id ? { ...p, dosesTaken: newDoses } : p));
    } catch (err) {
      console.log('Error updating medication:', err);
    }
  };

  const callNext = async () => {
    const docQueue = queue.filter(q => q.doctorId === currentUser._id || q.doctorId?._id === currentUser._id).sort((a, b) => a.tokenNumber - b.tokenNumber);
    const currentlyServing = docQueue.find(q => q.status === 'serving');
    const nextWaiting = docQueue.find(q => q.status === 'waiting');
    try {
      if (currentlyServing) await updateQueue(currentlyServing._id, { status: 'done' });
      if (nextWaiting) await updateQueue(nextWaiting._id, { status: 'serving' });
      setQueue(prev => prev
        .map(q => {
          if (currentlyServing && q._id === currentlyServing._id) return { ...q, status: 'done' };
          if (nextWaiting && q._id === nextWaiting._id) return { ...q, status: 'serving' };
          return q;
        })
        .filter(q => q.status !== 'done')
      );
    } catch (err) {
      console.log('Error calling next:', err);
    }
  };

  const endSession = async () => {
    const serving = queue.find(q => q.status === 'serving');
    if (!serving) return;
    try {
      await updateQueue(serving._id, { status: 'done' });
      setQueue(prev => prev.filter(q => q._id !== serving._id));
    } catch (err) {
      console.log('Error ending session:', err);
    }
  };

  // --- LAYOUT ---
  const Layout = ({ children, title, subtitle }) => (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Health<span className="text-indigo-600">Plus</span></span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>}
            {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );

  const PortalView = () => (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://static.vecteezy.com/system/resources/previews/004/449/782/non_2x/abstract-geometric-medical-cross-shape-medicine-and-science-concept-background-medicine-medical-health-cross-healthcare-decoration-for-flyers-poster-web-banner-and-card-illustration-vector.jpg')" }}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      <div className="relative bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
        <Activity size={48} className="text-indigo-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-800">HealthPlus</h1>
        <p className="text-slate-500 mt-2 mb-8">Smart Healthcare Management & Queueing</p>
        <div className="space-y-4">
          <button onClick={() => setView('patient-login')} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:-translate-y-1">Patient Access</button>
          <button onClick={() => setView('doctor-login')} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all transform hover:-translate-y-1">Doctor Portal</button>
        </div>
      </div>
    </div>
  );

  const LoginView = ({ type }) => (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <button onClick={() => setView('portal')} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors mb-6 font-medium">
          <ChevronLeft size={20} /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">{type === 'doctor' ? 'Provider Login' : 'Patient Login'}</h2>
        <p className="text-slate-500 mb-8">{type === 'doctor' ? 'Access your patient dashboard' : 'Manage your health queue'}</p>
        {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm font-medium border border-red-100"><AlertCircle size={18} /> {loginError}</div>}
        <form onSubmit={type === 'doctor' ? handleDoctorLogin : handlePatientLogin} className="space-y-5">
          {type === 'patient' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Patient ID</label>
              <input name="pid" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. P1001" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email</label>
            <input name="email" type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="name@domain.com" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</label>
            <input name="pass" type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>
        {type === 'patient' && (
          <p className="text-center text-slate-500 mt-8 text-sm">
            New here? <button onClick={() => setView('patient-register')} className="text-indigo-600 font-bold hover:underline">Register Account</button>
          </p>
        )}
      </div>
    </div>
  );

  const PatientDashboard = () => {
    const myEntry = queue.find(q => {
      const pid = q.patientId?._id || q.patientId;
      return pid === currentUser._id;
    });
    const myDoc = myEntry ? doctors.find(d => d._id === (myEntry.doctorId?._id || myEntry.doctorId)) : null;
    const docQueue = myEntry ? queue.filter(q => (q.doctorId?._id || q.doctorId) === (myEntry.doctorId?._id || myEntry.doctorId)) : [];
    const serving = docQueue.find(q => q.status === 'serving');
    const position = myEntry ? myEntry.tokenNumber - (serving ? serving.tokenNumber : 0) : 0;
    const waitTime = Math.max(0, position * 10);

    return (
      <Layout title={`Hello, ${currentUser.name.split(' ')[0]}`} subtitle={`Patient ID: ${currentUser.patientId}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <div onClick={() => setView('patient-care-plan')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group">
              <div className="flex items-center gap-6">
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Access Care Plan</h3>
                  <p className="text-slate-500">View visit history, follow-ups, and medication trackers</p>
                </div>
              </div>
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">View Plan <ChevronLeft className="rotate-180" size={18} /></button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!myEntry ? (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Join a Queue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {doctors.map(doc => {
                    const qCount = queue.filter(q => (q.doctorId?._id || q.doctorId) === doc._id).length;
                    return (
                      <div
                        key={doc._id}
                        onClick={() => setSelectedDoctorId(doc._id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedDoctorId === doc._id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}
                      >
                        <img src={doc.profilePic} className="w-12 h-12 rounded-full object-cover" alt="" />
                        <div>
                          <p className="font-bold text-slate-800">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.specialization} • {qCount} in queue</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  disabled={!selectedDoctorId}
                  onClick={handleJoinQueue}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Confirm & Join Queue
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {!myEntry.complaint && (
                  <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><AlertCircle /></div>
                      <div>
                        <h4 className="font-bold text-orange-900">Pre-Visit Info Needed</h4>
                        <p className="text-orange-700 text-sm">Help the doctor prepare by providing your current symptoms.</p>
                      </div>
                    </div>
                    <form onSubmit={(e) => submitSymptoms(e, myEntry._id)} className="space-y-3">
                      <input name="complaint" placeholder="Main complaint (e.g. Fever)" className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none" required />
                      <textarea name="symptoms" placeholder="Describe symptoms briefly..." className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none" rows="2" required />
                      <button className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold">Submit Triage Info</button>
                    </form>
                  </div>
                )}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800">Your Appointment</h3>
                    <Badge variant={myEntry.status}>{myEntry.status}</Badge>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 text-center bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 text-slate-200"><Activity size={64} /></div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Token Number</p>
                      <p className="text-8xl font-black text-indigo-600">{myEntry.tokenNumber}</p>
                    </div>
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Clock size={24} /></div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Est. Waiting Time</p>
                          <p className="text-xl font-bold text-slate-800">~{waitTime} Minutes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-2xl text-green-600"><Users size={24} /></div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Position in Queue</p>
                          <p className="text-xl font-bold text-slate-800">{position > 0 ? `${position} people ahead` : 'You are next!'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Stethoscope size={24} /></div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Doctor Assigned</p>
                          <p className="text-xl font-bold text-slate-800">{myDoc?.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-indigo-600" /> Profile Summary
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <div className="relative">
  <img 
    src={currentUser.profilePic} 
    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm" 
    alt="" 
  />
  <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-xs font-bold hover:bg-indigo-700">
    +
    <input 
      type="file" 
      accept="image/*" 
      className="hidden" 
      onChange={async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('profilePic', file);
        try {
          const { data } = await uploadProfilePic(formData);
          await updatePatient(currentUser._id, { profilePic: data.imageUrl });
          setCurrentUser(prev => ({ ...prev, profilePic: data.imageUrl }));
        } catch (err) {
          console.log('Upload error:', err);
        }
      }} 
    />
  </label>
</div>
                  <p className="font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                  <p className="text-sm text-slate-500">{currentUser.email}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">DOB:</span> <span className="font-semibold">{currentUser.dob}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Phone:</span> <span className="font-semibold">{currentUser.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Address:</span> <span className="font-semibold">{currentUser.address}</span></div>
              </div>
            </div>
            {myEntry && myDoc && (
              <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 text-white">
                <h4 className="font-bold mb-4 opacity-90">Now Serving</h4>
                <div className="text-5xl font-black mb-2">{serving ? serving.tokenNumber : '--'}</div>
                <p className="text-sm opacity-80">Doctor: {myDoc.name}</p>
                <p className="text-sm opacity-80 mt-1">Specialty: {myDoc.specialization}</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  };

  const PatientCarePlan = () => {
    const [localVisits, setLocalVisits] = useState([]);
    const [localPrescs, setLocalPrescs] = useState([]);

    useEffect(() => {
      getVisits(currentUser._id).then(({ data }) => setLocalVisits(data));
    }, []);

    return (
      <Layout title="Your Care Plan" subtitle="History and medication tracker">
        <button onClick={() => setView('patient-dash')} className="mb-6 flex items-center gap-1 text-indigo-600 font-bold hover:gap-2 transition-all">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        <div className="space-y-8">
          {localVisits.length > 0 ? localVisits.map(visit => {
            const doc = doctors.find(d => d._id === (visit.doctorId?._id || visit.doctorId));
            return (
              <VisitCard
                key={visit._id}
                visit={visit}
                doc={doc}
                isPatient={true}
                onToggleMed={toggleMedication}
              />
            );
          }) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <FileText size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">No care plans found</h3>
              <p className="text-slate-400">History will appear after your first consultation.</p>
            </div>
          )}
        </div>
      </Layout>
    );
  };

  const VisitCard = ({ visit, doc, isPatient, onToggleMed }) => {
    const [prescs, setPrescs] = useState([]);

    useEffect(() => {
      getPrescriptions(visit._id).then(({ data }) => setPrescs(data));
    }, [visit._id]);

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 bg-slate-50 border-b flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {doc && <img src={doc.profilePic} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" alt="" />}
            <div>
              <h3 className="text-xl font-bold text-slate-800">{doc?.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{doc?.specialization} • {visit.visitDate}</p>
            </div>
          </div>
          {visit.followUpDate && (
            <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <Calendar size={18} /> Follow-up: {visit.followUpDate}
            </div>
          )}
        </div>
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Notes</h4>
            <p className="text-slate-700 bg-white p-4 rounded-2xl border border-slate-100 leading-relaxed italic">{visit.notes}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Prescribed Medication</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescs.map(p => {
                const rate = getAdherenceRate(p);
                const isTaken = p.dosesTaken.includes(getTodayStr());
                return (
                  <div key={p._id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{p.medicineName}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase">{p.dosage} • {p.duration}</p>
                      </div>
                      {rate !== null && (
                        <span className={`text-xs font-black px-2 py-1 rounded-md ${rate > 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {rate}% Adherence
                        </span>
                      )}
                    </div>
                    {isPatient && (
  <button
    onClick={async () => {
      const today = getTodayStr();
      const taken = p.dosesTaken.includes(today);
      const newDoses = taken
        ? p.dosesTaken.filter(d => d !== today)
        : [...p.dosesTaken, today];
      try {
        await updatePrescription(p._id, { dosesTaken: newDoses });
        setPrescs(prev => prev.map(pr =>
          pr._id === p._id ? { ...pr, dosesTaken: newDoses } : pr
        ));
      } catch (err) {
        console.log('Error:', err);
      }
    }}
    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${p.dosesTaken.includes(getTodayStr()) ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
  >
    {p.dosesTaken.includes(getTodayStr()) ? <><CheckCircle2 size={18} /> Taken Today</> : 'Mark as Taken'}
  </button>
)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DoctorDashboard = () => {
    const docQueue = queue.sort((a, b) => a.tokenNumber - b.tokenNumber);
    const serving = docQueue.find(q => q.status === 'serving');
    const servingPatient = serving ? (serving.patientId?.name ? serving.patientId : null) : null;
    const waiting = docQueue.filter(q => q.status === 'waiting');
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState('queue');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async (term) => {
  setSearchTerm(term);
  if (term.length < 2) {
    setSearchResults([]);
    return;
  }
  try {
    const { data } = await searchPatients(term);
    setSearchResults(data);
  } catch (err) {
    console.log('Search error:', err);
  }
};

    return (
      <Layout title={`Welcome, ${currentUser.name}`} subtitle={currentUser.specialization}>
        <div className="flex gap-4 mb-8">
          <button onClick={() => setTab('queue')} className={`px-6 py-3 rounded-xl font-bold transition-all ${tab === 'queue' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}>Live Queue</button>
          <button onClick={() => setTab('records')} className={`px-6 py-3 rounded-xl font-bold transition-all ${tab === 'records' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}>Patient Records</button>
        </div>

        {tab === 'queue' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center sticky top-24">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Currently Serving</h3>
                {serving ? (
                  <>
                    {servingPatient && <img src={servingPatient.profilePic} className="w-24 h-24 rounded-3xl mx-auto object-cover mb-4 border-4 border-slate-50 shadow-sm" alt="" />}
                    <p className="text-3xl font-black text-slate-800">{servingPatient?.name || 'Patient'}</p>
                    <p className="text-indigo-600 font-bold mb-4">Token #{serving.tokenNumber}</p>
                    {serving.complaint && (
                      <div className="bg-indigo-50 p-4 rounded-2xl text-left mb-6 border border-indigo-100">
                        <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Chief Complaint</p>
                        <p className="text-slate-800 font-medium">{serving.complaint}</p>
                        <p className="text-xs font-bold text-indigo-400 uppercase mt-3 mb-1">Symptoms</p>
                        <p className="text-sm text-slate-600 italic">{serving.symptoms}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={endSession} className="bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors">End Session</button>
                      <button onClick={() => { setEditingPatientId(serving.patientId?._id || serving.patientId); setView('doctor-patient-view'); }} className="bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">View Profile</button>
                    </div>
                  </>
                ) : (
                  <div className="py-12">
                    <p className="text-slate-400 font-medium mb-4">No active session</p>
                    <button onClick={callNext} disabled={waiting.length === 0} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-100 disabled:opacity-50">Call Next Patient</button>
                  </div>
                )}
                {serving && (
                  <button onClick={callNext} disabled={waiting.length === 0} className="w-full mt-3 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-100 disabled:opacity-50">Next in Line</button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Upcoming in Queue ({waiting.length})</h3>
                <div className="space-y-4">
                  {waiting.length > 0 ? waiting.map((q, idx) => {
                    const p = q.patientId;
                    return (
                      <div key={q._id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${idx === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{q.tokenNumber}</div>
                          <div>
                            <p className="font-bold text-slate-800">{p?.name || 'Patient'}</p>
                            <p className="text-xs text-slate-500">Patient ID: {p?.patientId || ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {q.complaint && <span className="bg-white border border-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">{q.complaint}</span>}
                          {idx === 0 && <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Next</span>}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">Queue is currently empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Find Patient Records</h3>
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by Name or Patient ID..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {searchResults.length > 0 ? searchResults.map(p => (
    <div
      key={p._id}
      onClick={() => { setEditingPatientId(p._id); setView('doctor-patient-view'); }}
      className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-white transition-all cursor-pointer group flex items-center gap-4"
    >
      <img src={p.profilePic} className="w-14 h-14 rounded-2xl object-cover" alt="" />
      <div className="flex-1">
        <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.name}</p>
        <p className="text-xs text-slate-500 uppercase font-medium">{p.patientId}</p>
      </div>
      <ChevronLeft className="rotate-180 text-slate-300 group-hover:text-indigo-600" />
    </div>
  )) : searchTerm.length > 1 ? (
    <div className="col-span-2 text-center py-10">
      <p className="text-slate-400 font-medium">No patients found</p>
    </div>
  ) : (
    <div className="col-span-2 text-center py-10">
      <p className="text-slate-400 font-medium">Type at least 2 characters to search</p>
    </div>
  )}
</div>
          </div>
        )}
      </Layout>
    );
  };

  const DoctorPatientView = () => {
    const [patient, setPatient] = useState(null);
    const [pVisits, setPVisits] = useState([]);
    const [newVisitNotes, setNewVisitNotes] = useState('');
    const [isCreatingVisit, setIsCreatingVisit] = useState(false);

    useEffect(() => {
      if (editingPatientId) {
        getVisits(editingPatientId).then(({ data }) => setPVisits(data));
      }
    }, [editingPatientId]);

    const createVisit = async () => {
      try {
        const { data } = await createVisitAPI({
          patientId: editingPatientId,
          doctorId: currentUser._id,
          visitDate: getTodayStr(),
          notes: newVisitNotes || 'No notes provided.'
        });
        setPVisits(prev => [data, ...prev]);
        setNewVisitNotes('');
        setIsCreatingVisit(false);
      } catch (err) {
        console.log('Error creating visit:', err);
      }
    };

    return (
      <Layout title="Patient Medical Record">
        <button onClick={() => setView('doctor-dash')} className="mb-6 flex items-center gap-1 text-indigo-600 font-bold hover:gap-2 transition-all">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg shadow-indigo-100 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold">Manage Patient Session</h4>
              <p className="opacity-80">Start a new clinical record or update history.</p>
            </div>
            <button onClick={() => setIsCreatingVisit(true)} className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              + New Visit Record
            </button>
          </div>

          {isCreatingVisit && (
            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-indigo-500">
              <h4 className="text-xl font-bold text-slate-800 mb-4">Start New Visit</h4>
              <textarea
                value={newVisitNotes}
                onChange={(e) => setNewVisitNotes(e.target.value)}
                placeholder="Record visit findings, diagnosis, and observations here..."
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all mb-6 bg-slate-50 min-h-[150px]"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsCreatingVisit(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-100">Cancel</button>
                <button onClick={createVisit} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold">Finalize Visit Notes</button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Visit History</h4>
            {pVisits.map(visit => {
              const doc = doctors.find(d => d._id === (visit.doctorId?._id || visit.doctorId));
              return (
                <DoctorVisitCard
                  key={visit._id}
                  visit={visit}
                  doc={doc}
                  currentUser={currentUser}
                />
              );
            })}
          </div>
        </div>
      </Layout>
    );
  };

  const DoctorVisitCard = ({ visit, doc, currentUser }) => {
    const [prescs, setPrescs] = useState([]);

    useEffect(() => {
      getPrescriptions(visit._id).then(({ data }) => setPrescs(data));
    }, [visit._id]);

    const handleAddPrescription = async (e) => {
      e.preventDefault();
      const form = e.target.elements;
      try {
        const { data } = await addPrescriptionAPI(visit._id, {
          medicineName: form.med.value,
          dosage: form.dosage.value,
          duration: form.duration.value,
          startDate: getTodayStr(),
          dosesTaken: []
        });
        setPrescs(prev => [...prev, data]);
        e.target.reset();
      } catch (err) {
        console.log('Error adding prescription:', err);
      }
    };

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-slate-400" />
            <span className="font-bold text-slate-700">{visit.visitDate}</span>
            <span className="text-slate-400 mx-2">|</span>
            <span className="text-sm text-slate-500 font-medium">Attended by: {doc?.name}</span>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-8">
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">"{visit.notes}"</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-bold text-slate-800">Prescriptions</h5>
              <Badge variant="default">{prescs.length} Items</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {prescs.map(pr => (
  <div key={pr._id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
    <div className="flex justify-between items-center mb-3">
      <div>
        <p className="font-bold text-slate-800">{pr.medicineName}</p>
        <p className="text-xs text-slate-500 uppercase">{pr.dosage} • {pr.duration}</p>
      </div>
      {getAdherenceRate(pr) !== null && (
        <div className={`text-xs font-black p-2 rounded-lg ${getAdherenceRate(pr) > 80 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
          {getAdherenceRate(pr)}%
        </div>
      )}
    </div>

    {/* Dates taken section */}
    <div className="mt-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        Doses Taken ({pr.dosesTaken.length} days)
      </p>
      {pr.dosesTaken.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pr.dosesTaken.sort().map(date => (
            <span 
              key={date} 
              className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            >
              <CheckCircle2 size={12} /> {date}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No doses taken yet</p>
      )}
    </div>
  </div>
))}
            </div>
            <form onSubmit={handleAddPrescription} className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input name="med" placeholder="Medicine Name" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
              <input name="dosage" placeholder="Dosage (1 tab daily)" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
              <input name="duration" placeholder="Duration (15 days)" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
              <button className="md:col-span-3 bg-slate-800 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors">+ Add Medicine to Visit</button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const RegisterView = () => (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-2xl">
        <button onClick={() => setView('portal')} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors mb-6 font-medium">
          <ChevronLeft size={20} /> Back
        </button>
        <h2 className="text-3xl font-bold text-slate-800 mb-1">Create Account</h2>
        <p className="text-slate-500 mb-8">Join the HealthPlus network today.</p>
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Name</label>
            <input name="name" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Johnathan Doe" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Patient ID (Unique)</label>
            <input name="pid" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. P1005" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email</label>
            <input name="email" type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="john@domain.com" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Phone Number</label>
            <input name="phone" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="123-456-7890" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Date of Birth</label>
            <input name="dob" type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Address</label>
            <textarea name="address" rows="2" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="123 Health Ave, Wellness City" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</label>
            <input name="pass" type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Confirm Password</label>
            <input name="confirm" type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="md:col-span-2 mt-4 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>
        <p className="text-center text-slate-500 mt-8 text-sm">
          Already have an account? <button onClick={() => setView('patient-login')} className="text-indigo-600 font-bold hover:underline">Log In</button>
        </p>
      </div>
    </div>
  );

  switch (view) {
    case 'portal': return <PortalView />;
    case 'patient-login': return <LoginView type="patient" />;
    case 'doctor-login': return <LoginView type="doctor" />;
    case 'patient-register': return <RegisterView />;
    case 'patient-dash': return <PatientDashboard />;
    case 'patient-care-plan': return <PatientCarePlan />;
    case 'doctor-dash': return <DoctorDashboard />;
    case 'doctor-patient-view': return <DoctorPatientView />;
    default: return <PortalView />;
  }
}