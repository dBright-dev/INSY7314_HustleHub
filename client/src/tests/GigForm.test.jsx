import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import GigForm, { validateGig } from '../components/GigForm';

const valid = {
    title: 'Logo design',
    description: 'A full logo pack with three revisions',
    category: 'Design',
    price: '250',
};

async function fillForm(values = valid) {
    await userEvent.type(screen.getByLabelText('Title'), values.title);
    await userEvent.type(screen.getByLabelText('Description'), values.description);
    await userEvent.selectOptions(screen.getByLabelText('Category'), values.category);
    await userEvent.type(screen.getByLabelText('Price (R)'), values.price);
}

describe('validateGig', () => {
    it('returns no errors for valid values', () => {
        expect(validateGig(valid)).toEqual({});
    });

    it('flags short title, short description, missing category and bad price', () => {
        const errors = validateGig({ title: 'ab', description: 'short', category: '', price: '0' });
        expect(Object.keys(errors).sort()).toEqual(['category', 'description', 'price', 'title']);
    });

    it('rejects negative, empty and excessive prices', () => {
        expect(validateGig({ ...valid, price: '-5' }).price).toBeDefined();
        expect(validateGig({ ...valid, price: '' }).price).toBeDefined();
        expect(validateGig({ ...valid, price: '2000000' }).price).toBeDefined();
    });

    it('ignores surrounding whitespace when checking lengths', () => {
        expect(validateGig({ ...valid, title: '   a   ' }).title).toBeDefined();
    });
});

describe('GigForm', () => {
    it('renders all fields and the submit button', () => {
        render(<GigForm onSubmit={() => {}} />);
        expect(screen.getByLabelText('Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Category')).toBeInTheDocument();
        expect(screen.getByLabelText('Price (R)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save gig' })).toBeInTheDocument();
    });

    it('shows validation errors and does not submit an empty form', async () => {
        const onSubmit = vi.fn();
        render(<GigForm onSubmit={onSubmit} />);
        await userEvent.click(screen.getByRole('button', { name: 'Save gig' }));

        expect(screen.getByText('Title must be between 3 and 100 characters')).toBeInTheDocument();
        expect(screen.getByText('Please choose a category')).toBeInTheDocument();
        expect(screen.getByText('Enter a price greater than 0')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits trimmed text and a numeric price when valid', async () => {
        const onSubmit = vi.fn().mockResolvedValue({});
        render(<GigForm onSubmit={onSubmit} />);
        await fillForm({ ...valid, title: '  Logo design  ' });
        await userEvent.click(screen.getByRole('button', { name: 'Save gig' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({
            title: 'Logo design',
            description: valid.description,
            category: 'Design',
            price: 250,
        });
    });

    it('pre-fills the fields when editing an existing gig', () => {
        render(
            <GigForm
                submitLabel="Update gig"
                onSubmit={() => {}}
                initialValues={{ ...valid, price: 250 }}
            />
        );
        expect(screen.getByLabelText('Title')).toHaveValue('Logo design');
        expect(screen.getByLabelText('Category')).toHaveValue('Design');
        expect(screen.getByLabelText('Price (R)')).toHaveValue(250);
        expect(screen.getByRole('button', { name: 'Update gig' })).toBeInTheDocument();
    });

    it('shows the error message when the API call fails', async () => {
        const onSubmit = vi.fn().mockRejectedValue(new Error('Gig could not be saved'));
        render(<GigForm onSubmit={onSubmit} />);
        await fillForm();
        await userEvent.click(screen.getByRole('button', { name: 'Save gig' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Gig could not be saved');
        expect(screen.getByRole('button', { name: 'Save gig' })).toBeEnabled();
    });

    it('calls onCancel when Cancel is clicked', async () => {
        const onCancel = vi.fn();
        render(<GigForm onSubmit={() => {}} onCancel={onCancel} />);
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onCancel).toHaveBeenCalled();
    });
});