import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import { projects } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-content px-4 sm:px-0">
        <Hero />
        <div className="space-y-[120px] pb-[120px]">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
