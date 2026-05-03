const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Le numéro de chambre est requis'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Le type de chambre est requis'],
    enum: ['simple', 'double', 'double_superieure', 'suite', 'suite_presidentielle', 'familiale', 'penthouse'],
    default: 'simple'
  },
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  floor: {
    type: Number,
    required: true,
    min: 0
  },
  capacity: {
    adults: { type: Number, required: true, min: 1, default: 2 },
    children: { type: Number, default: 0 }
  },
  price: {
    perNight: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EUR' }
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'tv', 'minibar', 'jacuzzi', 'balcony', 'sea_view', 'pool_view', 'air_conditioning', 'safe', 'coffee_maker', 'bathrobe', 'hair_dryer', 'parking', 'room_service', 'gym_access']
  }],
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'cleaning'],
    default: 'available'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  size: {
    type: Number, // in m²
    min: 0
  },
  bedType: {
    type: String,
    enum: ['single', 'double', 'queen', 'king', 'twin', 'sofa_bed']
  },
  smokingAllowed: {
    type: Boolean,
    default: false
  },
  petsAllowed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: primary image
roomSchema.virtual('primaryImage').get(function () {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Index for search
roomSchema.index({ type: 1, 'price.perNight': 1 });
roomSchema.index({ isArchived: 1, status: 1 });

module.exports = mongoose.model('Room', roomSchema);
