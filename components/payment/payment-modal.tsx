'use client';

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

// Initialize Stripe outside of component to avoid recreating it
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface PaymentModalProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  price: number;
}

const CheckoutForm = ({ onSuccess, onCancel, price }: Omit<PaymentModalProps, 'clientSecret'>) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // This might not be used if we handle redirect manually or use redirect: 'if_required'
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Call backend to verify (although webhook is better, we do manual check here for simplicity as per plan)
      // Actually, the plan said: "Manual Verification endpoint (/payments/verify) called by frontend"
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/payments/verify`, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${localStorage.getItem('vu:accessToken')}` 
             },
             body: JSON.stringify({ paymentIntentId: paymentIntent.id })
        });
        
        if (!res.ok) throw new Error('Verification failed');
        
        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Payment verification failed');
        setIsLoading(false);
      }
    } else {
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="text-xl font-bold mb-4">Pay ${(price).toFixed(2)}</div>
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Pay'}
        </button>
      </div>
    </form>
  );
};

export const PaymentModal = ({
  clientSecret,
  onSuccess,
  onCancel,
  price,
}: PaymentModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Secure Checkout</h2>
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} price={price} />
          </Elements>
        )}
      </div>
    </div>
  );
};
