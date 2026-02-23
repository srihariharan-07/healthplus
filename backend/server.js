const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.log('❌ Connection error:', err));

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/queue',   require('./routes/queue'));
app.use('/api/visits',  require('./routes/visits'));
app.use('/api/upload',  require('./routes/upload'));
app.use('/api/patients', require('./routes/patients'));
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));