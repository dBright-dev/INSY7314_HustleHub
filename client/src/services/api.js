const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

//needed for every protected request
export const getToken = () => sessionStorage.getItem('token');

//stores token + user after login
export const saveAuth = (token, user) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
};

//Rempoves token + user on logout
export const clearAuth = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
};

export const getSavedUser = () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const apiRequest = async (path, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
        });
    } catch (networkError) {
        throw new Error(`Cannot reach the API at ${API_URL}${path}. Is the backend running on port 4000? (${networkError.message})`);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const serverMessage = data.message || data.error || (Array.isArray(data.errors) ? data.errors.map((e) => e.message || e.msg).join(', ') : '');
        throw new Error(serverMessage || `Request failed (${response.status})`);
    }

    return data;
};