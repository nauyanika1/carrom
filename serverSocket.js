const debug = require("debug")("test");
//const {userLogin,forceLogin,changePassword,user_profile} = require("./services/UserLogin");
const {userNotification,senderNotification,AddUserPoint,accept_points,reject_points} = require("./services/MyAccount");
const events = require("./Constants").events;
const commonVar = require("./Constants").commonVar;
const MatchMaking = require("./utils/MatchMaking").MatchPlayer;
const playerManager  = require('./utils/PlayerDataManager');



function createSocket(io){

	// io.use(function(socket, next){
	// 	if (socket.request.headers.cookie) return next();
	//     next(new Error('Authentication error'));
	// });

	io.on("connection", (socket) => {
	   // debug("a user connected " + socket.id);
	    //DissConnect(socket);
	    //UserLogin(socket);
	    //RegisterToGameRoom(socket);
	    //ForceLogin(socket);
	   // MyAccount
	    //ChangePassword(socket);
	    notification(socket);
	   transferableNotification(socket);
	   // sendPoints(socket);
	    acceptPoints(socket);
	    rejectPoints(socket);
	  //  UserProfile(socket);
	   // UserLogout(socket);
	})


	function DissConnect(socket) {
	    socket.on("disconnect", () => {
	        debug("player got dissconnected " + socket.id);
            playerManager.RemovePlayer(socket.id);
	    })
	}


	/*function forceRemovePlayer(playerId){
        let player = playerManager.GetPlayerById(playerId);
        if(player && player.length>0){
	        let socket    =  player[0].socket;
	        socket.emit(events.OnForceExit);
	        playerManager.RemovePlayer(socket.id);
	        //socket.disconnect();
	    }    
        return true;
	}
*/
	/*function addPlayerToRoom(data,socket){
	    let obj = {
	    	socket  : socket,
	        socketId: socket.id,
	        playerId: data.user_id,
	        balance : data.coins,
	    }
	    playerManager.AddPlayer(obj);
	    return;
	}


	function RegisterToGameRoom(socket) {
	    socket.on(events.RegisterPlayer,(data) => {
		    let playerObj = {
		      socket: socket,
		      playerId: data[commonVar.playerId],
		      gameId: data[commonVar.gameId],
		    };
		    MatchMaking(playerObj)
	    })
    }

    //------------------Start My Accouunt Screen------------------------------------------------------
    function ChangePassword(socket){
		socket.on(events.OnChangePassword, async(data) =>{
			let result =  await changePassword(data);
            socket.emit(events.OnChangePassword,result);
	    })
	}*/
	function notification(socket){
		socket.on(events.OnNotification, async(data) =>{
			let result =  await userNotification(data);
            socket.emit(events.OnNotification,result);
	    })
	}

	function transferableNotification(socket){
		socket.on(events.OnsenderNotification, async(data) =>{
			let result =  await senderNotification(data);
            socket.emit(events.OnsenderNotification,result);
	    })
	}

	
	/*function sendPoints(socket){
		socket.on(events.OnSendPoints, async(data) =>{
			let result =  await AddUserPoint(data);
            socket.emit(events.OnSendPoints,result);
	    })
	}*/



	function acceptPoints(socket){
		socket.on(events.OnAcceptPoints, async(data) =>{
			let result =  await accept_points(data);
            socket.emit(events.OnAcceptPoints,result);
	    })
	}

	function rejectPoints(socket){
		socket.on(events.OnRejectPoints, async(data) =>{
			let result =  await reject_points(data);
            socket.emit(events.OnRejectPoints,result);
	    })
	}

	/*function UserProfile(socket){
		socket.on(events.OnUserProfile, async(data) =>{
			let result =  await user_profile(data);
            socket.emit(events.OnUserProfile,result);
	    })
	}
/*
	function UserLogout(socket){
		socket.on(events.OnLogout, async(data) =>{
			playerManager.RemovePlayer(socket.id);
			let result = {status :200 , msg :"player logout successfully",data:{}}
			socket.emit(events.OnLogout,result);
	    })
	}*/
}

module.exports.createSocket = createSocket;