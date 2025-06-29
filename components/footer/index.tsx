import Link from "@/components/link";
import * as FadeIn from "@/components/motion/staggers/fade";
import { AppThemeSwitcher } from "@/components/theme";

const Footer = () => {
  return (
    <FadeIn.Item>
      <div className="flex w-full items-center justify-between border-border border-t pt-2">
        <div className="px-[2px] text-muted text-small">
          Built by{" "}
          <Link
            href="https://parthkapoor.me"
            text="parthkapoor-dev"
            underline
          />
        </div>
        <div className="text-muted text-small">
          <AppThemeSwitcher />
        </div>
      </div>
    </FadeIn.Item>
  );
};

export { Footer };
