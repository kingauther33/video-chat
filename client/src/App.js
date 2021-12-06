import logo from './logo.svg';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import CreateRoom from './routes/CreateRoom';
import Room from './routes/Room';
import socketClient from 'socket.io-client';

function App() {
	return (
		<div className="App">
			<BrowserRouter>
				<Routes>
					<Route path="/" exact element={<CreateRoom />} />
					<Route path="/room/:roomID" exact element={<Room />} />
				</Routes>
			</BrowserRouter>
		</div>
	);
}

export default App;
