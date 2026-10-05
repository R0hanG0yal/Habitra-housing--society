import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Field';

describe('UI Core Components', () => {
  it('renders StatCard with label, value, hint, and trend indicator', () => {
    render(
      <StatCard
        label="Monthly Maintenance Dues"
        value="₹4,85,000"
        hint="94% collection rate"
        trend={{ value: "+8.2% vs last month", direction: "up" }}
      />
    );

    expect(screen.getByText('Monthly Maintenance Dues')).toBeInTheDocument();
    expect(screen.getByText('₹4,85,000')).toBeInTheDocument();
    expect(screen.getByText('94% collection rate')).toBeInTheDocument();
    expect(screen.getByText('+8.2% vs last month')).toBeInTheDocument();
  });

  it('renders Badge and StatusBadge variants', () => {
    const { rerender } = render(<Badge tone="success">Verified Active</Badge>);
    expect(screen.getByText('Verified Active')).toBeInTheDocument();

    rerender(<StatusBadge status="paid" />);
    expect(screen.getByText('Paid')).toBeInTheDocument();

    rerender(<StatusBadge status="overdue" />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders Button with variants and handles click events', async () => {
    let clicked = false;
    render(
      <Button variant="primary" onClick={() => { clicked = true; }}>
        Submit Application
      </Button>
    );

    const btn = screen.getByRole('button', { name: /Submit Application/i });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(clicked).toBe(true);
  });

  it('renders Field with Label, error and Input', () => {
    render(
      <Field label="Apartment Number" error="Flat number is required" required>
        <Input placeholder="e.g. 402" />
      </Field>
    );

    expect(screen.getByText(/Apartment Number/i)).toBeInTheDocument();
    expect(screen.getByText('Flat number is required')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 402')).toBeInTheDocument();
  });
});
