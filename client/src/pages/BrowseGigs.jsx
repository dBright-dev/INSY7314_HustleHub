import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GigCard from '../components/GigCard';
import Icon from '../components/Icon';
import { CATEGORIES } from '../components/GigForm';
import { formatRand } from '../utils/format';

export default function BrowseGigs() {
    const { user } = useAuth();
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [selected, setSelected] = useState(null); // gig waiting for booking confirmation
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [confirmation, setConfirmation] = useState(null);

    useEffect(() => {
        let active = true;
        apiRequest('/api/gigs')
            .then((res) => active && setGigs(res.data || []))
            .catch((err) => active && setError(err.message || 'Could not load gigs'))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    // Hide the success message again after a few seconds.
    useEffect(() => {
        if (!confirmation) return undefined;
        const timer = setTimeout(() => setConfirmation(null), 6000);
        return () => clearTimeout(timer);
    }, [confirmation]);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return gigs.filter((g) => {
            if (category !== 'All' && g.category !== category) return false;
            if (!term) return true;
            return [g.title, g.description, g.owner?.name]
                .filter(Boolean)
                .some((text) => text.toLowerCase().includes(term));
        });
    }, [gigs, search, category]);

    const openBooking = (gig) => {
        setBookingError('');
        setSelected(gig);
    };

    const closeBooking = () => {
        if (!booking) setSelected(null);
    };

    const confirmBooking = async () => {
        setBooking(true);
        setBookingError('');
        try {
            await apiRequest('/api/bookings', {
                method: 'POST',
                body: JSON.stringify({ gig: selected._id }),
            });
            setConfirmation({ title: selected.title, amount: selected.price });
            setSelected(null);
        } catch (err) {
            setBookingError(err.message || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    return (
        <>
            <header className="topbar">
                <div>
                    <h1>Discover</h1>
                    <p>Browse services from independent freelancers.</p>
                </div>
            </header>

            <div className="search-row">
                <label className="search-box">
                    <Icon name="search" size={18} />
                    <input
                        type="search"
                        aria-label="Search gigs"
                        placeholder="Search services, skills, or creators"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>
            </div>

            <div className="category-row">
                {['All', ...CATEGORIES].map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={category === c ? 'selected' : ''}
                        onClick={() => setCategory(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {loading && <p>Loading gigs…</p>}
            {error && <p role="alert" style={{ color: 'var(--mauve-deep)' }}>{error}</p>}

            {!loading && !error && visible.length === 0 && (
                <div className="panel empty-state">
                    <span><Icon name="search" /></span>
                    <h3>No gigs found</h3>
                    <p>Try a different search or category.</p>
                </div>
            )}

            {visible.length > 0 && (
                <section className="service-grid">
                    {visible.map((gig) => (
                        <GigCard
                            key={gig._id}
                            gig={gig}
                            canBook={user?.role === 'Client'}
                            onBook={openBooking}
                        />
                    ))}
                </section>
            )}

            {selected && (
                <div className="modal-backdrop" onClick={closeBooking}>
                    <div
                        className="modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="book-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button type="button" className="modal-close" aria-label="Close" onClick={closeBooking}>×</button>
                        <span className="modal-icon"><Icon name="calendar" /></span>
                        <h2 id="book-title">Confirm booking</h2>
                        <p>
                            You are booking <strong>{selected.title}</strong> for{' '}
                            <strong>{formatRand(selected.price)}</strong>. This is a simulated payment,
                            so no money is taken.
                        </p>

                        {bookingError && (
                            <p role="alert" style={{ color: 'var(--mauve-deep)' }}>{bookingError}</p>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" className="primary-button" onClick={confirmBooking} disabled={booking}>
                                {booking ? 'Booking…' : 'Confirm booking'}
                            </button>
                            <button type="button" className="secondary-button" onClick={closeBooking} disabled={booking}>
                                Cancel
                            </button>
                        </div>
                        <div className="modal-secure"><Icon name="shield" size={13} /> Your booking and transaction details stay protected.</div>
                    </div>
                </div>
            )}

            {confirmation && (
                <div className="toast" role="status">
                    <span><Icon name="check" size={14} /></span>
                    <div>
                        <strong>Booking confirmed</strong>
                        <small>{confirmation.title} · {formatRand(confirmation.amount)} recorded</small>
                    </div>
                </div>
            )}
        </>
    );
}