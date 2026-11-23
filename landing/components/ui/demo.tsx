import * as React from "react";
import { Mail, Github } from "lucide-react";
import { AuthForm } from "@/components/ui/sign-in-1";

// Helper components for icons using lucide-react with colors from DESIGN.md
const IconGoogle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <title>Google</title>
    <path
      d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.386-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.85l3.25-3.138C18.189 1.186 15.479 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.885 0 11.954-4.823 11.954-12.015 0-.795-.084-1.588-.239-2.356H12.24z"
      fill="currentColor"
    />
  </svg>
);

const IconGithub = (props: React.ComponentProps<typeof Github>) => (
  <Github {...props} />
);

const IconMail = (props: React.ComponentProps<typeof Mail>) => (
  <Mail {...props} />
);

/**
 * A demo page to showcase the AuthForm component.
 */
const AuthFormDemo = () => {
  // Verified Unsplash stock image for company logo
  const companyLogoSrc =
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <AuthForm
        logoSrc={companyLogoSrc}
        logoAlt="21st Company Logo"
        title="Welcome Back"
        description="Enter your credentials to access your account."
        primaryAction={{
          label: "Continue with Google",
          icon: <IconGoogle className="mr-2 h-4 w-4 text-[var(--accent)]" />,
          onClick: () => alert("Google login clicked"),
        }}
        secondaryActions={[
          {
            label: "Continue with Email",
            icon: <IconMail className="mr-2 h-4 w-4 text-[var(--accent-2)]" />,
            onClick: () => alert("Email login clicked"),
          },
          {
            label: "Continue with Github",
            icon: <IconGithub className="mr-2 h-4 w-4 text-[var(--text-mid)]" />,
            onClick: () => alert("Github login clicked"),
          },
        ]}
        skipAction={{
          label: "Skip for now",
          onClick: () => alert("Skip clicked"),
        }}
        footerContent={
          <>
            By logging in, you agree to our{" "}
            <u className="cursor-pointer transition-colors hover:text-primary">Terms of Service</u>{" "}
            and{" "}
            <u className="cursor-pointer transition-colors hover:text-primary">Privacy Policy</u>.
          </>
        }
      />
    </div>
  );
};

export default AuthFormDemo;
export { AuthFormDemo };
