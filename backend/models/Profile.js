import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    age:          { type: Number, required: true, min: 18, max: 80 },
    gender:       { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    religion:     { type: String, trim: true, default: '' },
    caste:        { type: String, trim: true, default: '' },
    education:    { type: String, trim: true, default: '' },
    occupation:   { type: String, trim: true, default: '' },
    location:     { type: String, trim: true, default: '' },
    height:       { type: String, trim: true, default: '' },
    about:        { type: String, trim: true, default: '' },
    dateOfBirth:   { type: String, trim: true, default: '' },
    timeOfBirth:   { type: String, trim: true, default: '' },
    birthLocation: { type: String, trim: true, default: '' },
    images:       { type: [imageSchema], default: [] },
    patrikaImage: { type: imageSchema, default: undefined },
    isLiked:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Profile', profileSchema);
