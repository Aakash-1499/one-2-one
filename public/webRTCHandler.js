import * as socketlistener from "./socketlistener.js";
import * as constants from "./constants.js" 
import * as UI from "./UI.js";
import * as state from "./state.js";



let connectedUserDetails;
let peerConection;

const defaultOption ={
  audio :true,
  video:true
}

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:13902",
    },
  ],
};

export const getLocalPreview=() =>{
  navigator.mediaDevices.getUserMedia(defaultOption).then((stream)=>{
    UI.updateLocalVideo(stream);
    state.setLocalStream(stream);
  })
    .catch((error) => {
      console.log("A camera access error occurred");
      console.log(error);
    });
  
};

const createPeerConnection = () => {
  peerConection = new RTCPeerConnection(configuration);

  peerConection.onicecandidate = (event) => {
    console.log("getting ice candidates from stun server");
    if (event.candidate) {
      // sending our ice candidates to callee
      socketlistener.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.ICE_CANDIDATE,
        candidate: event.candidate,
      });
    }
  };
  peerConection.onconnectionstatechange = (event) => {
    if (peerConection.connectionState === "connected") {
      console.log("succesfully connected with other peer");
    }
  };


  // receiving id
  const remoteStream = new MediaStream();
  state.setRemoteStream(remoteStream);
  UI.updateRemoteVideo(remoteStream);

  peerConection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  };

  // adding our stream to peer connection

  if (
    connectedUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const localStream = state.getState().localStream;

    for (const track of localStream.getTracks()) {
      peerConection.addTrack(track, localStream);
    }
  }
};
 


export const sendPreOffer = (callType,calleePersonalCode)=>{
 
  connectedUserDetails = {
    callType,
    socketId: calleePersonalCode,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const data = {
      callType,
      calleePersonalCode,
    };
    UI.showCallingDialog(callingDialogRejectCallHandler);
    socketlistener.sendPreOffer(data);
  }


};

export const handlePreOffer = (data) => {
// console.log("pre-offer came");
// console.log(data);
  const { callType, callerSocketId } = data;
  connectedUserDetails = {
    socketId: callerSocketId,
    callType,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    console.log("showing call dialog");
    UI.showIncomingCallDialog(callType,acceptCallHandler,rejectCallHandler);
  }



};

const acceptCallHandler = () => {
  console.log("call accepted");
  createPeerConnection();
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
  UI.showCallElements(connectedUserDetails.callType);
  constants.preOfferAnswer.CALL_ACCEPTED
};

const rejectCallHandler = () => {
  console.log("call rejected");
  sendPreOfferAnswer();
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};

const callingDialogRejectCallHandler = () => {
  console.log("rejecting the call");
};


const sendPreOfferAnswer = (preOfferAnswer) => {
  const data = {
    callerSocketId: connectedUserDetails.socketId,
    preOfferAnswer,
  };
  UI.removeAllDialogs();
  socketlistener.sendPreOfferAnswer(data);
};
export const handlePreOfferAnswer = (data) => {
  const { preOfferAnswer } = data;

  console.log('pre offer ans came');
  console.log(data);

  UI.removeAllDialogs();

  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    UI.showInfoDialog(preOfferAnswer);
    // show dialog that callee has not been found
  }

  // if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
  //   ui.showInfoDialog(preOfferAnswer);
  //   // show dialog that callee is not able to connect
  // }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    UI.showInfoDialog(preOfferAnswer);
    // show dialog that call is rejected by the callee
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    UI.showCallElements(connectedUserDetails.callType);
    createPeerConnection();
    // send webRTC offer

    sendWebRTCOffer();
  }
};

const sendWebRTCOffer = async() => {
  const offer = await peerConection.createOffer();
  await peerConection.setLocalDescription(offer);
  socketlistener.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.OFFER,
    offer: offer,
  });
};

export const handleWebRTCOffer =  async(data) => {
  console.log("webRTC offer came");
  console.log(data)
  
  await peerConection.setRemoteDescription(data.offer);
  const answer = await peerConection.createAnswer();
  await peerConection.setLocalDescription(answer);
  socketlistener.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer: answer,
  });
};



export const handleWebRTCAnswer = async (data) => {
  console.log("handling webRTC Answer");
  await peerConection.setRemoteDescription(data.answer);
};

export const handleWebRTCCandidate = async (data) => {
  console.log("handling incoming webRTC candidates");
  try {
    await peerConection.addIceCandidate(data.candidate);
  } catch (err) {
    console.error(
      "error occured when trying to add received ice candidate",
      err
    );
  }
};