import { useState } from 'react';

export const CATEGORIES = ['Design', 'Development', 'Marketing', 'Writing', 'Business'];

// Pure function so it can be unit tested without rendering anything.
export function validateGig(values) {
    const errors = {};
    const title = values.title.trim();
    const description = values.description.trim();
    const price = Number(values.price);

    if (title.length < 3 || title.length > 100) {
        errors.title = 'Title must be between 3 and 100 characters';
    }
    if (description.length < 10 || description.length > 1000) {
        errors.description = 'Description must be between 10 and 1000 characters';
    }
    if (!CATEGORIES.includes(values.category)) {
        errors.category = 'Please choose a category';
    }
    if (values.price === '' || !Number.isFinite(price) || price <= 0) {
        errors.price = 'Enter a price greater than 0';
    } else if (price > 1000000) {
        errors.price = 'Price cannot exceed R 1 000 000';
    }
    return errors;
}

const inputStyle = {
    display: 'block',
    width: '100%',
    marginTop: 7,
    border: '1px solid var(--line)',
    background: 'white',
    borderRadius: 9,
    padding: 11,
    color: 'var(--ink)',
    font: 'inherit',
};

export default function GigForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save gig' }) {
    const [values, setValues] = useState(() => ({
        title: initialValues?.title ?? '',
        description: initialValues?.description ?? '',
        category: initialValues?.category ?? '',
        price: initialValues?.price != null ? String(initialValues.price) : '',
    }));
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((v) => ({ ...v, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const found = validateGig(values);
        setErrors(found);
        setSubmitError('');
        if (Object.keys(found).length > 0) return;

        setSubmitting(true);
        try {
            await onSubmit({
                title: values.title.trim(),
                description: values.description.trim(),
                category: values.category,
                price: Number(values.price),
            });
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const field = (name, label, input) => (
        <div style={{ marginBottom: 16 }}>
            <label className="field-label" htmlFor={name}>{label}</label>
            {input}
            {errors[name] && (
                <small id={`${name}-error`} style={{ color: 'var(--mauve-deep)' }}>{errors[name]}</small>
            )}
        </div>
    );

    const common = (name) => ({
        id: name,
        name,
        style: inputStyle,
        value: values[name],
        onChange: handleChange,
        'aria-invalid': Boolean(errors[name]),
        'aria-describedby': errors[name] ? `${name}-error` : undefined,
    });

    return (
        <form onSubmit={handleSubmit} noValidate className="panel">
            {field('title', 'Title', <input type="text" maxLength={100} {...common('title')} />)}
            {field('description', 'Description', <textarea rows={4} maxLength={1000} {...common('description')} />)}
            {field('category', 'Category', (
                <select {...common('category')}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            ))}
            {field('price', 'Price (R)', <input type="number" min="0" step="0.01" {...common('price')} />)}

            {submitError && (
                <p role="alert" style={{ color: 'var(--mauve-deep)', margin: '12px 0' }}>
                    {submitError}
                </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="primary-button" disabled={submitting}>
                    {submitting ? 'Saving…' : submitLabel}
                </button>
                {onCancel && (
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}