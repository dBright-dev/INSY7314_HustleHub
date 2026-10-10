import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import IncomeSummary from '../pages/IncomeSummary';
import { apiRequest } from '../services/api';

vi.mock('../services/api', () => ({ apiRequest: vi.fn() }));

// Money is formatted with locale spaces/commas, so compare with whitespace removed.
const squash = (text) => text.replace(/\s/g, '');

const income = {
    success: true,
    data: {
        total: 7050,
        transactions: [
            { _id: 't1', amount: 4200, timestamp: '2026-06-16T10:00:00.000Z', client: { name: 'North & Tide Studio' } },
            { _id: 't2', amount: 2850, timestamp: '2026-06-12T10:00:00.000Z', client: { name: 'Lumen Coffee Co.' } },
        ],
    },
};

beforeEach(() => {
    apiRequest.mockReset();
});

describe('IncomeSummary', () => {
    it('displays the total income from the API', async () => {
        apiRequest.mockResolvedValue(income);
        render(<IncomeSummary />);

        const total = await screen.findByTestId('income-total');
        expect(squash(total.textContent)).toMatch(/^R7050[.,]00$/);
        expect(apiRequest).toHaveBeenCalledWith('/api/bookings/income');
    });

    it('lists the recent transactions with client and amount', async () => {
        apiRequest.mockResolvedValue(income);
        render(<IncomeSummary />);

        expect(await screen.findByText('North & Tide Studio')).toBeInTheDocument();
        expect(screen.getByText('Lumen Coffee Co.')).toBeInTheDocument();
        expect(screen.getByText((_, el) => el.tagName === 'STRONG' && /^\+R4200[.,]00$/.test(squash(el.textContent)))).toBeInTheDocument();
        expect(screen.getByText((_, el) => el.tagName === 'STRONG' && /^\+R2850[.,]00$/.test(squash(el.textContent)))).toBeInTheDocument();
    });

    it('shows R 0 and an empty message when there are no transactions', async () => {
        apiRequest.mockResolvedValue({ success: true, data: { total: 0, transactions: [] } });
        render(<IncomeSummary />);

        expect(squash((await screen.findByTestId('income-total')).textContent)).toMatch(/^R0[.,]00$/);
        expect(screen.getByText(/no income yet/i)).toBeInTheDocument();
    });

    it('shows an error message when the request fails', async () => {
        apiRequest.mockRejectedValue(new Error('Access denied'));
        render(<IncomeSummary />);
        expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    });
});