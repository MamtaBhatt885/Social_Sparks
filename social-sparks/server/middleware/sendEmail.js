import nodeMailer from "nodemailer";
import {catchAsyncError} from "./catchAsyncError.js";


export const sendEmail = catchAsyncError(async(options)=>{

// var transporter = nodeMailer.createTransport({
//     host: process.env.SMPT_HOST,
//     port: process.env.SMPT_PORT,
//     auth: {
//         user: process.env.SMPT_MAIL,
//         pass: process.env.SMPT_PASSWORD
//     },
//     service: process.env.SMPT_SERVICE
// });
var transporter = nodeMailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "f0a32472646dd1",
        pass: "36bb5718b0bfad"
    }
});
    
    const mailOptions={
    from: process.env.SMPT_MAIL,
    to:options.email,
    subject:options.subject,
    text:options.message,
};
await transporter.sendMail(mailOptions);

})
