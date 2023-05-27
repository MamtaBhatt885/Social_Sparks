import mongoose from 'mongoose';

export const connectDatabase = () =>{
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.MONGO_URI).then((con) => console.log(`Database Connected on :${con.connection.host}`)).catch((err) => console.log(err));
}