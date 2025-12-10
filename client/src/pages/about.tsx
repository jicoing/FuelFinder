import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutPage = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>About <strong>findmyfuel</strong></CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            <strong>findmyfuel</strong> is a powerful tool designed to help you save money on gas. Whether you're planning a road trip or just running errands around town, our app provides the tools you need to make informed decisions about your fuel consumption.
          </p>
          <h2 className="text-xl font-semibold mb-2">Trip Fuel Cost Calculator</h2>
          <p className="mb-4">
            Our main feature is the Trip Fuel Cost Calculator. Simply enter your trip distance, your vehicle's fuel efficiency (MPG), and the current gas price, and we'll instantly calculate the estimated cost of your journey. This helps you budget for your trips and understand your vehicle's fuel expenses.
          </p>
          <h2 className="text-xl font-semibold mb-2">Nearby Gas Stations</h2>
          <p className="mb-4">
            Using your device's location, <strong>findmyfuel</strong> can quickly locate gas stations near you. We provide a map view to easily navigate to the station of your choice. 
          </p>
          <h2 className="text-xl font-semibold mb-2">Fuel Price Comparison (Coming Soon)</h2>
          <p className="mb-4">
            We are working hard to bring you real-time fuel price data. Soon, you'll be able to compare prices at different gas stations to ensure you're getting the best deal.
          </p>
          <h2 className="text-xl font-semibold mb-2">About the Developer</h2>
          <p className="mb-4">
            <strong>findmyfuel</strong> is developed and maintained by a passionate solo developer. Have questions or feedback? I'd love to hear from you! Connect with me on Twitter: <a href="https://twitter.com/jicoing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@jicoing</a>
          </p>
          <h2 className="text-xl font-semibold mb-2">Support the Project</h2>
          <p className="mb-4">
            If you find <strong>findmyfuel</strong> useful, please consider supporting its development. Your donations help cover server costs and allow me to keep the app ad-free.
            <br />- PayPal: <a href="https://paypal.me/jicoing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">paypal.me/jicoing</a>
            <br />- UPI: jicoing@okicici
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;