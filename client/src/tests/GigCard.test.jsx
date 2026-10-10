import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import GigCard from '../components/GigCard';

const gig = {
    _id: 'g1',
    title: 'Brand identity',
    description: 'Logo and style guide',
    category: 'Design',
    price: 180,
    owner: { name: 'Maya Chen' },
};

describe('GigCard', () => {
    it('renders gig details', () => {
        render(<GigCard gig={gig} onBook={() => {}} />);
        expect(screen.getByText('Brand identity')).toBeInTheDocument();
        expect(screen.getByText('Logo and style guide')).toBeInTheDocument();
        expect(screen.getByText('Maya Chen')).toBeInTheDocument();
        expect(screen.getByText('Design')).toBeInTheDocument();
        expect(screen.getByText(/180/)).toBeInTheDocument();
    });

    it('calls onBook with the gig when Book is clicked', async () => {
        const onBook = vi.fn();
        render(<GigCard gig={gig} onBook={onBook} />);
        await userEvent.click(screen.getByRole('button', { name: /book/i }));
        expect(onBook).toHaveBeenCalledWith(gig);
    });

    it('hides the Book button when canBook is false', () => {
        render(<GigCard gig={gig} canBook={false} />);
        expect(screen.queryByRole('button', { name: /book/i })).toBeNull();
    });

    it('falls back to a default name when the owner is missing', () => {
        render(<GigCard gig={{ ...gig, owner: undefined }} onBook={() => {}} />);
        expect(screen.getByText('Freelancer')).toBeInTheDocument();
    });

    it('renders markup in text fields as plain text, not HTML', () => {
        const evil = { ...gig, title: '<img src=x onerror=alert(1)>' };
        const { container } = render(<GigCard gig={evil} onBook={() => {}} />);
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    });
});