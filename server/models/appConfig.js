import mongoose from 'mongoose';

const Schema = mongoose.Schema;
/**
 * AppConfig Schema
 */
const AppConfigSchema = new mongoose.Schema({
  type: { type: Schema.Types.Mixed },
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed },
});

export default mongoose.model('AppConfig', AppConfigSchema);
