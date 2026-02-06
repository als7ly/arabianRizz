import { render, screen } from '@testing-library/react';
import SubscriptionStatus from '@/components/shared/SubscriptionStatus';
import { format } from 'date-fns';

describe('SubscriptionStatus', () => {
  it('renders "Active Subscription" and renewal date when user is subscribed and has period end', () => {
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 10);
    // User object usually comes from JSON serialization so date is string
    const user = {
      planId: 2,
      subscriptionPeriodEnd: renewalDate.toISOString(),
    };

    render(<SubscriptionStatus user={user} />);

    expect(screen.getByText('Active Subscription')).toBeInTheDocument();
    expect(screen.getByText(`Renews on ${format(renewalDate, "MMM dd, yyyy")}`)).toBeInTheDocument();
  });

  it('renders "Active Subscription" without date when user is subscribed but no period end', () => {
    const user = {
      planId: 2,
      subscriptionPeriodEnd: null,
    };

    render(<SubscriptionStatus user={user} />);

    expect(screen.getByText('Active Subscription')).toBeInTheDocument();
    expect(screen.queryByText(/Renews on/)).not.toBeInTheDocument();
  });

  it('renders "Free Tier" when user is not subscribed', () => {
    const user = {
      planId: 1,
    };

    render(<SubscriptionStatus user={user} />);

    expect(screen.getByText('Free Tier')).toBeInTheDocument();
    expect(screen.queryByText('Active Subscription')).not.toBeInTheDocument();
  });
});
