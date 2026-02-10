import { io } from 'socket.io-client';
import {base_url} from "./constant";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || `${base_url}`;

export const socket = io(SOCKET_URL, {
    autoConnect: false, // we'll connect manually
});