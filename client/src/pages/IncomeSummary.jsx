import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import Icon from '../components/Icon';
import { formatDate, formatRand } from '../utils/format';

export default function IncomeSummary() {
    const [income, setIncome] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        apiRequest('/api/bookings/income')
            .then((res) => active && setIncome(res.data))
            .catch((err) => active && setError(err.message || 'Could not load income'))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    const transactions = income?.transactions || [];

    return (
        <>
            <header className="topbar">
                <div>
                    <h1>Earnings</h1>
                    <p>Income from your bookings.</p>
                </div>
            </header>

            {loading && <p>Loading income…</p>}
            {error && <p role="alert" style={{ color: 'var(--mauve-deep)' }}>{error}</p>}

            {income && (
                <>
                    <section className="earnings-hero">
                        <div>
                            <span className="eyebrow">Total income</span>
                            <strong data-testid="income-total">{formatRand(income.total)}</strong>
                            <p>
                                {transactions.length} recent {transactions.length === 1 ? 'transaction' : 'transactions'}
                            </p>
                        </div>
                    </section>

                    <section className="panel transactions" style={{ marginTop: 20 }}>
                        <div className="section-heading">
                            <div>
                                <span className="eyebrow plain">Recent activity</span>
                                <h2>Transactions</h2>
                            </div>
                        </div>

                        {transactions.length === 0 ? (
                            <p style={{ color: 'var(--muted)' }}>No income yet. Bookings on your gigs will show up here.</p>
                        ) : (
                            transactions.map((t) => (
                                <div className="transaction-row" key={t._id}>
                                    <span className="transaction-icon"><Icon name="briefcase" size={16} /></span>
                                    <span>
                                        <strong>{t.client?.name || 'Client'}</strong>
                                        <small>{formatDate(t.timestamp)}</small>
                                    </span>
                                    <strong>+ {formatRand(t.amount)}</strong>
                                </div>
                            ))
                        )}
                    </section>
                </>
            )}
        </>
    );
}