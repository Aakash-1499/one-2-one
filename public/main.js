// client server

import * as state from "./state.js";

import * as socketlistener from "./socketlistener.js";

import * as webRTCHandler from "./webRTCHandler.js";
import * as constants from "./constants.js";


//starting of socketio connection
const socket=io('/');
socketlistener.socketevent(socket);

// local preview

webRTCHandler.getLocalPreview() 


//copy button

const CopyButton = document.getElementById(
    "copy_button"
);
CopyButton.addEventListener("click", () => {
    console.log("copy button clicked");
    const personalCode = state.getState().socketId;
    navigator.clipboard && navigator.clipboard.writeText(personalCode);
    
    
});

// connection buttons
const personalCodeChatButton = document.getElementById(
    "chat"
);

const personalCodeVideoButton = document.getElementById(
    "video"
);
personalCodeChatButton.addEventListener("click", () => {
    console.log("chat button clicked");

    const calleePersonalCode = document.getElementById(
        "personal_code_input"
    ).value;
    const callType = constants.callType.CHAT_PERSONAL_CODE; 
    webRTCHandler.sendPreOffer(callType,calleePersonalCode)
});

    personalCodeVideoButton.addEventListener("click", () => {
        console.log("video button clicked");
        const calleePersonalCode = document.getElementById(
            "personal_code_input"
        ).value;
        const callType = constants.callType.VIDEO_PERSONAL_CODE;
        webRTCHandler.sendPreOffer(callType, calleePersonalCode)
    });



