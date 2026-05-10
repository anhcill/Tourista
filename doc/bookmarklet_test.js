// Bookmarklet - Dán vào browser console để test booking lookup
// Mở DevTools (F12) → Console → Dán và chạy

(async () => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');

    console.log("=== Booking Lookup Debug ===");
    console.log("Token exists:", !!token);
    console.log("Token (first 50 chars):", token ? token.substring(0, 50) + "..." : "NONE");
    console.log("User data:", userData ? JSON.parse(userData) : "NONE");

    if (!token) {
        console.log("\n❌ Không có token - bạn chưa đăng nhập!");
        return;
    }

    // Test 1: Gọi trực tiếp Railway backend
    console.log("\n--- Test 1: Gọi Railway backend trực tiếp ---");
    try {
        const res = await fetch("https://tourista-production.up.railway.app/api/chat/booking?code=TRS-20260506-50188", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Error:", e.message);
    }

    // Test 2: Gọi qua Vercel proxy
    console.log("\n--- Test 2: Gọi qua Vercel proxy (/api/chat/booking) ---");
    try {
        const res = await fetch("/api/chat/booking?code=TRS-20260506-50188", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Error:", e.message);
    }

    // Test 3: Gọi chat/message
    console.log("\n--- Test 3: Gọi /api/chat/message ---");
    try {
        const res = await fetch("/api/chat/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ message: "tra cứu TRS-20260506-50188" })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Error:", e.message);
    }

    console.log("\n=== Done ===");
})();
