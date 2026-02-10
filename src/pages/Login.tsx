import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {base_url} from "../constant";

export default function Login() {
    const [form, setForm] = useState({
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

        if (!form.contact || !form.password) {
            setError('Mobile/Email and password are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${base_url}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contact: form.contact,
                    password: form.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid credentials. Please try again.');
                return;
            }

            // Success - store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('username', `${data.user.firstName} ${data.user.lastName}`);

            // Redirect to home/dashboard
            navigate('/home');

        } catch (err) {
            console.error('Login error:', err);
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
                                Welcome Back
                            </h2>

                            {error && <div className="alert alert-danger">{error}</div>}

                            <form onSubmit={handleSubmit}>
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
                                            Signing In...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>

                            <p className="text-center mt-3">
                                Don't have an account? <a href="/signup">Sign Up</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}