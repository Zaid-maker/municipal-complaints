import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

// Atomically increment a named counter and return the new value.
counterSchema.statics.next = async function next(name) {
    const counter = await this.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );

    return counter.seq;
};

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
