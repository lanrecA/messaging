import { useState, useEffect, useRef, FormEvent } from 'react';
import { socket } from '../socket';
import {base_url} from "../constant";

// Define the shape of each message
interface Message {
    username: string;
    text: string;
    timestamp: string;
}

// Define the shape of contacts returned from API
interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    contact_identifier: string;
    added_at: string;
    // Add more fields if your API returns them (e.g. lastMessage, time)
}

// Define authenticated user shape
interface AuthUser {
    id: number;
    firstName: string;
    lastName: string;
    contact: string;
}

export default function Home() {
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState('You');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper to get current authenticated user
    const getCurrentUser = (): AuthUser | null => {
        const stored = localStorage.getItem('user');
        if (!stored) return null;

        try {
            return JSON.parse(stored) as AuthUser;
        } catch {
            console.error('Invalid user data in localStorage');
            return null;
        }
    };

    // Load user and contacts on mount
    useEffect(() => {
        const username = localStorage.getItem('username') || 'Guest';
        setCurrentUser(username);

        const user = getCurrentUser();
        if (user?.id) {
            setLoadingContacts(true);
            fetch(`${base_url}/api/contacts/${user.id}`)
                .then((res) => {
                    if (!res.ok) throw new Error('Failed to fetch contacts');
                    return res.json();
                })
                .then((data: Contact[]) => {
                    setContacts(data);
                    // Auto-select first contact if none is selected
                    if (data.length > 0 && !selectedChat) {
                        const firstContact = `${data[0].first_name} ${data[0].last_name}`;
                        setSelectedChat(firstContact);
                    }
                })
                .catch((err) => {
                    console.error('Failed to load contacts:', err);
                })
                .finally(() => setLoadingContacts(false));
        }

        // Socket connection
        socket.connect();

        socket.on('connect', () => {
            socket.emit('set username', username);
        });

        socket.on('chat message', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('user list', (users: string[]) => {
            setOnlineUsers(users);
        });

        socket.on('notification', (notif: string) => {
            setMessages((prev) => [
                ...prev,
                { username: 'System', text: notif, timestamp: new Date().toISOString() },
            ]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (messageInput.trim()) {
            socket.emit('chat message', messageInput.trim());
            setMessageInput('');
        }
    };

    // Format contact name
    const getContactName = (contact: Contact) =>
        `${contact.first_name} ${contact.last_name}`;

    return (
        <div className="d-flex flex-column vh-100" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="flex-grow-1 d-flex overflow-hidden">
                {/* LEFT SIDEBAR - Dynamic Contacts */}
                <div
                    className="bg-white border-end"
                    style={{ width: '320px', minWidth: '320px', overflowY: 'auto' }}
                >
                    <div className="p-3 border-bottom d-flex align-items-center">
                        <div className="bg-dark rounded-circle me-3" style={{ width: '48px', height: '48px' }}></div>
                        <h5 className="mb-0">Chats</h5>
                        <div className="ms-auto d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary rounded-circle">🎥</button>
                            <button className="btn btn-sm btn-outline-secondary rounded-circle">+</button>
                        </div>
                    </div>

                    <div className="p-3">
                        <input
                            type="text"
                            className="form-control bg-light border-0"
                            placeholder="Search Messenger..."
                        />
                    </div>

                    <div className="list-group list-group-flush">
                        {loadingContacts ? (
                            <div className="text-center p-4 text-muted">Loading contacts...</div>
                        ) : contacts.length === 0 ? (
                            <div className="text-center p-4 text-muted">No contacts yet</div>
                        ) : (
                            contacts.map((contact) => {
                                const name = getContactName(contact);
                                return (
                                    <button
                                        key={contact.id}
                                        className={`list-group-item list-group-item-action border-0 d-flex align-items-center p-3 ${
                                            name === selectedChat ? 'bg-light' : ''
                                        }`}
                                        onClick={() => setSelectedChat(name)}
                                    >
                                        <div
                                            className="bg-secondary rounded-circle me-3 flex-shrink-0"
                                            style={{ width: '56px', height: '56px' }}
                                        ></div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="d-flex justify-content-between">
                                                <h6 className="mb-0">{name}</h6>
                                                {/* You can show last message time here if added to API response */}
                                                <small className="text-muted">Just now</small>
                                            </div>
                                            <p className="mb-0 text-muted small text-truncate">
                                                {/* Placeholder — add last message from API if available */}
                                                Tap to start chatting
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* MIDDLE - Chat conversation */}
                <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                    <div className="border-bottom p-3 d-flex align-items-center bg-white">
                        <div className="bg-success rounded-circle me-3" style={{ width: '48px', height: '48px' }}></div>
                        <div className="flex-grow-1">
                            <h5 className="mb-0">{selectedChat || 'Select a contact'}</h5>
                            <small className="text-success">Online</small>
                        </div>
                        <div className="d-flex gap-3">
                            <button className="btn btn-outline-secondary rounded-circle">📞</button>
                            <button className="btn btn-outline-secondary rounded-circle">🎥</button>
                            <button className="btn btn-outline-secondary rounded-circle">⋯</button>
                        </div>
                    </div>

                    <div className="flex-grow-1 p-4 overflow-auto bg-light" style={{ backgroundColor: '#e9ecef' }}>
                        {!selectedChat ? (
                            <div className="text-center my-5 text-muted">
                                <h5>Select a contact to start chatting</h5>
                            </div>
                        ) : (
                            <>
                                <div className="text-center my-4">
                                    <small className="bg-white px-3 py-1 rounded-pill text-muted">Chat started</small>
                                </div>

                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`d-flex mb-4 ${msg.username === currentUser ? 'justify-content-end' : 'justify-content-start'}`}
                                    >
                                        {msg.username !== currentUser && (
                                            <div className="bg-secondary rounded-circle me-2 flex-shrink-0" style={{ width: '40px', height: '40px' }}></div>
                                        )}

                                        <div>
                                            {msg.username !== currentUser && (
                                                <small className="text-muted mb-1 d-block">{msg.username}</small>
                                            )}

                                            <div
                                                className={`p-3 rounded-3 shadow-sm ${
                                                    msg.username === currentUser ? 'bg-warning text-dark' : 'bg-white border'
                                                }`}
                                                style={{ maxWidth: '420px' }}
                                            >
                                                {msg.text}
                                            </div>

                                            <small className="text-muted mt-1 d-block">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.username === currentUser && ' • You'}
                                            </small>
                                        </div>

                                        {msg.username === currentUser && (
                                            <div className="bg-primary rounded-circle ms-2 flex-shrink-0" style={{ width: '40px', height: '40px' }}></div>
                                        )}
                                    </div>
                                ))}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className="bg-white border-top p-3">
                        <form onSubmit={sendMessage}>
                            <div className="input-group">
                                <button className="btn btn-outline-secondary" type="button">+</button>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Write something..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    disabled={!selectedChat}
                                />
                                <button className="btn btn-outline-secondary" type="button">😊</button>
                                <button className="btn btn-outline-secondary" type="button">❤️</button>
                                <button className="btn btn-warning text-dark" type="submit" disabled={!selectedChat}>
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - Profile & Online Users */}
                <div
                    className="bg-white border-start"
                    style={{ width: '340px', minWidth: '340px', overflowY: 'auto' }}
                >
                    <div className="p-4 text-center border-bottom">
                        <div className="bg-dark rounded-circle mx-auto mb-3" style={{ width: '120px', height: '120px' }}></div>
                        <h5 className="mb-1">{selectedChat || 'No chat selected'}</h5>
                        <p className="text-success mb-0">Online</p>
                    </div>

                    <div className="p-3">
                        <h6 className="mb-3">Online Users ({onlineUsers.length})</h6>
                        <ul className="list-group">
                            {onlineUsers.map((user, idx) => (
                                <li key={idx} className="list-group-item">
                                    {user} {user === currentUser && '(You)'}
                                </li>
                            ))}
                            {onlineUsers.length === 0 && (
                                <li className="list-group-item text-muted">No one else online yet</li>
                            )}
                        </ul>

                        <h6 className="mt-4 mb-3">Customize Chat</h6>
                        {/* ... your existing customize content ... */}
                    </div>
                </div>
            </div>
        </div>
    );
}