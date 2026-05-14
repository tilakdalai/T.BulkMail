import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourTestKeySecret',
});

// Plan pricing in INR paise (1 INR = 100 paise)
const PLAN_PRICES: Record<string, number> = {
  PRO: 29900,       // ₹299/month
  ENTERPRISE: 99900, // ₹999/month
};

export async function POST(req: NextRequest) {
  try {
    const currentUser = await extractUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose PRO or ENTERPRISE.' },
        { status: 400 }
      );
    }

    const amount = PLAN_PRICES[plan];

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${currentUser.id.slice(0, 8)}`,
      notes: {
        userId: currentUser.id,
        plan,
        userEmail: currentUser.email,
      },
    });

    // Save payment record in database
    await db.payment.create({
      data: {
        userId: currentUser.id,
        razorpayOrderId: order.id,
        amount,
        currency: 'INR',
        plan,
        status: 'CREATED',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
      plan,
      userName: currentUser.name,
      userEmail: currentUser.email,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order. Please try again.' },
      { status: 500 }
    );
  }
}
