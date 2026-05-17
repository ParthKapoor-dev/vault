import * as FadeIn from "@/components/motion/staggers/fade";
import { AppThemeProvider } from "@/components/theme";
import { SessionProvider } from "@/components/providers/session";

import { ViewTransitions } from "next-view-transitions";
import { Toaster } from "sonner";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ViewTransitions>
      <AppThemeProvider>
        <SessionProvider>
          <FadeIn.Container>{children}</FadeIn.Container>
          <Toaster theme="system" position="bottom-right" />
        </SessionProvider>
      </AppThemeProvider>
    </ViewTransitions>
  );
};
