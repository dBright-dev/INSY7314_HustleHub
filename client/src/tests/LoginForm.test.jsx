/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: login form submission and generic error display follow the
 *   INSY7314 authentication guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api', () => ({
    apiRequest: vi.fn(),
    saveAuth: vi.fn(),
    clearAuth: vi.fn(),
    getSavedUser: () => null,
    getToken: () => null,
}));

import { apiRequest } from '../services/api';

const renderLogin = () =>
    render(
        <MemoryRouter>
            <AuthProvider>
                <LoginForm />
            </AuthProvider>
        </MemoryRouter>
    );

describe('LoginForm', () => {
    beforeEach(() => vi.clearAllMocks());

    test('renders email, password and submit button', () => {
        renderLogin();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('shows validation error when fields are empty', async () => {
        renderLogin();
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(await screen.findByRole('alert')).toHaveTextContent(/required/i);
    });

    test('calls API on valid submit', async () => {
        apiRequest.mockResolvedValueOnce({
            data: { token: 'fake', user: { name: 'A', role: 'Client', email: 'a@b.c' } },
        });
        renderLogin();

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() =>
            expect(apiRequest).toHaveBeenCalledWith(
                '/api/auth/login',
                expect.objectContaining({ method: 'POST' })
            )
        );
    });
});