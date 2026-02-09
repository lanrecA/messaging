import Header from '../components/Header';

export default function LandingPage() {
    return (
        <div>
            <Header />

            <main>
                {/* Hero Section */}
                <section className="py-5 text-center" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="container py-5">
                        <h1 className="display-4 fw-bold mb-3" style={{ color: '#000' }}>
                            Connect Instantly, Chat Freely
                        </h1>
                        <p className="lead mb-4 text-muted">
                            Simple, secure, and fast messaging for friends, family, and teams — anywhere, anytime.
                        </p>
                        <a href="/signup" className="btn btn-lg me-3" style={{ backgroundColor: '#faac36', color: '#000', border: 'none' }}>
                            Get Started Free
                        </a>
                        <a href="/features" className="btn btn-outline-secondary btn-lg">
                            Learn More
                        </a>

                        <div className="mt-5">
                            <img
                                src="hero.jpg"
                                alt="Hero visual - people chatting"
                                className="img-fluid rounded shadow"
                            />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-4 text-center bg-dark text-white">
                <p>© 2026 ChatSphere. All rights reserved.</p>
            </footer>
        </div>
    );
}