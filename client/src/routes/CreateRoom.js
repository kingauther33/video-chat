import React from 'react';
import { v1 as uuid } from 'uuid';
import { useNavigate } from 'react-router-dom';

const CreateRoom = (props) => {
	const navigate = useNavigate();

	const create = () => {
		const id = uuid();
		navigate(`/room/${id}`);
	};

	return <button onClick={create}>Create Room</button>;
};

export default CreateRoom;