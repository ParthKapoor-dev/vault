import * as FadeIn from "@/components/motion/staggers/fade";
import { AppThemeProvider } from "@/components/theme";

import { ViewTransitions } from "next-view-transitions";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ViewTransitions>
      <AppThemeProvider>
        <FadeIn.Container>{children}</FadeIn.Container>
      </AppThemeProvider>
    </ViewTransitions>
  );
};
