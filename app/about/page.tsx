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
        <p>
          Hi, I am Parth Kapoor and this is my vault. to store my frequently
          used files.
        </p>
      </FadeIn.Item>
      <Spacer />
    </FadeIn.Container>
  );
}
