const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Room = require('../models/Room');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_platform');
  console.log('✅ Connected to MongoDB');

  // Clear collections
  await User.deleteMany({});
  await Room.deleteMany({});
  console.log('🗑️  Cleared collections');

  // Create admin
  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'Hôtel',
    email: 'admin@hotel.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '+33 1 23 45 67 89'
  });

  // Create receptionist
  await User.create({
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'receptionist@hotel.com',
    password: 'Recep@123',
    role: 'receptionist',
    phone: '+33 1 23 45 67 90',
    permissions: {
      canManageRooms: false,
      canManageReservations: true,
      canViewDashboard: true,
      canManagePayments: true
    }
  });

  // Create clients
  await User.create([
    { firstName: 'Jean', lastName: 'Martin', email: 'jean@client.com', password: 'Client@123', role: 'client', phone: '+33 6 12 34 56 78' },
    { firstName: 'Sophie', lastName: 'Bernard', email: 'sophie@client.com', password: 'Client@123', role: 'client', phone: '+33 6 87 65 43 21' }
  ]);

  // Create rooms
  const rooms = [
    {
      number: '101', type: 'simple', name: 'Chambre Confort', floor: 1,
      description: 'Chambre simple confortable avec vue sur le jardin.',
      capacity: { adults: 1, children: 0 }, price: { perNight: 89 },
      amenities: ['wifi', 'tv', 'air_conditioning', 'hair_dryer'],
      status: 'available', size: 20, bedType: 'single'
    },
    {
      number: '201', type: 'double', name: 'Chambre Double Standard', floor: 2,
      description: 'Spacieuse chambre double avec grand lit et salle de bain moderne.',
      capacity: { adults: 2, children: 1 }, price: { perNight: 149 },
      amenities: ['wifi', 'tv', 'air_conditioning', 'minibar', 'safe', 'hair_dryer'],
      status: 'available', size: 32, bedType: 'double'
    },
    {
      number: '301', type: 'double_superieure', name: 'Chambre Double Supérieure', floor: 3,
      description: 'Chambre élégante avec vue panoramique et équipements haut de gamme.',
      capacity: { adults: 2, children: 1 }, price: { perNight: 199 },
      amenities: ['wifi', 'tv', 'air_conditioning', 'minibar', 'safe', 'coffee_maker', 'bathrobe', 'hair_dryer', 'balcony'],
      status: 'available', size: 40, bedType: 'queen'
    },
    {
      number: '401', type: 'suite', name: 'Suite Prestige', floor: 4,
      description: 'Suite luxueuse avec salon séparé, jacuzzi et vue mer.',
      capacity: { adults: 2, children: 2 }, price: { perNight: 349 },
      amenities: ['wifi', 'tv', 'air_conditioning', 'minibar', 'jacuzzi', 'safe', 'coffee_maker', 'bathrobe', 'hair_dryer', 'sea_view', 'room_service'],
      status: 'available', size: 65, bedType: 'king'
    },
    {
      number: '501', type: 'familiale', name: 'Suite Familiale', floor: 5,
      description: 'Suite spacieuse idéale pour les familles avec 2 chambres.',
      capacity: { adults: 4, children: 3 }, price: { perNight: 279 },
      amenities: ['wifi', 'tv', 'air_conditioning', 'minibar', 'safe', 'coffee_maker', 'hair_dryer'],
      status: 'available', size: 80, bedType: 'twin'
    },
    {
      number: '601', type: 'penthouse', name: 'Penthouse Royal', floor: 6,
      description: 'Penthouse exceptionnel avec terrasse privée et vue 360°.',
      capacity: { adults: 4, children: 2 }, price: { perNight: 890 },
      amenities: ['wifi', 'tv', 'air_conditioning', 'minibar', 'jacuzzi', 'safe', 'coffee_maker', 'bathrobe', 'hair_dryer', 'sea_view', 'pool_view', 'room_service', 'gym_access', 'balcony'],
      status: 'available', size: 150, bedType: 'king'
    }
  ];

  await Room.create(rooms);
  console.log('✅ Seed completed!');
  console.log('\n📋 Comptes créés:');
  console.log('  Admin:        admin@hotel.com / Admin@123');
  console.log('  Réceptionniste: receptionist@hotel.com / Recep@123');
  console.log('  Client 1:     jean@client.com / Client@123');
  console.log('  Client 2:     sophie@client.com / Client@123');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
