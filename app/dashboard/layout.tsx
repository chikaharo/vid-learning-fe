import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My learning",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
