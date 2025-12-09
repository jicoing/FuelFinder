import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPage = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Your privacy is important to us. This Privacy Policy explains how your personal information is collected, used, and disclosed by Fuel Finder. This version of the policy has been updated to clarify that all user data is stored exclusively on your device.
          </p>

          <h2 className="text-xl font-semibold mb-2">1. Data Storage</h2>
          <p className="mb-4">
            All data you enter into the app, including trip details for the fuel cost calculator and any saved preferences, is stored locally on your device. We do not have access to this information, and it is not transmitted to our servers or any third party.
          </p>

          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p className="mb-4">
            We collect a minimal amount of information to provide and improve our services:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>
              <strong>Location Information:</strong> To find nearby gas stations, the app requires access to your device's location. This location data is used in real-time to display the map and is not stored or tracked.
            </li>
            <li>
              <strong>Device Information:</strong> We do not collect any personal device information like UDID or other identifiers.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mb-2">3. How We Use Information</h2>
          <p className="mb-4">
            The information collected is used solely to enable the app's core features. We do not use your data for advertising, analytics, or any other purpose. Since we do not store your personal information, we do not share it with any third parties.
          </p>

          <h2 className="text-xl font-semibold mb-2">4. Security</h2>
          <p className="mb-4">
            The security of your data is in your hands. Since all information is stored on your device, it is protected by your device's own security measures (such as your passcode and encryption). We recommend keeping your device secure.
          </p>

          <h2 className="text-xl font-semibold mb-2">5. Changes to This Policy</h2>
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. Your continued use of the app after any modification to this Privacy Policy will constitute your acceptance of such modification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;
