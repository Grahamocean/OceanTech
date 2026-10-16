import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Icon from "../components/ui/Icon";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    number: "01",
    title: "Computing",
    description: "Power for everything ahead.",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1100&q=85",
    to: "/shop?category=laptops",
    className: "md:col-span-7",
  },
  {
    number: "02",
    title: "Workspace",
    description: "A better space to think.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85",
    to: "/shop?category=monitors",
    className: "md:col-span-5 md:mt-24",
  },
  {
    number: "03",
    title: "Audio",
    description: "Find your own frequency.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85",
    to: "/shop?category=accessories",
    className: "md:col-span-5",
  },
  {
    number: "04",
    title: "Everyday tech",
    description: "Small details. Big difference.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=85",
    to: "/shop?category=phones",
    className: "md:col-span-7 md:mt-20",
  },
];

const heroImage =
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=90";

export default function HomePage() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) return;

    const context = gsap.context(() => {
      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      intro
        .from(".hero-kicker", {
          y: 18,
          opacity: 0,
          duration: 0.7,
        })
        .from(
          ".hero-title-line",
          {
            yPercent: 110,
            opacity: 0,
            duration: 1,
            stagger: 0.13,
          },
          "-=0.35",
        )
        .from(
          ".hero-description, .hero-actions",
          {
            y: 22,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
          },
          "-=0.45",
        )
        .from(
          ".hero-image",
          {
            scale: 1.04,
            opacity: 0,
            duration: 1.2,
            clearProps: "all",
          },
          "-=0.75",
        )
        .from(
          ".hero-meta",
          {
            y: 12,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.45",
        );

      gsap.utils.toArray<HTMLElement>(".category-card").forEach((card) => {
        gsap.from(card, {
          y: 55,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            once: true,
          },
        });
      });

      gsap.from(".manifesto-content", {
        y: 45,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".manifesto-section",
          start: "top 75%",
          once: true,
        },
      });

      gsap.from(".service-item", {
        y: 20,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".service-grid",
          start: "top 85%",
          once: true,
        },
      });
    }, page);

    return () => context.revert();
  }, []);

  return (
    <main ref={pageRef} className="theme-page overflow-hidden">
      {/* HERO CAMPAIGN */}
      <section className="container-shell pb-12 pt-12 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="relative z-10">
            <p className="hero-kicker eyebrow mb-7">
              The next standard of everyday tech
            </p>

            <h1 className="display-heading max-w-4xl">
              <span className="block overflow-hidden pb-2">
                <span className="hero-title-line block">Technology,</span>
              </span>

              <span className="block overflow-hidden pb-2">
                <span className="hero-title-line metallic-text block">
                  reimagined.
                </span>
              </span>

              <span className="block overflow-hidden pb-2">
                <span className="hero-title-line block">For you.</span>
              </span>
            </h1>

            <p className="hero-description mt-7 max-w-md text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              Discover laptops, workspace essentials, and everyday devices
              selected to make work feel better and life move smarter.
            </p>

            <div className="hero-actions mt-8 flex flex-wrap items-center gap-3">
              <Link to="/shop" className="button-primary">
                Explore the collection
                <Icon name="arrow-right" size={17} />
              </Link>

              <Link to="/about" className="button-secondary">
                Our philosophy
              </Link>
            </div>
          </div>

          <div className="hero-image relative min-h-[330px] overflow-hidden bg-[var(--color-surface)] sm:min-h-[450px] lg:min-h-[540px]">
            <img
              src={heroImage}
              alt="Laptop arranged in a minimalist workspace"
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#C5CBD2]">
                  The essentials edit
                </p>

                <p className="mt-2 font-['Space_Grotesk'] text-xl tracking-tight sm:text-2xl">
                  Built around your world.
                </p>
              </div>

              <Link
                to="/shop"
                aria-label="Explore the OceanTech collection"
                className="grid h-11 w-11 shrink-0 place-items-center border border-white/30 bg-black/20 backdrop-blur-md transition hover:bg-white hover:text-black"
              >
                <Icon name="arrow-up-right" size={20} />
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-meta mt-9 flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>Technology, thoughtfully chosen.</span>
          <span>Discover a more considered collection</span>
        </div>
      </section>

      {/* EDITORIAL CATEGORY STORY */}
      <section className="section-padding border-t border-[var(--color-border)]">
        <div className="container-shell">
          <div className="mb-12 flex flex-col gap-5 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-5">Curated for your life</p>

              <h2 className="section-heading max-w-2xl">
                Good technology.
                <br />
                <span className="text-[var(--color-muted)]">
                  Better everyday.
                </span>
              </h2>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-3 self-start pb-2 text-xs font-semibold text-[var(--color-accent-link)] transition hover:opacity-70 sm:self-auto"
            >
              View all products
              <Icon name="arrow-up-right" size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-12 md:gap-y-16">
            {categories.map((category) => (
              <Link
                key={category.number}
                to={category.to}
                className={`category-card group block ${category.className}`}
              >
                <div className="image-frame relative aspect-[5/4] overflow-hidden bg-[var(--color-surface)]">
                  <img
                    src={category.image}
                    alt={category.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <span className="absolute left-4 top-4 border border-white/30 bg-black/30 px-3 py-1.5 text-[10px] tracking-[0.15em] text-white backdrop-blur-md">
                    {category.number}
                  </span>

                  <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center border border-white/40 bg-black/20 text-white backdrop-blur-md transition duration-300 group-hover:bg-white group-hover:text-black">
                    <Icon name="arrow-up-right" size={19} />
                  </span>
                </div>

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-['Space_Grotesk'] text-2xl tracking-tight sm:text-3xl">
                      {category.title}
                    </h3>

                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {category.description}
                    </p>
                  </div>

                  <span className="pt-2 text-xs text-[var(--color-muted)]">
                    {category.number}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND MANIFESTO */}
      <section className="manifesto-section border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="container-shell grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16 lg:py-32">
          <div className="eyebrow">The OceanTech approach</div>

          <div className="manifesto-content">
            <h2 className="section-heading max-w-4xl">
              Less noise.
              <br />
              <span className="metallic-text">More of what matters.</span>
            </h2>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-md text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                The best technology doesn't need to be complicated. We believe
                in considered choices, useful features, and products that earn
                their place in your everyday life.
              </p>

              <Link
                to="/about"
                className="button-secondary shrink-0 self-start"
              >
                Discover our story
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE PROMISES */}
      <section className="section-padding">
        <div className="container-shell">
          <div className="mb-10">
            <p className="eyebrow mb-4">The details matter</p>
            <h2 className="section-heading">A better way to shop.</h2>
          </div>

          <div className="service-grid grid gap-8 border-t border-[var(--color-border)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="service-item">
              <Icon name="shield" size={24} />

              <h3 className="mt-5 text-lg tracking-tight">
                Considered quality
              </h3>

              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                A curated collection built around practical everyday needs.
              </p>
            </div>

            <div className="service-item">
              <Icon name="truck" size={24} />

              <h3 className="mt-5 text-lg tracking-tight">
                Delivery information
              </h3>

              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Clear delivery details before you place an order.
              </p>
            </div>

            <div className="service-item">
              <Icon name="refresh" size={24} />

              <h3 className="mt-5 text-lg tracking-tight">Helpful support</h3>

              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Assistance to help you choose technology that suits you.
              </p>
            </div>

            <div className="service-item">
              <Icon name="shopping-bag" size={24} />

              <h3 className="mt-5 text-lg tracking-tight">Simple shopping</h3>

              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Browse the collection and build your own everyday setup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="container-shell pb-20 sm:pb-28">
        <div className="relative overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-20">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#C5CBD2]/[0.06] blur-3xl" />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-5">Your next setup starts here</p>

              <h2 className="section-heading max-w-2xl">
                Find your
                <br />
                <span className="text-[var(--color-muted)]">
                  next essential.
                </span>
              </h2>
            </div>

            <Link to="/shop" className="button-primary self-start sm:self-auto">
              Shop OceanTech
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
