import React, { useRef, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router';

const Room = (props) => {
	const { roomID } = useParams();
	const userVideo = useRef();
	const partnerVideo = useRef();
	const peerRef = useRef();
	const socketRef = useRef();
	const otherUser = useRef();
	const userStream = useRef();

	const handleNegotiationNeededEvent = (userID) => {
		peerRef.current
			.createOffer()
			.then((offer) => {
				return peerRef.current.setLocalDescription(offer);
			})
			.then(() => {
				const payload = {
					target: userID,
					caller: socketRef.current.id,
					sdp: peerRef.current.localDescription,
				};
				socketRef.current.emit('offer', payload);
			})
			.catch((e) => console.log(e));
	};

	const createPeer = useCallback((userID) => {
		const peer = new RTCPeerConnection({
			iceServers: [
				{
					urls: 'stun:stun.stunprotocol.org',
				},
				{
					urls: 'turn:numb.viagenie.ca',
					credential: 'muazkh',
					username: 'webrtc@live.com',
				},
			],
		});

		peer.onicecandidate = handleICECandidateEvent;
		peer.ontrack = handleTrackEvent;
		peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

		return peer;
	}, []);

	const handleRecieveCall = useCallback(
		(incoming) => {
			peerRef.current = createPeer();
			const desc = new RTCSessionDescription(incoming.sdp);
			peerRef.current
				.setRemoteDescription(desc)
				.then(() => {
					userStream.current
						.getTracks()
						.forEach((track) =>
							peerRef.current.addTrack(track, userStream.current)
						);
				})
				.then(() => {
					return peerRef.current.createAnswer();
				})
				.then((answer) => {
					return peerRef.current.setLocalDescription(answer);
				})
				.then(() => {
					const payload = {
						target: incoming.caller,
						caller: socketRef.current.id,
						sdp: peerRef.current.localDescription,
					};
					socketRef.current.emit('answer', payload);
				});
		},
		[createPeer]
	);

	const handleAnswer = (message) => {
		const desc = new RTCSessionDescription(message.sdp);
		peerRef.current.setRemoteDescription(desc).catch((e) => console.log(e));
	};

	const handleICECandidateEvent = (e) => {
		if (e.candidate) {
			const payload = {
				target: otherUser.current,
				candidate: e.candidate,
			};
			socketRef.current.emit('ice-candidate', payload);
		}
	};

	const handleNewICECandidateMsg = (incoming) => {
		const candidate = new RTCIceCandidate(incoming);

		peerRef.current.addIceCandidate(candidate).catch((e) => console.log(e));
	};

	function handleTrackEvent(e) {
		partnerVideo.current.srcObject = e.streams[0];
	}

	const callUser = useCallback(
		(userID) => {
			peerRef.current = createPeer(userID);
			userStream.current
				.getTracks()
				.forEach((track) =>
					peerRef.current.addTrack(track, userStream.current)
				);
		},
		[createPeer]
	);

	useEffect(() => {
		navigator.mediaDevices
			.getUserMedia({ audio: true, video: true })
			.then((stream) => {
				userVideo.current.srcObject = stream;
				userStream.current = stream;
				debugger;

				socketRef.current = io('http://localhost:3000/');
				socketRef.current.emit('join room', roomID);

				//B nhan emit nay
				socketRef.current.on('other user', (userID) => {
					//userId = id cua A
					callUser(userID);
					otherUser.current = userID;
				});

				//A nhan emit nay
				socketRef.current.on('user joined', (userID) => {
					//userId = id cua B
					otherUser.current = userID;
				});

				socketRef.current.on('offer', handleRecieveCall);
				socketRef.current.on('answer', handleAnswer);
				socketRef.current.on('ice-candidate', handleNewICECandidateMsg);
			})
			.catch((err) => console.log(err));
	}, [callUser, handleRecieveCall, roomID]);

	return (
		<div>
			<video autoPlay ref={userVideo} />
			<video autoPlay ref={partnerVideo} />
		</div>
	);
};

export default Room;
