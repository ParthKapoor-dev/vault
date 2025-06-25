import * as FadeIn from "@/components/motion/staggers/fade";

const Spacer = () => <div style={{ marginTop: "24px" }} />;

export default function Home() {
  return (
    <FadeIn.Container>
      <FadeIn.Item>
        <div className="flex justify-between">
          <div>
            <h1>lnx.parthkapoor.me</h1>
            <h2>Vault</h2>
          </div>
        </div>
      </FadeIn.Item>
      <Spacer />
      <FadeIn.Item>
        <section className=" flex flex-col gap-2">
          <h2>🧠 Who’s Parth?</h2>
          <p>
            I’m <strong>Parth Kapoor</strong> — a backend-heavy fullstack dev
            who treats code like craft. I build high-performance systems,
            LLM-powered tools, and infrastructure that doesn’t break at 2AM.
          </p>
          <p>
            Currently hacking on projects in <strong>Go</strong>,{" "}
            <strong>Next.js</strong>, <strong>Kubernetes</strong>, and{" "}
            <strong>LLMs</strong> — blending DevOps with AI like it’s an art
            form.
          </p>
          <ul className="ml-6 font-mono">
            <li>Terminal is my home</li>
            <li>Dotfiles are my fingerprints</li>
            <li>I ship. Then I optimize. Then I ship again.</li>
          </ul>
          <blockquote>
            ⚡ Powered by caffeine, Linux, and late-night curiosity.
            <br />
            💾 Building a vault, but really building a legacy.
          </blockquote>
        </section>{" "}
      </FadeIn.Item>
      <Spacer />
    </FadeIn.Container>
  );
}
