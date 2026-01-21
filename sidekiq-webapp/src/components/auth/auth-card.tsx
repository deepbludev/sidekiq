import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sidekiq/components/ui/card";

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
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-white">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && (
        <CardFooter className="justify-center">
          <p className="text-sm text-zinc-400">
            {footer.text}{" "}
            <Link
              href={footer.linkHref}
              className="text-zinc-200 underline-offset-4 hover:underline"
            >
              {footer.linkText}
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
