import * as FadeIn from "@/components/motion/staggers/fade";

import { AuthStatus } from "./authStatus";
import { Breadcrumb } from "./breadcrumb";

export default function Header() {
  return (
    <FadeIn.Item>
      <nav className="flex justify-between">
        <Breadcrumb />
        <AuthStatus />
      </nav>
    </FadeIn.Item>
  );
}
