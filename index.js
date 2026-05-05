const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(bodyParser.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send('Luxe Aura Backend is Running!');
});

// MongoDB Connection
// Use Environment Variable for Production, Localhost for testing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxe_aura_contacts'; 

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Successfully'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Define Models
const userSchema = new mongoose.Schema({
  phoneNumber: String,
  address: String,
  detailedAddress: {
    houseNumber: String,
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  loginDate: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const contactSchema = new mongoose.Schema({
  userName: String,
  syncDate: Date,
  contacts: [
    {
      name: [String],
      tel: [String],
      email: [String]
    }
  ]
});

const ContactSync = mongoose.model('ContactSync', contactSchema);

// API Endpoint to Login
app.post('/api/login', async (req, res) => {
  console.log('--- LOGIN REQUEST RECEIVED ---');
  console.log('Request Body:', JSON.stringify(req.body));
  
  try {
    const { phoneNumber, address, detailedAddress } = req.body;
    if (!phoneNumber || !address) {
      console.log('Validation Failed: Missing phone or address');
      return res.status(400).json({ error: 'Phone and Address are required' });
    }

    const newUser = new User({ 
      phoneNumber, 
      address,
      detailedAddress
    });
    console.log('Saving user to MongoDB...');
    await newUser.save();
    console.log('User saved successfully!');
    
    res.status(200).json({ message: 'Login successful', phoneNumber });
  } catch (error) {
    console.error('DATABASE ERROR:', error.message);
    console.error('FULL ERROR:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// API Endpoint to Sync Contacts
app.post('/api/contacts/sync', async (req, res) => {
  try {
    const { user, contacts, syncDate } = req.body;
    
    console.log(`Received ${contacts.length} contacts from ${user}`);

    const newSync = new ContactSync({
      userName: user, // Matches 'user' from frontend
      syncDate: new Date(syncDate || Date.now()),
      contacts: contacts
    });

    await newSync.save();
    
    res.status(200).json({ message: 'Contacts saved successfully to MongoDB' });
  } catch (error) {
    console.error('Error saving contacts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
