// Seed route - visit this URL once to seed the database
app.get('/seed', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const Doctor = require('./models/Doctor');
    const Patient = require('./models/Patient');
    const Visit = require('./models/Visit');
    const Prescription = require('./models/Prescription');

    await Doctor.deleteMany();
    await Patient.deleteMany();
    await Visit.deleteMany();
    await Prescription.deleteMany();

    const hashed = await bcrypt.hash('123', 10);

    const doctors = await Doctor.insertMany([
      { name: 'Dr. Vijay',  email: 'vijay@health.plus',  password: hashed, specialization: 'Cardiology',  availability: '9:00 AM - 1:00 PM',  profilePic: 'https://i.pinimg.com/736x/65/80/dd/6580dd70f54da20126ee421dbf73ad2f.jpg' },
      { name: 'Dr. Ajith',  email: 'ajith@health.plus',  password: hashed, specialization: 'Pediatrics',  availability: '10:00 AM - 3:00 PM', profilePic: 'https://alchetron.com/cdn/ajith-kumar-d8c190e8-de5b-4fd7-b26e-cfa268b5680-resize-750.jpeg' },
      { name: 'Dr. Vikram', email: 'vikram@health.plus', password: hashed, specialization: 'Dermatology', availability: '1:00 PM - 5:00 PM',  profilePic: 'https://cinetown.s3.ap-south-1.amazonaws.com/people/profile_img/1697344211.jpeg' },
    ]);

    const patients = await Patient.insertMany([
      { patientId: 'P1001', name: 'John Doe',   email: 'john@example.com',  password: hashed, phone: '123-456-7890', dob: '1985-05-15', address: 'Porur',     profilePic: 'https://cdn-icons-png.flaticon.com/512/147/147144.png' },
      { patientId: 'P1002', name: 'Smith Jain', email: 'smith@example.com', password: hashed, phone: '098-765-4321', dob: '1992-08-22', address: 'Mogappair', profilePic: 'https://cdn-icons-png.flaticon.com/512/147/147144.png' },
    ]);

    const visits = await Visit.insertMany([
      { patientId: patients[0]._id, doctorId: doctors[1]._id, visitDate: '2025-09-28', followUpDate: '2025-10-12', notes: 'Routine check-up was all clear.' },
      { patientId: patients[1]._id, doctorId: doctors[0]._id, visitDate: '2025-09-20', followUpDate: '2025-10-05', notes: 'Patient reported mild chest discomfort. EKG results are normal.' },
    ]);

    await Prescription.insertMany([
      { visitId: visits[0]._id, medicineName: 'Vitamin D3',     dosage: '1 tablet daily', duration: '90 days', startDate: '2025-09-28', dosesTaken: [] },
      { visitId: visits[1]._id, medicineName: 'Cardio-Protect', dosage: '1 tablet daily', duration: '15 days', startDate: '2025-09-20', dosesTaken: [] },
    ]);

    res.json({ message: '✅ Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});