
import { Suspense } from "react";

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
