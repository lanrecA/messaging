import { useState, useEffect, useRef, FormEvent } from 'react';
import { socket } from '../socket';
import { base_url } from '../constant';

// Message shape
interface Message {
    username: string;
    text: string;
    timestamp: string;
}

// Contact from /api/contacts
interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    contact_identifier: string;
    added_at: string;
}

// Search result user from /api/search-users
interface SearchUser {
    id: number;
    first_name: string;
    last_name: string;
    contact_identifier: string;
}

// Auth user from localStorage
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

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper: get logged-in user
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

    // Load contacts & setup socket
    useEffect((): any => {
        const username = localStorage.getItem('username') || 'Guest';
        setCurrentUser(username);

        const user = getCurrentUser();
        if (user?.id) {
            setLoadingContacts(true);
            fetch(`${base_url}/api/contacts/${user.id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch contacts');
                    return res.json();
                })
                .then((data: Contact[]) => {
                    setContacts(data);
                    if (data.length > 0 && !selectedChat) {
                        setSelectedChat(`${data[0].first_name} ${data[0].last_name}`);
                    }
                })
                .catch(err => console.error('Failed to load contacts:', err))
                .finally(() => setLoadingContacts(false));
        }

        // Socket setup
        socket.connect();

        socket.on('connect', () => {
            socket.emit('set username', username);
        });

        // Listen for private messages only if they belong to current chat
        socket.on('private message', (msg: Message) => {
            const senderName = msg.username;
            const receiverName = selectedChat;
            if (senderName === currentUser || senderName === receiverName) {
                setMessages(prev => [...prev, msg]);
            }
        });

        socket.on('user list', (users: string[]) => setOnlineUsers(users));
        socket.on('notification', (notif: string) => {
            setMessages(prev => [...prev, { username: 'System', text: notif, timestamp: new Date().toISOString() }]);
        });

        return () => socket.disconnect();
    }, [selectedChat]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Search users (debounced)
    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        const timeout = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`${base_url}/api/search-users?query=${encodeURIComponent(searchQuery.trim())}`);
                if (!res.ok) throw new Error('Search failed');
                const data: SearchUser[] = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error('Search error:', err);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Add contact
    const addContact = async (contactUserId: number) => {
        const user = getCurrentUser();
        if (!user?.id) return;

        try {
            const res = await fetch(`${base_url}/api/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, contactUserId }),
            });

            if (!res.ok) throw new Error('Failed to add contact');

            // Refresh contacts list
            const updated = await fetch(`${base_url}/api/contacts/${user.id}`).then(r => r.json());
            setContacts(updated);

            alert('Contact added successfully!');
        } catch (err) {
            console.error(err);
            alert('Could not add contact');
        }
    };

    // Start private chat with a user
    const startChatWithUser = (user: SearchUser | Contact) => {
        const name = `${user.first_name || (user as any).firstName} ${user.last_name || (user as any).lastName}`;
        setSelectedChat(name);
        socket.emit('join chat', name); // Join private room
        setSearchQuery('');
        setSearchResults([]);
    };

    const sendMessage = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;

        socket.emit('private message', {
            to: selectedChat,
            text: messageInput.trim(),
        });

        setMessageInput('');
    };

    const getContactName = (contact: Contact) => `${contact.first_name} ${contact.last_name}`;

    return (
        <div className="d-flex flex-column vh-100" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="flex-grow-1 d-flex overflow-hidden">
                {/* LEFT SIDEBAR */}
                <div className="bg-white border-end" style={{ width: '320px', minWidth: '320px', overflowY: 'auto' }}>
                    <div className="p-3 border-bottom d-flex align-items-center">
                        <div className="bg-dark rounded-circle me-3" style={{ width: '48px', height: '48px' }} />
                        <h5 className="mb-0">Chats</h5>
                        <div className="ms-auto d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary rounded-circle">🎥</button>
                            <button className="btn btn-sm btn-outline-secondary rounded-circle">+</button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-3">
                        <input
                            type="text"
                            className="form-control bg-light border-0"
                            placeholder="Search phone or email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Search Results */}
                    {searchQuery.trim().length >= 3 && (
                        <div className="border-bottom pb-2">
                            {searchLoading ? (
                                <div className="text-center p-3 text-muted">Searching...</div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center p-3 text-muted">No users found</div>
                            ) : (
                                searchResults.map(user => {
                                    const name = `${user.first_name} ${user.last_name}`;
                                    const isAlreadyContact = contacts.some(c => c.id === user.id);

                                    return (
                                        <div
                                            key={user.id}
                                            className="list-group-item d-flex align-items-center justify-content-between p-3 border-0"
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="bg-secondary rounded-circle me-3" style={{ width: '48px', height: '48px' }} />
                                                <div>
                                                    <h6 className="mb-0">{name}</h6>
                                                    <small className="text-muted">{user.contact_identifier}</small>
                                                </div>
                                            </div>

                                            {isAlreadyContact ? (
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => startChatWithUser(user)}
                                                >
                                                    Chat
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => addContact(user.id)}
                                                >
                                                    Add Contact
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Contacts List */}
                    <div className="list-group list-group-flush">
                        {loadingContacts ? (
                            <div className="text-center p-4 text-muted">Loading contacts...</div>
                        ) : contacts.length === 0 ? (
                            <div className="text-center p-4 text-muted">No contacts yet</div>
                        ) : (
                            contacts.map(contact => {
                                const name = getContactName(contact);
                                return (
                                    <button
                                        key={contact.id}
                                        className={`list-group-item list-group-item-action border-0 d-flex align-items-center p-3 ${
                                            name === selectedChat ? 'bg-light' : ''
                                        }`}
                                        onClick={() => startChatWithUser(contact)}
                                    >
                                        <div className="bg-secondary rounded-circle me-3 flex-shrink-0" style={{ width: '56px', height: '56px' }} />
                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="d-flex justify-content-between">
                                                <h6 className="mb-0">{name}</h6>
                                                <small className="text-muted">Just now</small>
                                            </div>
                                            <p className="mb-0 text-muted small text-truncate">
                                                Tap to chat
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* MIDDLE - Chat */}
                <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                    <div className="border-bottom p-3 d-flex align-items-center bg-white">
                        <div className="bg-success rounded-circle me-3" style={{ width: '48px', height: '48px' }} />
                        <div className="flex-grow-1">
                            <h5 className="mb-0">{selectedChat || 'Select or search a contact'}</h5>
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
                                <h5>Select or search for a contact to start chatting</h5>
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
                                            <div className="bg-secondary rounded-circle me-2 flex-shrink-0" style={{ width: '40px', height: '40px' }} />
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
                                            <div className="bg-primary rounded-circle ms-2 flex-shrink-0" style={{ width: '40px', height: '40px' }} />
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
                                    onChange={e => setMessageInput(e.target.value)}
                                    disabled={!selectedChat}
                                />
                                <button className="btn btn-outline-secondary" type="button">😊</button>
                                <button className="btn btn-outline-secondary" type="button">❤️</button>
                                <button className="btn btn-warning text-dark" type="submit" disabled={!selectedChat || !messageInput.trim()}>
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="bg-white border-start" style={{ width: '340px', minWidth: '340px', overflowY: 'auto' }}>
                    <div className="p-4 text-center border-bottom">
                        <div className="bg-dark rounded-circle mx-auto mb-3" style={{ width: '120px', height: '120px' }} />
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
                        {/* Your customize section here */}
                    </div>
                </div>
            </div>
        </div>
    );
}