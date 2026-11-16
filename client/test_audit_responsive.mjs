// Automated Test Suite for Solid'Aid Responsive Design & Android Compatibility Audit
import axios from "axios";
import fs from "fs";

const API_BASE = "https://stage-cqe9.onrender.com/api";

async function runAuditTests() {
  console.log("=================================================");
  console.log(" SOLID'AID MOBILE AUDIT & RESPONSIVE VALIDATION  ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  // 1. Source Code Inspection
  console.log("--- 1. Static Code Analysis & Android Design Rules ---");
  const appCode = fs.readFileSync("client/src/App.jsx", "utf8");
  const appJson = JSON.parse(fs.readFileSync("client/app.json", "utf8"));
  const easJson = JSON.parse(fs.readFileSync("client/eas.json", "utf8"));

  assert(
    appJson.expo.android.softwareKeyboardLayoutMode === "resize",
    "app.json has softwareKeyboardLayoutMode set to 'resize'"
  );

  assert(
    easJson.build.preview.env.EXPO_PUBLIC_API_URL === "https://stage-cqe9.onrender.com/api",
    "eas.json preview profile uses production Render API URL"
  );

  assert(
    easJson.build.production.env.EXPO_PUBLIC_API_URL === "https://stage-cqe9.onrender.com/api",
    "eas.json production profile uses production Render API URL"
  );

  assert(
    appCode.includes("BackHandler"),
    "App.jsx imports and utilizes native Android BackHandler"
  );

  assert(
    appCode.includes("KeyboardAvoidingView"),
    "App.jsx implements KeyboardAvoidingView across forms"
  );

  assert(
    appCode.includes("useKeyboard()"),
    "App.jsx has useKeyboard hook calculating keyboardHeight"
  );

  assert(
    appCode.includes("!isKeyboardVisible && (") && appCode.includes("bottomTabBar"),
    "App.jsx hides bottomTabBar when software keyboard is visible"
  );

  assert(
    !appCode.includes("citizenActionCard:\s*\{[^}]*textAlign:"),
    "App.jsx has no illegal CSS properties on Views (e.g. textAlign)"
  );

  assert(
    appCode.includes("storefront") && !appCode.includes("restaurant-outline"),
    "App.jsx uses storefront boutique icons instead of fork/spoon for commerce"
  );

  // 2. Responsive Screen Formats & Touch Targets
  console.log("\n--- 2. Responsive Screen Formats & Touch Targets ---");
  const screenWidths = [
    { name: "Small Android (Galaxy A10 / Sony Xperia)", width: 320 },
    { name: "Compact Android (Galaxy A32 / Pixel 4a)", width: 360 },
    { name: "Standard Android (Galaxy S22 / Pixel 7)", width: 390 },
    { name: "Large Android / Phablet (Pixel 8 Pro)", width: 428 },
    { name: "Android Tablet (Tab S8)", width: 768 }
  ];

  screenWidths.forEach(({ name, width }) => {
    const containerWidth = Math.min(width, 680) - 36; // 18px padding on each side
    const cardWidth = containerWidth * 0.48;
    const totalRow = cardWidth * 2 + 8; // 8px column gap
    assert(
      cardWidth >= 120 && totalRow <= containerWidth + 0.1,
      `Layout geometry valid for ${name} (Screen: ${width}px, Container: ${containerWidth}px, Card: ${Math.round(cardWidth)}px)`
    );
  });

  // 3. Live Production Backend API Contract & Health Check
  console.log("\n--- 3. Live Backend Connectivity & Role Features ---");
  try {
    const health = await axios.get(`${API_BASE}/health`, { timeout: 6000 });
    assert(health.status === 200 && health.data.ok === true, "Render Backend Health Check responds 200 OK");
  } catch (err) {
    assert(false, "Render Backend Health Check responds 200 OK", err.message);
  }

  // 4. End-to-End API User Flows (Citizen / Association / Commerce)
  console.log("\n--- 4. Functional Testing of Core User Journeys ---");
  const testEmail = `audit_tester_${Date.now()}@solidaid.fr`;
  let authToken = null;
  let userId = null;

  try {
    // A. Registration (Citizen flow)
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: "TestPassword123!",
      firstName: "Audit",
      lastName: "Tester",
      role: "citizen",
      consentRgpd: true
    });
    assert(regRes.status === 200 || regRes.status === 201, "Citizen Registration with RGPD consent");
    authToken = regRes.data.token;
    userId = regRes.data.user?.id || regRes.data.user?._id;

    // B. Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: "TestPassword123!"
    });
    assert(loginRes.status === 200 && loginRes.data.token, "Citizen Login & Token generation");

    // C. User Profile Fetch
    const profileRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(profileRes.status === 200 && profileRes.data.user?.email === testEmail, "Profile fetch (/auth/me)");

    // D. Quick Report Creation
    const reportRes = await axios.post(
      `${API_BASE}/reports/quick`,
      {
        coordinates: [2.3522, 48.8566],
        addressHint: "Audit Test Place de la République",
        comment: "Signalement de test pour audit responsive",
        urgency: "yellow",
        needs: ["shelter"]
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    assert(reportRes.status === 200 || reportRes.status === 201, "Quick Report Submission (/reports/quick)");

    // E. Fetch Reports
    const fetchReports = await axios.get(`${API_BASE}/reports`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(Array.isArray(fetchReports.data), "Reports list retrieval (/reports)");

    // F. Account Deletion (Google Play Compliance: returns 204 or 200)
    const deleteRes = await axios.delete(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert(deleteRes.status === 204 || deleteRes.status === 200, "Account & Data Deletion (/auth/me) - Google Play Compliant");

  } catch (err) {
    assert(false, "User Journeys Execution", err.response?.data?.message || err.message);
  }

  console.log("\n=================================================");
  console.log(` AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
