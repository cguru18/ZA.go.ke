const mongoose = require('mongoose');
const User = require('./models/User');

const uri = "mongodb+srv://ZA_go_ke:38fXe2UpPXXH08oe@cluster0.7acdqau.mongodb.net/zago?appName=Cluster0";

console.log('Attempting to connect...');
mongoose.connect(uri)
  .then(async () => {
    console.log('Connected! Testing User.findOne...');
    try {
        const userExists = await User.findOne({ email: "success@zago.ke" });
        console.log('userExists:', userExists);
        console.log('Testing User.create...');
        const user = await User.create({ fullName: "Test", email: "success@zago.ke", password: "password" });
        console.log('User created!', user);
    } catch (err) {
        console.error('Error during query:', err);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
