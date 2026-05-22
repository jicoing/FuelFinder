import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const { user, session, isLoading: isAuthLoading, refetch: refetchAuth } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState<string>("Verifying your payment...");

  useEffect(() => {
    if (isAuthLoading) {
      setStatus("verifying");
      setMessage("Restoring your session...");
      return;
    }

    if (!user || !session) {
      setStatus("failed");
      setMessage("You must be logged in to verify payment.");
      return;
    }

    const search = window.location.search;
    const params = new URLSearchParams(search);
    const orderId = params.get("order_id");

    let attempts = 0;
    const maxAttempts = 30; // ~60 seconds

     const checkSubscription = async () => {
        attempts++;
        try {
          // Trigger server-side verification of the order with Cashfree
          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ order_id: orderId }),
          });

          const responseText = await response.text();
          let data: any = {};
          try {
            data = responseText ? JSON.parse(responseText) : {};
          } catch (e) {
            throw new Error(responseText || 'Server returned invalid response');
          }

          if (!response.ok) {
            throw new Error(data.error || "Failed to verify payment status");
          }

        if (data.success && data.subscription?.tier === "premium") {
          setStatus("success");
          setMessage("Payment verified! Your account has been upgraded to Premium.");
          await refetchAuth();
          return true;
        }

        if (attempts >= maxAttempts) {
          setStatus("failed");
          setMessage("Payment verification timed out. Please try again later or contact support.");
          return true;
        }

        // Continue checking if status is not active yet (e.g. pending state)
        return false;
      } catch (error: any) {
        if (attempts >= maxAttempts) {
          setStatus("failed");
          setMessage(error.message || "An error occurred while verifying payment.");
          return true;
        }
        return false;
      }
    };

    // Check immediately then every 2 seconds
    checkSubscription();
    const interval = setInterval(() => {
      checkSubscription().then(shouldStop => {
        if (shouldStop) clearInterval(interval);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthLoading, user, session, refetchAuth]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-6 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-center">{message}</p>
          <p className="text-sm text-muted-foreground text-center">
            Please keep this page open. We're confirming your payment with Cashfree.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 flex flex-col items-center gap-4 text-center">
        {status === "success" ? (
          <>
            <div className="p-3 bg-green-500/20 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-foreground/70">{message}</p>
            <Button className="mt-4" onClick={() => setLocation("/")}>
              Return to Home
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 bg-destructive/20 rounded-full">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Payment Issue</h1>
            <p className="text-foreground/70">{message}</p>
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact support.
            </p>
            <Button className="mt-4" onClick={() => setLocation("/")}>
              Go Home
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
