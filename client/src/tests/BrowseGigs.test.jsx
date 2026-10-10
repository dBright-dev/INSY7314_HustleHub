import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import BrowseGigs from '../pages/BrowseGigs';
import { apiRequest } from '../services/api';

const auth = vi.hoisted(() => ({ user: null }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock('../services/api', () => ({ apiRequest: vi.fn() }));

const gigs = [
    { _id: 'g1', title: 'Brand identity', description: 'Logo and style guide', category: 'Design', price: 180, owner: { name: 'Maya Chen' } },
    { _id: 'g2', title: 'Conversion-focused website', description: 'Landing page build', category: 'Development', price: 320, owner: { name: 'Jordan Brooks' } },
];

function mockApi({ list = gigs, bookingError } = {}) {
    apiRequest.mockImplementation((path, options) => {
        if (path === '/api/gigs') return Promise.resolve({ success: true, data: list });
        if (path === '/api/bookings' && options?.method === 'POST') {
            return bookingError ? Promise.reject(new Error(bookingError)) : Promise.resolve({ success: true, data: {} });
        }
        return Promise.reject(new Error('Unexpected request'));
    });
}

beforeEach(() => {
    apiRequest.mockReset();
    auth.user = { name: 'Lumen Coffee', role: 'Client' };
});

describe('BrowseGigs', () => {
    it('shows a loading message, then fetches and renders the gigs', async () => {
        mockApi();
        render(<BrowseGigs />);
        expect(screen.getByText(/loading gigs/i)).toBeInTheDocument();

        expect(await screen.findByText('Brand identity')).toBeInTheDocument();
        expect(screen.getByText('Conversion-focused website')).toBeInTheDocument();
        expect(apiRequest).toHaveBeenCalledWith('/api/gigs');
        expect(screen.getAllByRole('button', { name: /^book/i })).toHaveLength(2);
    });

    it('shows an error message when the gigs cannot be loaded', async () => {
        apiRequest.mockRejectedValue(new Error('Could not reach the server'));
        render(<BrowseGigs />);
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');
    });

    it('shows an empty state when there are no gigs', async () => {
        mockApi({ list: [] });
        render(<BrowseGigs />);
        expect(await screen.findByText('No gigs found')).toBeInTheDocument();
    });

    it('filters gigs by search text', async () => {
        mockApi();
        render(<BrowseGigs />);
        await screen.findByText('Brand identity');

        await userEvent.type(screen.getByLabelText('Search gigs'), 'website');
        expect(screen.queryByText('Brand identity')).toBeNull();
        expect(screen.getByText('Conversion-focused website')).toBeInTheDocument();
    });

    it('filters gigs by category', async () => {
        mockApi();
        render(<BrowseGigs />);
        await screen.findByText('Brand identity');

        await userEvent.click(screen.getByRole('button', { name: 'Development' }));
        expect(screen.queryByText('Brand identity')).toBeNull();
        expect(screen.getByText('Conversion-focused website')).toBeInTheDocument();
    });

    it('asks for confirmation, then books the gig', async () => {
        mockApi();
        render(<BrowseGigs />);
        await screen.findByText('Brand identity');

        await userEvent.click(screen.getAllByRole('button', { name: /^book/i })[0]);
        expect(screen.getByRole('dialog')).toHaveTextContent('Brand identity');
        expect(apiRequest).not.toHaveBeenCalledWith('/api/bookings', expect.anything());

        await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

        await waitFor(() =>
            expect(apiRequest).toHaveBeenCalledWith('/api/bookings', {
                method: 'POST',
                body: JSON.stringify({ gig: 'g1' }),
            })
        );
        expect(await screen.findByText('Booking confirmed')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('does not book when the confirmation is cancelled', async () => {
        mockApi();
        render(<BrowseGigs />);
        await screen.findByText('Brand identity');

        await userEvent.click(screen.getAllByRole('button', { name: /^book/i })[0]);
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByRole('dialog')).toBeNull();
        expect(apiRequest).not.toHaveBeenCalledWith('/api/bookings', expect.anything());
    });

    it('shows the API error inside the dialog when booking fails', async () => {
        mockApi({ bookingError: 'You cannot book your own gig' });
        render(<BrowseGigs />);
        await screen.findByText('Brand identity');

        await userEvent.click(screen.getAllByRole('button', { name: /^book/i })[0]);
        await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('You cannot book your own gig');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('hides the Book buttons for freelancers', async () => {
        auth.user = { name: 'Sienna Miles', role: 'Freelancer' };
        mockApi();
        render(<BrowseGigs />);
        await screen.findByText('Brand identity');
        expect(screen.queryByRole('button', { name: /^book/i })).toBeNull();
    });
});