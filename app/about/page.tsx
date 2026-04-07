import Link from "next/link";
import { SMNTHeader, SMNTFooter } from "../components/SMNTLayout";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">About SMNT</h1>
        <p className="text-[#525252] leading-relaxed mb-6">
          Welcome to the Sierra Mountain Nature Trail—a movement to connect the longest trails of
          the Philippines.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          More than just a website, we are a bridge. Our mission is to unite the vast,
          breathtaking landscapes of our mountain range with the vibrant spirit of every Philippine
          outdoor community. We believe that every ridge, river, and rainforest is part of a larger
          story, and we are here to connect the dots.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          For the trekker, the explorer, and the organization, Sierra Mountain Nature Trail serves
          as your central information hub. Dive into our interactive map to discover detailed
          routes, pinpoint jump-off points, and locate essential points of interest. Whether you
          are planning a weekend climb or scouting for your org&apos;s next major expedition, our
          platform provides the data you need to explore responsibly and confidently.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          However, a project of this scale requires a united front. We are only as strong as the
          community that walks these trails. That is why we invite every mountaineering
          organization and hiking group in the Metro Manila area to contribute. Share your
          hard-earned GPX files and local knowledge. By pooling our collective experience, we can
          create the most comprehensive and accurate trail database in the country—a testament to
          the power of collaboration.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          For our partners in the Local Government Units (LGUs), we aim to be a tool for promoting
          sustainable tourism and managing trail impact. By centralizing route data and jump-off
          information, we hope to support your efforts in preserving these natural wonders while
          boosting local economies.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          To our potential sponsors, this is an opportunity to champion a cause that resonates with
          a passionate, active, and environmentally conscious demographic. By supporting the Sierra
          Mountain Nature Trail, your brand becomes part of a national movement toward conservation
          and community.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          Finally, the Sierra Mountain Nature Trail is a national call to action. This platform
          serves as a rallying point for volunteers. From trail maintenance and reforestation to
          education and conservation, we aim to channel the passion of the outdoor community into
          meaningful service.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          Together, let&apos;s connect the trails, unite the communities, and protect the wild.
        </p>
        <p className="text-[#525252] leading-relaxed">
          <Link href="/" className="text-[#0D9488] hover:underline">
            View the map
          </Link>
          {" · "}
          <Link href="/contact" className="text-[#0D9488] hover:underline">
            Contact us
          </Link>
        </p>
      </main>
      <SMNTFooter />
    </div>
  );
}
