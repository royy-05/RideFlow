export const Calculate = async (req, res) => {
    try {
        const { pickup, drop } = req.body;

        if (!pickup || !drop) {
            return res.status(400).json({ error: "Pickup and drop locations are required" });
        }

        const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickup.lat},${pickup.lng}&destinations=${drop.lat},${drop.lng}&key=${process.env.GOOGLE_API_KEY}`);

        const data = await response.json();
        const element = data.rows[0].elements[0];
        if (element.status !== "OK") {
            return res.status(400).json({ error: "Invalid Route" });
        }
        const distance = element.distance.value;
        const duration = element.duration.value;

        const km = (distance / 1000)

        // Dynamic Surge Logic based on Server Time
        const currentHour = new Date().getHours();
        let surgeMultiplier = 1.0;
        let isSurge = false;
        let surgeReason = "";

        if (currentHour >= 22 || currentHour < 6) {
            // Night Surcharge
            surgeMultiplier = 1.3;
            isSurge = true;
            surgeReason = "Night Surcharge (10 PM - 6 AM)";
        } else if ((currentHour >= 9 && currentHour < 11) || (currentHour >= 17 && currentHour < 19)) {
            // Office Rush Hour Surcharge
            surgeMultiplier = 1.2;
            isSurge = true;
            surgeReason = "Office Rush Hour Surcharge";
        }

        // pricing
        const baseFare = 30;
        const rates = {
            bike: 10,
            mini: 15,
            sedan: 20,
            suv: 25,
        }
        const fare = {};

        for (let type in rates) {
            let price = (baseFare + km * rates[type]) * surgeMultiplier;
            if (price < 30) price = 30; // minimum fare
            fare[type] = Math.round(price);
        }

        res.json({ distance, duration, fare, isSurge, surgeMultiplier, surgeReason });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}