// Test tra cứu booking trên local backend
const API_BASE = "http://localhost:8080";
const BOOKING_CODE = "TRS-20260506-50188";

async function test() {
    console.log("=== Test tra cứu booking ===\n");
    console.log("Target:", `${API_BASE}/api/chat/booking?code=${BOOKING_CODE}`);
    console.log("");

    // 1. Test booking lookup không token
    console.log("1. Gọi GET /api/chat/booking (không có token)...");
    try {
        const res = await fetch(`${API_BASE}/api/chat/booking?code=${BOOKING_CODE}`);
        const data = await res.json();
        console.log("   Status:", res.status);
        console.log("   Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("   Error:", e.message);
    }

    console.log("\n---\n");

    // 2. Test chat/message endpoint không token
    console.log("2. Gọi POST /api/chat/message (không có token)...");
    try {
        const res = await fetch(`${API_BASE}/api/chat/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `tra cứu ${BOOKING_CODE}` })
        });
        const data = await res.json();
        console.log("   Status:", res.status);
        console.log("   Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("   Error:", e.message);
    }
}

test();
