import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import { projects } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ======== Hero 区块：白底 ======== */}
      <section className="bg-[#fafafa]">
        <div className="mx-auto max-w-content px-4 sm:px-0">
          <Hero />
        </div>
      </section>

      {/* ======== 项目一：浅灰底 ======== */}
      <section className="bg-[#f7f7f7]">
        <div className="mx-auto max-w-content px-4 sm:px-0 py-[100px]">
          <ProjectCard project={projects[0]} />
        </div>
      </section>

      {/* ======== 项目二：白底 ======== */}
      <section className="bg-[#fafafa]">
        <div className="mx-auto max-w-content px-4 sm:px-0 py-[100px]">
          <ProjectCard project={projects[1]} />
        </div>
      </section>

      {/* ======== Footer：浅灰底 ======== */}
      <Footer />
    </>
  );
}
