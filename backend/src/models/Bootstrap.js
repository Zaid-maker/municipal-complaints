import mongoose from "mongoose";

const bootstrapSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

const Bootstrap = mongoose.model("Bootstrap", bootstrapSchema);

export default Bootstrap;
