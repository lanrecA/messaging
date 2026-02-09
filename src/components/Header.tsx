import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();
    const isLoggedIn = false; // Replace with real auth state later

    return (
        <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#faac36' }}>
            <div className="container">
                <Link className="navbar-brand fw-bold fs-4" to="/" style={{ color: '#000' }}>
                    ChatSphere
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className="nav-link text-dark" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link text-dark" to="/features">Features</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link text-dark" to="/about">About Us</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link text-dark" to="/pricing">Pricing</Link>
                        </li>
                    </ul>

                    <div>
                        {!isLoggedIn && (
                            <>
                                <Link to="/login" className="btn btn-outline-dark me-2">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="btn btn-dark">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}