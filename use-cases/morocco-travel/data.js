/**
 * Morocco Travel — Use Case Data
 * Tours, FAQ answers, and keyword triggers.
 */

const TOURS = {
    desert: {
        id: "desert-tour",
        name: "Sahara Desert Tour",
        price: "200€",
        duration: "3 days / 2 nights",
        description: "Ride camels, sleep under the stars in the Sahara.",
        includes: ["Transport", "Accommodation", "Meals", "Guide"],
    },
    marrakech: {
        id: "marrakech-tour",
        name: "Marrakech City Tour",
        price: "80€",
        duration: "1 day",
        description: "Explore the Medina, souks, and Jemaa el-Fna square.",
        includes: ["Guided walk", "Lunch", "Transport"],
    },
    fes: {
        id: "fes-tour",
        name: "Fes Cultural Tour",
        price: "120€",
        duration: "2 days / 1 night",
        description: "Ancient Medina, tanneries, and Moroccan heritage.",
        includes: ["Hotel", "Breakfast", "Guide"],
    },
    family: {
        id: "family-tour",
        name: "Family Morocco Explorer",
        price: "350€",
        duration: "5 days / 4 nights",
        description: "A complete family adventure across Morocco.",
        includes: ["Transport", "Hotels", "Meals", "Activities", "Guide"],
    },
    chefchaouen: {
        id: "blue-city-tour",
        name: "Chefchaouen Blue City Tour",
        price: "100€",
        duration: "2 days / 1 night",
        description: "The magical blue city of Chefchaouen.",
        includes: ["Transport", "Hotel", "Breakfast"],
    },
};

const TOUR_LIST = [
    { key: 1, emoji: "🏜️", name: "Sahara Desert Tour", price: "200€", duration: "3 days / 2 nights", about: "Ride camels into the golden dunes, sleep overnight in a luxury Berber camp.", includes: ["🚌 Transport", "🏕️ Desert camp", "🍽️ Meals included", "🐪 Camel ride"] },
    { key: 2, emoji: "🕌", name: "Marrakech City Tour", price: "80€", duration: "1 full day", about: "Explore the bleeding heart of Morocco — Djemaa el-Fna square, vibrant souks.", includes: ["🚶 Guided walk", "🍜 Lunch", "🚌 Transport"] },
    { key: 3, emoji: "🏛️", name: "Fes Cultural Tour", price: "120€", duration: "2 days / 1 night", about: "Discover Fes el-Bali, visit leather tanneries and ancient universities.", includes: ["🏨 Hotel overnight", "🍳 Breakfast", "🧭 Guide"] },
    { key: 4, emoji: "👨‍👩‍👧‍👦", name: "Family Morocco Explorer", price: "350€", duration: "5 days / 4 nights", about: "Ultimate family adventure — Marrakech, Atlas Mountains, Sahara, and Chefchaouen.", includes: ["🚌 All transport", "🏨 Hotels", "🍽️ All meals", "🎯 Family activities"] },
    { key: 5, emoji: "💙", name: "Chefchaouen Blue City", price: "100€", duration: "2 days / 1 night", about: "Lose yourself in the magical blue-painted streets of Chefchaouen.", includes: ["🚌 Transport", "🏨 Boutique hotel", "🍳 Breakfast"] },
];

const FAQ = {
    price: `💰 *Our Tour Prices*\n\nOur tours start from *80€* per person.\n\n• Sahara Desert Tour → 200€\n• Marrakech City → 80€\n• Fes Cultural → 120€\n• Family Package → 350€\n• Chefchaouen → 100€\n\nType *tours* to see all packages 🗺️`,
    contact: `📞 *Contact Our Team*\n\nYou can reach us:\n\n• WhatsApp: +212 600 000 000\n• Email: info@basmatravel.com\n• Hours: 9:00 – 20:00 (GMT+1)\n\nWe reply within 1 hour! 🙏`,
    location: `📍 *Where We Operate*\n\nWe offer tours across all of Morocco:\n\n• Marrakech\n• Sahara Desert (Merzouga)\n• Fes & Meknes\n• Chefchaouen\n• Casablanca\n• Agadir & South\n\nAll tours depart from major cities.`,
    booking: `📋 *How to Book*\n\n1️⃣ Choose your tour (type *tours*)\n2️⃣ Tell us your travel dates\n3️⃣ Confirm number of guests\n4️⃣ Make payment via bank transfer or cash\n5️⃣ Receive your confirmation 🎉\n\nWant to book now? Type *book* or contact us!`,
    payment: `💳 *Payment Methods*\n\n• Bank Transfer (IBAN available)\n• Cash on arrival\n• PayPal (on request)\n\nA 30% deposit secures your booking.\nBalance paid on first day of tour.\n\nNeed an invoice? Just ask! 🧾`,
    cancel: `🔄 *Cancellation Policy*\n\n• Cancel 7+ days before: Full refund\n• Cancel 3–6 days before: 50% refund\n• Cancel <3 days: No refund\n\nEmergencies? Contact us — we do our best to help! 💛`,
    visa: `🛂 *Visa & Entry Requirements*\n\nMorocco is visa-free for many nationalities!\n\n• EU citizens: No visa needed\n• UK citizens: No visa needed\n• US citizens: No visa needed\n• Most others: 90-day tourist entry\n\nAlways verify with your local embassy before travel.`,
};

const KEYWORDS = {
    greetings: ["hi", "hello", "hola", "bonjour", "salam", "مرحبا", "السلام عليكم", "salut", "hey", "good morning", "good evening"],
    menu: ["menu", "help", "start", "options", "مساعدة", "aide"],
    tours: ["tour", "tours", "packages", "voyages", "travel", "trip", "رحلة", "رحلات", "package"],
    price: ["price", "prices", "cost", "how much", "tarif", "prix", "سعر", "تكلفة"],
    booking: ["book", "booking", "reserve", "réserver", "حجز"],
    contact: ["contact", "agent", "support", "phone", "email", "اتصال"],
    location: ["location", "where", "city", "cities", "destination", "مكان"],
    payment: ["pay", "payment", "how to pay", "payer", "دفع"],
    cancel: ["cancel", "cancellation", "refund", "annuler", "إلغاء"],
    visa: ["visa", "entry", "passport", "تأشيرة"],
    order: ["order", "commande", "طلب"],
};

module.exports = { TOURS, TOUR_LIST, FAQ, KEYWORDS };
