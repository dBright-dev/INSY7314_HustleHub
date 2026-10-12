/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: registration with role selection and password confirmation
 *   follows the INSY7314 registration requirements (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api', () => ({
    apiRequest: vi.fn(),
    saveAuth: vi.fn(),
    clearAuth: vi.fn(),
    getSavedUser: () => null,
    getToken: () => null,
}));

import { apiRequest } from '../services/api';

const renderRegister = () =>
    render(<MemoryRouter><AuthProvider><RegisterForm /></AuthProvider></MemoryRouter>);

describe('RegisterForm', () => {
    beforeEach(() => vi.clearAllMocks());

    test('shows error when passwords do not match', async () => {
        renderRegister();
        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'j@d.com' } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Different123!' } });
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
        expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
    });

    test('calls API on valid submit', async () => {
        apiRequest.mockResolvedValueOnce({ message: 'registered' });
        renderRegister();
        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'j@d.com' } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => expect(apiRequest).toHaveBeenCalled());
    });
});