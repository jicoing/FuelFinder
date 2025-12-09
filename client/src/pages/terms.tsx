import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Welcome to Fuel Finder. By using our app, you agree to be bound by these terms of service.
          </p>

          <h2 className="text-xl font-semibold mb-2">1. Use of the App</h2>
          <p className="mb-4">
            You agree to use Fuel Finder for lawful purposes only and in a manner that does not infringe the rights of, or restrict or inhibit the use and enjoyment of the app by any third party.
          </p>

          <h2 className="text-xl font-semibold mb-2">2. Disclaimer of Accuracy</h2>
          <p className="mb-4">
            The fuel cost calculations, gas station locations, and any other information provided by Fuel Finder are for estimation and informational purposes only. We do not guarantee the accuracy of this information and are not responsible for any discrepancies, errors, or omissions. You should always verify the information before making any decisions.
          </p>

          <h2 className="text-xl font-semibold mb-2">3. Privacy</h2>
          <p className="mb-4">
            Your privacy is important to us. As detailed in our Privacy Policy, all data entered into the app is stored locally on your device. We do not collect or store your personal information on our servers.
          </p>

          <h2 className="text-xl font-semibold mb-2">4. Intellectual Property</h2>
          <p className="mb-4">
            All content and software associated with this app are the property of Fuel Finder and are protected by international copyright laws.
          </p>

          <h2 className="text-xl font-semibold mb-2">5. Limitation of Liability</h2>
          <p className="mb-4">
            Fuel Finder is provided "as is". We will not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses resulting from the use of or inability to use the app.
          </p>

          <h2 className="text-xl font-semibold mb-2">6. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. Your continued use of the app will be considered acceptance of the revised terms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsPage;
