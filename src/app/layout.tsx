import type { Metadata } from "next";

export const metadata: Metadata = {
  verification: {
    google: "JUS1nmscWFd22T2yqxoTEmMcXBIKA9ztFnMJ-MTSM3g",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
