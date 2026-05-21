import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const ContactPage = () => {
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSf7KWHxIKh0q-U0HMhjP83Wr-XXb_8sm02O3vIIaU6X7nMGFg/viewform?usp=publish-editor";

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground/70">
            Have questions, feedback, or need assistance? Fill out our contact form and we'll get back to you as soon as possible.
          </p>

          <div className="p-6 bg-secondary/30 rounded-lg border border-border/30 text-center">
            <div className="mb-4">
              <MessageCircle className="w-12 h-12 mx-auto text-primary mb-2" />
              <h3 className="font-semibold text-lg mb-2">Contact Form</h3>
              <p className="text-sm text-foreground/70">
                Click the button below to open our contact form in a new tab.
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <a href={formUrl} target="_blank" rel="noopener noreferrer">
                Open Contact Form
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h3 className="font-semibold mb-2">Before Contacting</h3>
            <p className="text-sm text-foreground/70 mb-2">
              You might find answers to common questions in our:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/about">About Page</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/terms">Terms & Conditions</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactPage;
