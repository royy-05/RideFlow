import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DriverSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, "Invalid email"],
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        match: [/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, "Password must contain letters and numbers"]
    },
    phone: {
        type: String,
        required: true,
        match: [/^[0-9]{10,15}$/, "Invalid phone number"]
    },
    vehicle: {
        type: {
            type: String,
            enum: ["bike", "mini", "sedan", "suv"],
            required: true
        },
        plateNumber: {
            type: String,
            required: true,
           match: [/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, "Invalid Vehicle Number"],
            trim: true,
            uppercase: true
        }
    },
    status: {
        type: String,
        enum: ["online", "offline", "busy"],
        default: "offline"
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
             default: [0, 0],
            validate: {
                validator: function (v) {
                    return (
                        Array.isArray(v) &&
                        v.length === 2 &&
                        typeof v[0] === "number" &&
                        typeof v[1] === "number"
                    );
                },
                message: "Coordinates must be [lng, lat]"
            }
        },
        address: String
    }
}, { timestamps: true })
DriverSchema.pre('save', async function () {
    if (!this.isModified("password")) return;

    const hashedpassword = await bcrypt.hash(this.password, 10);
    this.password = hashedpassword;
})
DriverSchema.methods.Comparepassword = async function (entertedPassword) {
    return await bcrypt.compare(entertedPassword, this.password)
}
DriverSchema.index({ location: "2dsphere" })
export default mongoose.model("Driver", DriverSchema)