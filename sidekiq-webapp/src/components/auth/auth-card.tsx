import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sidekiq/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: {
    text: string;
    linkText: string;
    linkHref: string;
  };
}

/**
 * Reusable card wrapper for auth pages with consistent styling
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <Card className="border-border bg-card w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-foreground text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && (
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            {footer.text}{" "}
            <Link
              href={footer.linkHref}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {footer.linkText}
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
