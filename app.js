// global variable
var username = 'agungdp';
var target;
var pubnub;
var peerconnection;
var localStream = 'ac';

// video placeholder
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

// initiliaze jquery
$(function() {
  // initialize pubnub function after web app ready
  init();

  // capture local video
  captureLocalvideo();

  // listen on click action
  $('#callTarget').on('click', function(e) {
    e.preventDefault();
    // get target username
    target = $('#target').val();

    // call target
    call(target);
  });
});

// init pubnub function
function init() {
  pubnub = new PubNub({
    publishKey : 'pub-c-c7cb6492-de1c-45de-bbd6-3fd659bd588b',
    subscribeKey : 'sub-c-4745dd8a-b8e2-11e6-9dca-02ee2ddab7fe'
  });
  pubnub.addListener({
    message: function(m) {
      var msg = m.message;
      console.log(msg);

      if (msg.data.type == 'offer') {
        alert('Incoming call from ' + msg.from);

        // save from target
        target = msg.from;

        // accept call
        accept(msg.data);
      } else if (msg.data.type == 'answer') {
        setAnswer(msg.data);
      } else if (msg.data.type == 'candidate') {
        peerconnection.addIceCandidate(new RTCIceCandidate(msg.data));
      }
    },
    presence: function(p) {
      //
    },
    status: function(s) {
      //
    }
  });
  pubnub.subscribe({
    channels: [username]
  });
}

// call function
function call() {
  // initiliaze peer connection
  createPeerconnection();

  // create offer
  peerconnection.createOffer(function(description) {
    peerconnection.setLocalDescription(new RTCSessionDescription(description));
    var data = {
      from: username,
      data: description
    };

    // send data to target
    send(data);
  }, function(error) {
    console.error(error);
  });
}

// accept function
function accept(data) {
  // initiliaze peer connection
  createPeerconnection();

  peerconnection.setRemoteDescription(new RTCSessionDescription(data));

  // create answer
  peerconnection.createAnswer(function(description) {
    peerconnection.setLocalDescription(new RTCSessionDescription(description));
    var data = {
      from: username,
      data: description
    };

    // send data to target
    send(data);
  }, function(error) {
    console.error(error);
  });
}

// set answer function
function setAnswer(data) {
  peerconnection.setRemoteDescription(new RTCSessionDescription(data));
}

// send data function
function send(data) {
  pubnub.publish({
    message: data,
    channel: target,
  }, function (status, response) {
    //
  });
}

// capture local video function
function captureLocalvideo() {
  navigator.getUserMedia({ audio:true, video:true },
    function(stream) {
      localStream = stream;
      localVideo.src = URL.createObjectURL(stream);
    }, function(error) {
      alert('Error capture local video');
    }
  );
}

// create peer connection function
function createPeerconnection() {
  // peer connection config
  var pcConfig = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};

  var pcConstraint = {
    'optional': [
      {'DtlsSrtpKeyAgreement': true},
    ]
  };

  var sdpConstraint = {'mandatory': {
    'OfferToReceiveAudio':true,
    'OfferToReceiveVideo':true }
  };

  peerconnection = new RTCPeerConnection(pcConfig);
  peerconnection.onicecandidate = getIceCandidate;
  peerconnection.addStream(localStream);
  peerconnection.onaddstream = getRemoteStream;
}

// get ice candidate function
function getIceCandidate(event) {
  if (event.candidate) {
    var candidate = {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }
    var data = {
      from: username,
      data: candidate
    };

    send(data);
  }
}

// get remote stream function
function getRemoteStream(event) {
  console.log(event.stream);
  remoteVideo.src = URL.createObjectURL(event.stream);
}