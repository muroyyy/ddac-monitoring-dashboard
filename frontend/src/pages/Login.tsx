import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: new password, 3: success
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Mock login API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username === "amirul_admin" && password === "admin123") {
        // Store session token
        localStorage.setItem("sessionToken", "mock-session-token");
        window.location.href = "/";
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (email === "admin@ddac-monitoring.com") {
        setForgotStep(2);
      } else {
        setForgotError("Email does not match our records");
      }
    } catch (err) {
      setForgotError("Verification failed. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters");
      return;
    }

    setForgotLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotStep(3);
    } catch (err) {
      setForgotError("Password reset failed. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
  };

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">DDAC Monitoring</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={() => setShowForgotPassword(true)}
                disabled={loading}
              >
                Forgot password?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {forgotStep === 1 && "Reset Password"}
              {forgotStep === 2 && "Set New Password"}
              {forgotStep === 3 && "Password Reset Successful!"}
            </DialogTitle>
            <DialogDescription>
              {forgotStep === 1 && "Enter your email address to verify your identity"}
              {forgotStep === 2 && "Enter your new password"}
              {forgotStep === 3 && "Your password has been successfully reset"}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === 1 && (
            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={forgotLoading}
                />
              </div>

              {forgotError && (
                <Alert variant="destructive">
                  <AlertDescription>{forgotError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={forgotLoading}>
                  {forgotLoading ? "Verifying..." : "Verify Email"}
                </Button>
              </div>
            </form>
          )}

          {forgotStep === 2 && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={forgotLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={forgotLoading}
                    className={confirmPassword.length > 0 ? (passwordsMatch ? "border-green-500" : "border-red-500") : ""}
                  />
                  {confirmPassword.length > 0 && passwordsMatch && (
                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>

              {forgotError && (
                <Alert variant="destructive">
                  <AlertDescription>{forgotError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setForgotStep(1)}
                  disabled={forgotLoading}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={forgotLoading || !passwordsMatch}
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}

          {forgotStep === 3 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                You can now sign in with your new password.
              </p>
              <Button 
                onClick={resetForgotPassword}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;