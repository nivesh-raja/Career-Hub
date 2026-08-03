import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/?appName=CareerHub').then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
});
