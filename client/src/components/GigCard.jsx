import Icon from './Icon';
import { formatRand } from '../utils/format';

export default function GigCard({ gig, onBook, canBook = true, actions }) {
    const name = gig.owner?.name || 'Freelancer';
    const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <article className="service-card">
            <div
                className="service-image"
                style={{ height: 96, background: 'linear-gradient(135deg, var(--sapphire), var(--sapphire-deep))' }}
            >
                <span className="service-tag">{gig.category}</span>
            </div>
            <div className="service-body">
                <div className="creator-row">
                    <span className="avatar small">{initials}</span>
                    <span><strong>{name}</strong></span>
                </div>
                <h3>{gig.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6, margin: '0 0 16px' }}>
                    {gig.description}
                </p>
            </div>
            <div className="service-footer">
                <span>From <strong>{formatRand(gig.price, 0)}</strong></span>
                {canBook && onBook && (
                    <button type="button" onClick={() => onBook(gig)}>
                        Book <Icon name="arrow" size={14} />
                    </button>
                )}
            </div>
            {actions && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
                    {actions}
                </div>
            )}
        </article>
    );
}