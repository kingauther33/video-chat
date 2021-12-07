const { RTCPeerConnection } = require('wrtc');

window.onload = () => {
	document.getElementById('my-button').onclick = () => {
		init();
	};
};

const init = async () => {
	const peer = createPeer();
	peer.addTransceiver('video', { direction: 'recvonly' });
};

const createPeer = () => {
	const peer = new RTCPeerConnection({
		iceServers: [
			{
				urls: 'stun:stun.stunprotocol.org',
			},
		],
	});

	peer.ontrack = handleTrackEvent;
	peer.onnegotiationneeded = () => handleNegotitationNeededEvent(peer);

	return peer;
};

const handleNegotitationNeededEvent = async (peer) => {
	const offer = await peer.createOffer();
	await peer.setLocalDescription(offer);
	const payload = {
		sdp: peer.localDescription,
	};

	const { data } = await axios.post('/consumer', payload);
	const desc = new RTCSessionDescription(data.sdp);
	peer.setRemoteDescription(desc).catch((err) => console.log(err));
};

const handleTrackEvent = (e) => {
	document.getElementById('video').srcObject = e.streams[0];
};
