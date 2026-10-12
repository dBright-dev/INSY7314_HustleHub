/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: role-based sidebar links (Client vs Freelancer menus) mirror the
 *   INSY7314 RBAC requirements for the UI (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthProvider } from '../context/AuthContext';

// vi.mock is hoisted above imports, so the role must come from vi.hoisted
// to avoid "Cannot access before initialization". Sidebar and AuthProvider
// are statically imported so they share ONE AuthContext module instance —
// the previous resetModules()/dynamic-import approach split them across
// two instances and useAuth() threw "must be used inside AuthProvider".
const authState = vi.hoisted(() => ({ role: 'Freelancer' }));

vi.mock('../services/api', () => ({
    apiRequest: vi.fn(),
    saveAuth: vi.fn(),
    clearAuth: vi.fn(),
    getSavedUser: () => ({ name: 'Test User', role: authState.role, email: 't@e.com' }),
    getToken: () => 'tok',
}));

describe('Sidebar role-based links', () => {
    test('Freelancer sees My Gigs and Earnings', async () => {
        authState.role = 'Freelancer';
        render(<MemoryRouter><AuthProvider><Sidebar /></AuthProvider></MemoryRouter>);
        expect(await screen.findByText(/my gigs/i)).toBeInTheDocument();
        expect(screen.getByText(/earnings/i)).toBeInTheDocument();
    });

    test('Client sees Browse Gigs and Bookings', async () => {
        authState.role = 'Client';
        render(<MemoryRouter><AuthProvider><Sidebar /></AuthProvider></MemoryRouter>);
        expect(await screen.findByText(/discover/i)).toBeInTheDocument();
        expect(screen.getByText(/bookings/i)).toBeInTheDocument();
    });
});