// client/src/pages/Profile.jsx
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

export default function Profile() {
    const { user } = useAuth();
    const initials = (user?.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <>
            <header className="topbar"><div><h1>Your profile</h1><p>Show clients what makes your work unmistakably yours.</p></div></header>
            <section className="profile-hero">
                <span className="avatar large">{initials}</span>
                <div><span className="eyebrow">Verified {user?.role}</span><h2>{user?.name}</h2><p>{user?.email} · {user?.role}</p></div>
            </section>
            <section className="panel" style={{ marginTop: 20 }}>
                <span className="eyebrow plain">About</span>
                <p style={{ color: 'var(--muted)' }}>Complete your bio, skills and portfolio to get 2× more enquiries. <Icon name="sparkle" size={14} /></p>
            </section>
        </>
    );
}
