import { EventManager, JMClient } from "@jiomeet/core-sdk-web";
import { IJMInfoEventTypes } from './eventTypes';

let isAudioMuted = true;
let isVideoMuted = true;
let isRaised  = false;
let meetingId = "";
let meetingPin = "";
let PersonName = "";

const jmClient = new JMClient();

// It is good practice to register event before calling join meeting
EventManager.onEvent(async (eventInfo) => {
  const { data } = eventInfo;
  switch (eventInfo.type) {
    case IJMInfoEventTypes.PEER_JOINED:
      var { remotePeers } = data;
      remotePeers.forEach((remotePeer) => {
        console.log("A new peer has joined the meeting:", remotePeer);
        let peerId = remotePeer.peerId;
        let peerName = remotePeer.name;
        
        let containerId = selectDom('#video-containers');
        containerId.insertAdjacentHTML('beforeend', `<div  class="relative min-w-[300px] min-h-[250px] bg-zinc-500 rounded-lg overflow-hidden" id="${peerId}">
          <h1 class="text-2xl text-center text-white align-text-bottom absolute bottom-2 left-2">${peerName}</h1>
          </div>`);
      });
      break;
    case IJMInfoEventTypes.PEER_UPDATED:
      const { remotePeer, updateInfo } = data;
      const { action, value } = updateInfo;
      console.log('updateInfo',action,value);
      if (action === "AUDIO_MUTE" && value === false) {
        const audioTrack = await jmClient.subscribeMedia(remotePeer, "audio");
        audioTrack.play();
      } else if (action === "VIDEO_MUTE") {
        if (value === false) {
          const videoTrack = await jmClient.subscribeMedia(remotePeer, "video");
          videoTrack.play(remotePeer.peerId);
        }
      } else if (action === "SCREEN_SHARE") {
        if (value === true) {
          const screenShareTrack = await jmClient.subscribeMedia(
            remotePeer,
            "screenShare"
          );
          selectDom('#screenShearPreview').classList.remove('hidden');
          selectDom('#screenShearPreview div').style.position="absolute";
          screenShareTrack.play("screenShearPreview");
        }
        else
        {
          selectDom('#screenShearPreview').classList.add('hidden');
          selectDom('#screenShearPreview div').style.position="relative";
        }
      } else if(action === "HAND_RAISE")
      {
          console.log("afterHandValue",value);
          if (value === true) {
            alert(" SomeOne Raised Hand ");
          }
          else
          {
            alert(" SomeOne Hand Down ");
          }
      } else if(action === "DISCONNECTED")
      {
        alert("Someone disconnected");
      }
      break;
    case IJMInfoEventTypes.PEER_LEFT:
      var { remotePeers } = data;
      remotePeers.forEach((remotePeer) => {
        console.log("A peer has left the meeting:", remotePeer);
        // distroy from page 
        destroyUser(remotePeer.peerId);
      });
      break;
    default:
      break;
  }
});

async function joinMeeting() {
  selectDom('#joinMeeting').textContent="Joining";
  meetingId = selectDom('#meetingId').value;
  meetingPin = selectDom('#meetingPin').value;
  PersonName = selectDom('#personName').value;
  if(meetingId && meetingPin && PersonName)
  {
    try {
      const userId = await jmClient.joinMeeting({
        meetingId: meetingId,
        meetingPin: meetingPin,
        userDisplayName: PersonName,
        config: {
          userRole: "speaker",
        },
      });
        console.log("Joined the meeting with user ID:", userId);
        selectDom("#jiomeet-form").classList.add('hidden');
        selectDom("#main-meeting-container").classList.remove('hidden');
        selectDom('#localStream h1').textContent = PersonName;
        selectDom('#joinMeeting').textContent="Joined";
    } catch (error) {
      console.error("Failed to join the meeting:", error);
      selectDom('#joinMeeting').textContent="Join";
      alert("Failed to join the meeting");
    }
  }
  else
  {
    alert("Please fill all the fields");
  }
  
}

async function toggleMuteAudio() {
  try {
    isAudioMuted = !isAudioMuted;
    await jmClient.muteLocalAudio(isAudioMuted);
    console.log(`Local audio ${isAudioMuted ? "muted" : "unmuted"}`);
    if(!isAudioMuted)
      {
        selectDom('#audio').classList.add('bg-orange-900', 'text-white');
        selectDom('#audio').classList.remove('bg-white');
      }
      else
        {
          selectDom('#audio').classList.remove('bg-orange-900', 'text-white');
          selectDom('#audio').classList.add('bg-white');
        }
  } catch (error) {
    console.error(error);
  }
}

async function toggleMuteVideo() {
  try {
    isVideoMuted = !isVideoMuted;
    await jmClient.muteLocalVideo(isVideoMuted);
    setbackground();
    console.log(`Local video ${isVideoMuted ? "muted" : "unmuted"}`);
    if(!isVideoMuted)
    {
      selectDom('#video').classList.add('bg-orange-900', 'text-white');
      selectDom('#video').classList.remove('bg-white');
    }
    else
      {
        selectDom('#video').classList.remove('bg-orange-900', 'text-white');
        selectDom('#video').classList.add('bg-white');
      }
  } catch (error) {
    console.error(error);
  }
  const localPeer = jmClient.localPeer;
      // console.log(localPeer);
      localPeer.videoTrack.play('localStream');
}

async function setbackground()
{
    try {
      // await jmClient.setBackgroundImage("https://i.postimg.cc/HxZpHYB6/green-park-view.jpg");
      await jmClient.setBackgroundBlurring("5");
    } catch (error) {
      console.log("Failed to set background", error);
    }
}
async function startScreenShare() {
  try {
    const screenShareTrack = await jmClient.startScreenShare();
    selectDom('#screen').classList.remove('bg-white');
    selectDom('#screen').classList.add('bg-orange-900', 'text-white');

    selectDom('#screen').id="screenOff";
    const localpeetScreen = jmClient.localPeer;
    console.log(localpeetScreen);
    localpeetScreen.screenShareTrack.play('screenShearPreview');
  } catch (error) {
    console.log("Failed to start screen share", error);
  }
  selectDom('#screenOff').addEventListener('click', stopScreenShare);
}

async function stopScreenShare() {
  try {
    await jmClient.stopScreenShare();
    selectDom('#screen').classList.remove('bg-orange-900', 'text-white');
    selectDom('#screen').classList.add('bg-white');
    selectDom('#screenOff').id="screen";
  } catch (error) {
    console.log("Failed to stop screen share", error);
  }
}

async function leaveMeeting() {
  try {
    await jmClient.leaveMeeting();
    // Optional: You might want to perform any cleanup or notifications here
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  } catch (error) {
    console.error("Failed to leave the meeting:", error);
    // Optionally, you can handle the error, show a message to the user, etc.
  }
}

async function riseHand() {
  try {
    console.log('update hand',isRaised);
    if(!isRaised)
    {
      await jmClient.raiseHand(true);
      isRaised=true;
      selectDom('#raiseHand').classList.remove('bg-white');
      selectDom('#raiseHand').classList.add('bg-orange-900', 'text-white');
    }
    else{
      await jmClient.raiseHand(false);
      isRaised=false;
      selectDom('#raiseHand').classList.remove('bg-orange-900', 'text-white');
      selectDom('#raiseHand').classList.add('bg-white');
    }
  } catch (error) {
    console.error("Failed to Raise Hand:", error);
    // Optionally, you can handle the error, show a message to the user, etc.
  }
}

// async function handelStartWhiteBoard()
// {
//   try {
//     await jmClient.startWhiteboard();
//     await renderWhiteBoard('whiteBoardContainer');
//     selectDom('#whiteboard').classList.remove('bg-white');
//     selectDom('#whiteboard').classList.add('bg-orange-900', 'text-white');
//     selectDom('#whiteboard').attr('Onclick','stopWhiteBoardLcoal()');
//   } catch (error) {
//     console.error("Failed to Connect Whiteboard:", error);
//     // Optionally, you can handle the error, show a message to the user, etc.
//   }
// }

// async function stopWhiteBoardLcoal() {
//   try {
//     await jmClient.stopWhiteBoard();
//     selectDom('#whiteboard').classList.remove('bg-orange-900', 'text-white');
//     selectDom('#whiteboard').classList.add('bg-white');
//   } catch (error) {
//     console.error("Failed to Stop Whiteboard:", error);
//   }
// }

function destroyUser(id)
{
  selectDom(`#${id}`).classList.add('hidden');
}

function selectDom (elem)
{
  return document.querySelector(elem);
}

selectDom('#joinMeeting').addEventListener('click', joinMeeting);
selectDom('#audio').addEventListener('click', toggleMuteAudio);
selectDom('#video').addEventListener('click', toggleMuteVideo);
selectDom('#endMeeting').addEventListener('click', leaveMeeting);
selectDom('#screen').addEventListener('click', startScreenShare);
selectDom('#raiseHand').addEventListener('click', riseHand);
// selectDom('#whiteboard').addEventListener('click', handelStartWhiteBoard);