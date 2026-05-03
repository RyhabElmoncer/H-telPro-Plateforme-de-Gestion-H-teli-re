const axios = require('axios');

const N8N_BASE = process.env.N8N_BASE_URL || 'http://localhost:5678';

const triggerWebhook = async (url, data) => {
  try {
    await axios.post(url, data, { timeout: 5000 });
    console.log(`✅ n8n webhook triggered: ${url}`);
  } catch (err) {
    // Non-blocking: log but don't fail main operation
    console.warn(`⚠️ n8n webhook failed (${url}):`, err.message);
  }
};

exports.sendReservationConfirmation = async (reservation) => {
  const data = {
    event: 'reservation.created',
    reservation: {
      id: reservation._id,
      number: reservation.reservationNumber,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      total: reservation.pricing.total,
      currency: reservation.pricing.currency
    },
    client: {
      id: reservation.client._id,
      name: `${reservation.client.firstName} ${reservation.client.lastName}`,
      email: reservation.client.email
    },
    room: {
      number: reservation.room.number,
      name: reservation.room.name,
      type: reservation.room.type
    }
  };

  await triggerWebhook(
    process.env.N8N_WEBHOOK_RESERVATION || `${N8N_BASE}/webhook/reservation-confirmation`,
    data
  );
};

exports.sendCancellationNotification = async (reservation) => {
  await triggerWebhook(
    `${N8N_BASE}/webhook/reservation-cancelled`,
    {
      event: 'reservation.cancelled',
      reservationNumber: reservation.reservationNumber,
      clientEmail: reservation.client.email,
      clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
      reason: reservation.cancellationReason
    }
  );
};

exports.sendPaymentConfirmation = async (reservation, payment) => {
  await triggerWebhook(
    process.env.N8N_WEBHOOK_PAYMENT || `${N8N_BASE}/webhook/payment-confirmation`,
    {
      event: 'payment.completed',
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      reservationNumber: reservation.reservationNumber,
      clientEmail: reservation.client.email,
      clientName: `${reservation.client.firstName} ${reservation.client.lastName}`
    }
  );
};

exports.sendPromotion = async (clients, promo) => {
  await triggerWebhook(
    process.env.N8N_WEBHOOK_PROMO || `${N8N_BASE}/webhook/promotion`,
    {
      event: 'promotion.send',
      clients: clients.map(c => ({ email: c.email, name: `${c.firstName} ${c.lastName}` })),
      promotion: promo
    }
  );
};

exports.sendReminderNotification = async (reservation) => {
  await triggerWebhook(
    `${N8N_BASE}/webhook/check-in-reminder`,
    {
      event: 'checkin.reminder',
      reservationNumber: reservation.reservationNumber,
      checkIn: reservation.checkIn,
      clientEmail: reservation.client.email,
      clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
      roomName: reservation.room.name
    }
  );
};

exports.sendWebhook = async (type, data) => {
  const url = `${N8N_BASE}/webhook/hotel-${type}`;
  await triggerWebhook(url, data);
};
