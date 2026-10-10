import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import GigCard from '../components/GigCard';
import GigForm from '../components/GigForm';
import Icon from '../components/Icon';

const linkButton = {
    border: 0,
    background: 'none',
    padding: 0,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--sapphire)',
    cursor: 'pointer',
};

export default function MyGigs() {
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null); // null | 'new' | gig object
    const [deletingId, setDeletingId] = useState(null);
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await apiRequest('/api/gigs/my-gigs');
            setGigs(res.data || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Could not load your gigs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // GigForm shows any error thrown here, so we do not catch it.
    const handleSave = async (values) => {
        if (editing === 'new') {
            await apiRequest('/api/gigs', { method: 'POST', body: JSON.stringify(values) });
            setNotice('Gig created.');
        } else {
            await apiRequest(`/api/gigs/${editing._id}`, { method: 'PUT', body: JSON.stringify(values) });
            setNotice('Gig updated.');
        }
        setEditing(null);
        await load();
    };

    const handleDelete = async (id) => {
        try {
            await apiRequest(`/api/gigs/${id}`, { method: 'DELETE' });
            setGigs((list) => list.filter((g) => g._id !== id));
            setNotice('Gig deleted.');
        } catch (err) {
            setError(err.message || 'Could not delete the gig');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <header className="topbar">
                <div>
                    <h1>My gigs</h1>
                    <p>Create and manage the services you offer.</p>
                </div>
                {!editing && (
                    <button type="button" className="primary-button" onClick={() => { setNotice(''); setEditing('new'); }}>
                        <Icon name="plus" size={16} /> New gig
                    </button>
                )}
            </header>

            {notice && <p role="status" style={{ color: 'var(--green)' }}>{notice}</p>}
            {error && <p role="alert" style={{ color: 'var(--mauve-deep)' }}>{error}</p>}

            {editing && (
                <section style={{ marginBottom: 24 }}>
                    <h2 style={{ fontFamily: 'Playfair Display, serif' }}>
                        {editing === 'new' ? 'Create a gig' : 'Edit gig'}
                    </h2>
                    <GigForm
                        initialValues={editing === 'new' ? undefined : editing}
                        submitLabel={editing === 'new' ? 'Create gig' : 'Update gig'}
                        onSubmit={handleSave}
                        onCancel={() => setEditing(null)}
                    />
                </section>
            )}

            {loading && <p>Loading your gigs…</p>}

            {!loading && gigs.length === 0 && !error && (
                <div className="panel empty-state">
                    <span><Icon name="briefcase" /></span>
                    <h3>No gigs yet</h3>
                    <p>Create your first gig so clients can find you.</p>
                </div>
            )}

            {gigs.length > 0 && (
                <section className="service-grid">
                    {gigs.map((gig) => (
                        <GigCard
                            key={gig._id}
                            gig={gig}
                            canBook={false}
                            actions={
                                deletingId === gig._id ? (
                                    <>
                                        <span style={{ fontSize: 11 }}>Delete this gig?</span>
                                        <button type="button" style={{ ...linkButton, color: 'var(--mauve-deep)' }} onClick={() => handleDelete(gig._id)}>
                                            Yes, delete
                                        </button>
                                        <button type="button" style={linkButton} onClick={() => setDeletingId(null)}>
                                            Keep
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" style={linkButton} onClick={() => { setNotice(''); setEditing(gig); }}>
                                            Edit
                                        </button>
                                        <button type="button" style={{ ...linkButton, color: 'var(--mauve-deep)' }} onClick={() => setDeletingId(gig._id)}>
                                            Delete
                                        </button>
                                    </>
                                )
                            }
                        />
                    ))}
                </section>
            )}
        </>
    );
}