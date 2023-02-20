"use strict";
const express = require("express");
const app = require("express")();
const http = require("http").createServer(app);
const conn = require("./config/db");
const { PaymentGateway } = require('@cashfreepayments/cashfree-sdk');

const multer = require("multer");
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});
const upload = multer({ storage: fileStorageEngine });
const service = require("./services/DragonGameService");

const io = require("socket.io")(http);
const debug = require("debug")("test");
const events = require("./Constants").events;
const commonVar = require("./Constants").commonVar;
const MatchMaking = require("./utils/MatchMaking").MatchPlayer;
const playerManager = require("./utils/PlayerDataManager");
const makePlayer = require("./utils/connectPlayer");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
app.use(cors());
const path = require("path");

require("./gameplay/sendsocket").sendSocket(io.sockets);
const AuthRoute = require("./routes/AuthRoutes");
const UserRoutes = require("./routes/UserRoutes");

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use("/apkurl", express.static("APK"));

app.use("/auth", AuthRoute);
app.use("/user", UserRoutes);

let onlineUserQ = [];
const maxPlayerInARoom = 7;
debug("$server started$");

//----------------------
io.on("connection", (socket) => {
  debug("a user connected " + socket.id);

  /*  OnSendPoints(socket);
  OnNotification(socket);
  OnAcceptPoints(socket);
  OnRejectPoints(socket);
  OnSenderNotification(socket);
  OnUserProfile(socket);*/
  OnUploadImage(socket);
  OnNotification(socket);
  OnBalance(socket);
  onEnterLobby(socket);
  RegisterPlayer(socket);
  DissConnect(socket);
});

function onEnterLobby(socket) {
  socket.on(events.onEnterLobby, (data) => {
    debug("Player Enter to lobby");
    makePlayer.registeToLobby({
      socketId: socket.id,
      playerId: data[commonVar.playerId],
    });
  });
}

function DissConnect(socket) {
  socket.on("disconnect", () => {
    debug(socket.id + " disconnected");
    makePlayer.exitToLobby(socket.id);
    playerManager.RemovePlayer(socket.id);
  });
}

function RegisterPlayer(socket) {
  socket.on(events.RegisterPlayer, (data) => {
    debug("RegisterPlayer");
    debug(data[commonVar.playerId]);
    let playerObj = {
      socket: socket,
      profilePic: data[commonVar.profilePic],
      playerId: data[commonVar.playerId],
      gameId: data[commonVar.gameId],
      balance: data[commonVar.balance],
    };
    MatchMaking(playerObj);
  });
}

/* function OnSendPoints(socket){
  // let socket = data[commonVar.socket];
 socket.on(events.OnSendPoints, async(data) =>{
   let result=await service.onSendPointsToPlayer(data.senderId,data.receiverId,data.points,data.password)
   // await getUserPoint(data);
   if(result==true){
   socket.emit(events.OnSendPoints,{"status":200,"message":"PointTransfer Successfully","data":{}});
 }
 
 else if(result==404){
 socket.emit(events.OnSendPoints,{"status":404,"message":"Receiver Not Exist","data":{}});
 }
 else{
 socket.emit(events.OnSendPoints,{"status":404,"message":"Incorrect Password","data":{}});
 
 }
 })}
 
 
 function OnUserProfile(socket){
  // let socket = data[commonVar.socket];
 socket.on(events.OnUserProfile, async(data) =>{
   let result =  await service.userByEmail(data.playerId);//authLogin
   socket.emit(events.OnUserProfile,{
     id:result[0].id,
                       distributor_id:"masterid",
                       user_id:result[0].email,
                            
                       username:result[0].first_name,
                       IMEI_no:"0",
                       device:"abcd",
                       last_logged_in:result[0].last_login,
                       last_logged_out:result[0].last_login,
                       IsBlocked:result[0].status,
                       password:result[0].password,
                       created_at:result[0].created,
                       updated_at:result[0].modified,
                       active:result[0].status,
                       coins:result[0].point
 
   });
 })
 }
 
 
 function OnNotification(socket){
   //let socket = data[commonVar.socket];
 socket.on(events.OnNotification, async(data) =>{
   let result =  await service.onNotification(data.playerId);//authLogin
   socket.emit(events.OnNotification,{
     
   
       "status":200,
       "message":"User Notification",
       "data":{
          "notification":result,
           
 
          "notification_count":result.length
       
      }
 
   });
 })
 }
 
 
 function OnAcceptPoints(socket){
  // let socket = data[commonVar.socket];
 socket.on(events.OnAcceptPoints, async(data) =>{
   let result =  await service.onAcceptPoints(data.notifyId,data.playerId);//authLogin
   socket.emit(events.OnAcceptPoints,{
     
   
       "status":200,
       "message":"Point Accept Successfully",
       "data":{
          
       
      }
 
   });
 })
 }
 
 
 
 
 function OnRejectPoints(socket){
  // let socket = data[commonVar.socket];
 socket.on(events.OnRejectPoints, async(data) =>{
   let result =  await service.onRejectPoints(data.notifyId,data.playerId);//authLogin
   socket.emit(events.OnRejectPoints,{
     
   
       "status":200,
       "message":"Point is not Accept ",
       "data":{
          
       
      }
 
   });
 })
 }
 
 
 
 
 
 function OnSenderNotification(socket){
  // let socket = data[commonVar.socket];
 socket.on(events.OnSenderNotification, async(data) =>{
   let result =  await service.onSenderNotification(data.playerId);//authLogin
   socket.emit(events.OnSenderNotification,{
     
   
       "status":200,
       "message":"User Notification",
       "data":{
          "notification":result,
           
 
          "notification_count":result.length
       
      }
 
   });
 })
 }
 
 
 */

app.get("/servertesting", (req, res) => {
  res.sendFile(path.join(__dirname + "/test.html"));
});

app.get("/test", (req, res) => {
  res.send("test");
});

app.post("/uploadImage", upload.single("image"), async (req, res) => {
  console.log(req.file);
  console.log(req.body.username);
  try {
    let sql = "INSERT INTO  user_upload_image SET ?";
    let formData1 = {
      imagename: req.file.filename,
      username: req.body.username,
    };

    const userss = await conn.query(sql, formData1);
    let statusCode = 200;
    let message = "";
    if (userss) {
      statusCode = 200;
      message = "images updated";
    } else {
      statusCode = 500;
      message = "Something went wrong! database error";
    }
    //res.send("imageload sucessfully");
    const responseDatajson = {
      status: statusCode,
      message,
    };
    res.send(responseDatajson);
  } catch (error) {
    res.status(500).send("Database error");
  }
});

function OnUploadImage(socket) {
  // let socket = data[commonVar.socket];
  socket.on(events.OnUploadImage, async (data) => {
    // let result = await service.onUploadImage(data.imagename, data.username); //authLogin
    console.log("uploadsocket", data);
    socket.emit(events.OnUploadImage, {
      status: 200,
      message: "demo testing",
      data: {},
    });
  });
}

function OnNotification(socket) {
  //let socket = data[commonVar.socket];
  socket.on(events.OnNotification, async (data) => {
    let result = await service.onNotification(data.playerId); //authLogin
    socket.emit(events.OnNotification, {
      status: 200,
      message: "User Notification",
      data: {
        Notification: result[0].nmessage,
      },
    });
  });
}

function OnBalance(socket) {
  //let socket = data[commonVar.socket];
  socket.on(events.OnBalance, async (data) => {
    let result = await service.onbalance(data.playerId); //authLogin
    socket.emit(events.OnBalance, {
      status: 200,
      message: "User OnBalance",
      data: {
        Balance: result[0].point,
      },
    });
  });
}





















PaymentGateway.verifyCredentials({

  env: 'TEST',
 appId: '220017c11098d10fdcec263ece710022',                              //220017c11098d10fdcec263ece710022

  secretKey: 'TEST4de4671881f0a6c2d20ded8cbbe7267fd41b028b',                //TEST4de4671881f0a6c2d20ded8cbbe7267fd41b028b

})

  .then((data) => console.log(data))

  .catch((error) => console.error(error));

  app.post('/placeOrder',async(req,res)=>{
    var linkSend=true;
    let statusCode = 200;
    let message = "Successfully Send Link";
    const responseDatajson = {
      status: statusCode,
      message,
      linkSend,
    };
    
var mainOrderId=0;

    try {
      let sql = "INSERT INTO  placeorder SET ?";
      let formData1 = {
        order_amount: req.body.order_amount,

        customer_email: "demo@demo.com",
        customer_name: req.body.customer_name,
        customer_phone:req.body.customer_phone,

      };
  
      const userss = await conn.query(sql, formData1);
      let statusCode = 200;
      let message = "";
      if (userss) {
        statusCode = 200;
        message = "order updated";
        linkSend=true;
      } else {
        statusCode = 500;
        message = "already updated";
      }
      sql="select * from  placeorder  order by createdat desc"
      const user1 = await conn.query(sql);
console.log("user1 data",user1)
mainOrderId=user1[0].orderid
      //res.send(responseDatajson);
    } 
     catch (error) {
      console.log("error------",error)
      res.status(500).send("Database error");
    }
  
  


const pg = new PaymentGateway({

      env: 'TEST',
    
      apiVersion: '1.0.0',
    
      appId: '220017c11098d10fdcec263ece710022',                              //220017c11098d10fdcec263ece710022
    
      secretKey: 'TEST4de4671881f0a6c2d20ded8cbbe7267fd41b028b',                //TEST4de4671881f0a6c2d20ded8cbbe7267fd41b028b
    
    });
    pg.orders
    
      .createOrders({
    
       // orderId: req.body.orderId, // required

orderId:mainOrderId*1000,
    
        orderAmount: req.body.order_amount, // required
    
        orderCurrency: 'INR',
    
        orderNote: 'Subscription',
    
        customerName: req.body.customer_name, // required
    
        customerPhone: req.body.customer_phone, // required
    
        customerEmail: "demo@demo.com", // required
    
        sellerPhone: '',
    
        returnUrl: 'https://example.com/return', // required
    
        notifyUrl: 'https://example.com/notify',
    
        paymentModes: '',
    
        pc: '',
    
      })
    
    .then((data) =>{ console.log(data)
    res.send({data:data,response:responseDatajson})
     } )
    
      .catch((error) => console.error(error));
    
  })









app.get('/downloadAPK',(req,res)=>{
  res.send(`<a href='/apkDownloadURL'>click here to download</a>`)
})

app.get('/apkDownloadURL',(req,res)=>{
res.download(`${__dirname}/APK/BlackLionJackpot.apk`)
})
http.listen(PORT, () => {
  debug("listening on " + PORT);
});
