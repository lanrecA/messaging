import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {base_url} from "../constant";

export default function SignUp() {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        contact: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic client-side validation
        if (!form.firstName || !form.lastName || !form.contact || !form.password) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${base_url}/api/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    contact: form.contact,
                    password: form.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific backend errors
                if (response.status === 409) {
                    setError('Email or mobile number is already registered.');
                } else {
                    setError(data.error || 'Failed to sign up. Please try again.');
                }
                return;
            }

            // Success - redirect to login
            alert('Account created successfully! Please sign in.');
            navigate('/login');

        } catch (err) {
            console.error('Signup error:', err);
            setError('Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4" style={{ color: '#faac36' }}>
                                Create Account
                            </h2>

                            {error && <div className="alert alert-danger">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        className="form-control"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        className="form-control"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Mobile or Email</label>
                                    <input
                                        type="text"
                                        name="contact"
                                        className="form-control"
                                        value={form.contact}
                                        onChange={handleChange}
                                        required
                                        placeholder="example@email.com or +1234567890"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control"
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn w-100"
                                    style={{
                                        backgroundColor: '#faac36',
                                        color: '#000',
                                        fontWeight: 'bold',
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Signing Up...
                                        </>
                                    ) : (
                                        'Sign Up'
                                    )}
                                </button>
                            </form>

                            <p className="text-center mt-3">
                                Already have an account? <a href="/login">Sign In</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}