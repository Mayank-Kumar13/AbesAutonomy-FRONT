/**
 * Dynamically loads the official Razorpay Checkout SDK.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Opens Razorpay Checkout modal for a given order.
 * 
 * @param {object} orderDetails - { orderId, amount, currency, keyId, plan }
 * @param {object} user - { name, email, mobile }
 * @returns {Promise<{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }>}
 */
export const openRazorpayCheckout = async (orderDetails, user = {}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Could not load Razorpay payment gateway. Please check your internet connection and try again.');
  }

  return new Promise((resolve, reject) => {
    const key =
      orderDetails.keyId ||
      import.meta.env.VITE_RAZORPAY_KEY_ID ||
      import.meta.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      '';

    const options = {
      key,
      amount: orderDetails.amount,
      currency: orderDetails.currency || 'INR',
      name: 'ABES Autonomy',
      description: orderDetails.plan?.name || 'ABES Autonomy Premium Subscription',
      image: '/IMAGES/ABES_LOGO.svg',
      order_id: orderDetails.orderId,
      prefill: {
        name: user.name || '',
        email: user.email || '',
        contact: user.mobile || '',
      },
      theme: {
        color: '#C5AC86', // ABES Autonomy signature gold
        backdrop_color: '#080a0e',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user.'));
        },
      },
      handler: function (response) {
        resolve({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (response) {
      reject(new Error(response.error?.description || 'Payment transaction failed.'));
    });

    rzp.open();
  });
};
