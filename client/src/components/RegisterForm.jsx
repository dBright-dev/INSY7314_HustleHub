import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterForm() {
    const {register} = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Client',
    });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const updateField = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const validate = () => {
        if (!form.name.trim()) return 'Name is required.';
        if (!form.email.trim()) return 'Email is required.';
        if (form.password.length < 8) return 'Password must be at least 8 characters.';
        if (form.password !== form.confirmPassword) return 'Passwords do not match.';
        return '';
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus('');

        const err = validate();
        if (err) {
            setStatus(err);
            return;
        }

        setLoading(true);
        try {
            await register({
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
            });
            navigate('/login', { state: { registered: true }});
        } catch (err) {
            setStatus(err.message);
        } finally {
            setLoading(false);
        }
    };

 return (
        <section className="panel" style={{ maxWidth: 480, margin: '40px auto' }}>
            <span className="eyebrow plain">Get started</span>
            <h1 style={{ marginTop: 8 }}>Join Hustle<span className="gold">+</span></h1>

            <form onSubmit={handleSubmit} noValidate>
                <label className="field-label">
                    Full name
                    <input name="name" value={form.name} onChange={updateField} autoFocus />
                </label>

                <label className="field-label">
                    Email
                    <input name="email" type="email" value={form.email} onChange={updateField} />
                </label>

                <label className="field-label">
                    I am a
                    <select name="role" value={form.role} onChange={updateField}
                        style={{ width: '100%', marginTop: 7, padding: 11, borderRadius: 9, border: '1px solid var(--line)' }}>
                        <option value="Client">Client — I want to hire</option>
                        <option value="Freelancer">Freelancer — I offer services</option>
                    </select>
                </label>

                <label className="field-label">
                    Password
                    <input name="password" type="password" value={form.password} onChange={updateField} />
                </label>

                <label className="field-label">
                    Confirm password
                    <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} />
                </label>

                <button type="submit" className="primary-button full-button" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
            </form>

            {status && <p role="alert" className="status status-in-progress" style={{ marginTop: 14 }}>{status}</p>}

            <p style={{ marginTop: 18, fontSize: 12, textAlign: 'center', color: 'var(--muted)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--sapphire)' }}>Sign in</Link>
            </p>
        </section>
    );
}    
