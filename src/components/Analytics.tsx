"use client";

import React, { useState, useEffect } from "react";
import { GoogleTagManager } from "@next/third-parties/google";

export default function Analytics() {
    const [allowGTM, setAllowGTM] = useState(false);

    useEffect(() => {
        const checkConsent = () => {
            const consent = localStorage.getItem("rastro-cookie-consent");
            if (consent === "accepted") {
                setAllowGTM(true);
            } else {
                setAllowGTM(false);
            }
        };

        // Check initially
        checkConsent();

        // Listen for updates from the CookieBanner
        window.addEventListener("cookie-consent-updated", checkConsent);
        return () => window.removeEventListener("cookie-consent-updated", checkConsent);
    }, []);

    if (!allowGTM) return null;

    return <GoogleTagManager gtmId="GTM-KKQNQRDG" />;
}
