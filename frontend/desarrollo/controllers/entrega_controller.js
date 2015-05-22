var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
exports.entrega = function(req,res,next){
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'yassyass22yass@gmail.com',
        pass: 'hemmi2000'
    }
});

// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'Yasser Kantour ✔ <yassyass22yass@gmail.com>', // sender address
    to: 'yassero_emi@hotmail.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ✔', // plaintext body
    html: '<b>Hello world ✔</b>', // html body
    attachments:[
    {   // utf-8 string as an attachment
            filename: 'text1.txt',
            content: 'hello world!'
        }
    ]
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
    }else{
        console.log('Message sent: ' + info.response);
    }
});
next();
};