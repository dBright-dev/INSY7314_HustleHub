import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookingCard from '../components/BookingCard';
import Icon from '../components/Icon';

// One page, two views: clients see the gigs they booked, freelancers see bookings made on their gigs.
export default function MyBookings() {
    const { user } = useAuth();
    const isFreelancer = user?.role === 'Freelancer';
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const path = isFreelancer ? '/api/bookings/incoming' : '/api/bookings/my-bookings';
        apiRequest(path)
            .then((res) => active && setBookings(res.data || []))
            .catch((err) => active && setError(err.message || 'Could not load bookings'))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [isFreelancer]);

    return (
        <>
            <header className="topbar">
                <div>
                    <h1>{isFreelancer ? 'Incoming bookings' : 'My bookings'}</h1>
                    <p>
                        {isFreelancer
                            ? 'Clients who have booked your gigs.'
                            : 'Every service you have booked.'}
                    </p>
                </div>
            </header>

            {loading && <p>Loading bookings…</p>}
            {error && <p role="alert" style={{ color: 'var(--mauve-deep)' }}>{error}</p>}

            {!loading && !error && bookings.length === 0 && (
                <div className="panel empty-state">
                    <span><Icon name="calendar" /></span>
                    <h3>No bookings yet</h3>
                    <p>{isFreelancer ? 'Bookings will appear here once clients book your gigs.' : 'Browse gigs to make your first booking.'}</p>
                </div>
            )}

            {bookings.length > 0 && (
                <section className="panel bookings-panel">
                    <div className="booking-list">
                        {bookings.map((b) => (
                            <BookingCard key={b._id} booking={b} viewAs={isFreelancer ? 'freelancer' : 'client'} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}