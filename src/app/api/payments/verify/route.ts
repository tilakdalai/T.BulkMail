import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await extractUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await db.payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
    }

    if (payment.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify the payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'YourTestKeySecret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      // Mark payment as failed
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', razorpayPaymentId, razorpaySignature },
      });
      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    // Payment is valid - update payment record and upgrade user
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    // Upgrade user to premium
    await db.user.update({
      where: { id: currentUser.id },
      data: { isPremium: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully! Your account has been upgraded to Premium.',
      plan: payment.plan,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed. Please contact support.' },
      { status: 500 }
    );
  }
}
