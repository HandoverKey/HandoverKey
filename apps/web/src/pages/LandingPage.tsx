import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import api from "../services/api";

// Local utility class strings — intentionally NOT in index.css.
// The global .btn is correct for the dashboard (rounded gradient pill); on a
// cream landing page that style reads like a generic SaaS template, so this
// page uses solid-dark CTAs scoped just here.
const btnPrimary =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:bg-black transition shadow-sm dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100";
const btnGhost =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-gray-700 dark:text-gray-300 text-sm font-medium hover:text-gray-900 dark:hover:text-white transition";

const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-gray-900 text-gray-900 dark:text-gray-100 selection:bg-amber-200/60 dark:selection:bg-amber-300/30">
      <Nav />
      <Hero />
      <HowItWorks />
      <Principles />
      <KeySharing />
      <Lifecycle />
      <PricingSection />
      <FAQSection />
      <WaitlistSection />
      <ClosingCTA />
      <Footer />
    </div>
  );
}

// --- Nav ---

function Nav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF7F2]/80 dark:bg-gray-900/80 border-b border-stone-200/70 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark className="h-6 w-6" />
          <span className="text-[15px] font-semibold tracking-tight">
            Handoverkey
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          <a
            href="#how-it-works"
            className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition px-3 py-1.5"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition px-3 py-1.5"
          >
            Pricing
          </a>
          <Link
            to="/login"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition px-3 py-1.5"
          >
            Log in
          </Link>
          <Link to="/register" className={btnPrimary}>
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// --- Hero ---

function Hero() {
  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/30 px-3 py-1 rounded-full ring-1 ring-amber-200/80 dark:ring-amber-800/50">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Zero-knowledge by design
              </span>
              <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                When you can&apos;t,
                <br />
                <span className="text-gray-500 dark:text-gray-400">
                  they still can.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Handoverkey watches for your silence. If you stop checking in,
                it quietly passes your encrypted secrets to the people you chose
                &mdash; and to no one else.
              </p>
              <div className="mt-8 flex items-center gap-2">
                <Link to="/register" className={btnPrimary}>
                  Start a vault
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className={btnGhost}>
                  See how it works
                </a>
              </div>
            </motion.div>
          </div>
          <div className="md:col-span-5">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

// Custom signature illustration: vault face inside a timer ring, with three
// envelopes orbiting it. Pure SVG, single composition — no icon-in-a-box.
function HeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative mx-auto aspect-square max-w-[360px]"
    >
      <svg
        viewBox="0 0 360 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* outer timer ring */}
        <circle
          cx="180"
          cy="180"
          r="148"
          stroke="currentColor"
          className="text-stone-300 dark:text-gray-700"
          strokeWidth="1.5"
        />
        <motion.circle
          cx="180"
          cy="180"
          r="148"
          stroke="currentColor"
          className="text-amber-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="930"
          initial={{ strokeDashoffset: 930 }}
          animate={{ strokeDashoffset: 230 }}
          transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }}
          transform="rotate(-90 180 180)"
        />

        {/* inner vault circle */}
        <circle
          cx="180"
          cy="180"
          r="92"
          className="fill-white dark:fill-gray-800"
          stroke="currentColor"
          strokeOpacity="0.08"
        />
        <circle
          cx="180"
          cy="180"
          r="92"
          stroke="currentColor"
          className="text-stone-200 dark:text-gray-700"
          strokeWidth="1"
        />

        {/* vault dial */}
        <circle
          cx="180"
          cy="180"
          r="58"
          className="fill-stone-100 dark:fill-gray-700"
        />
        <circle
          cx="180"
          cy="180"
          r="58"
          stroke="currentColor"
          className="text-stone-300 dark:text-gray-600"
          strokeWidth="1"
        />
        {/* dial tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 180 + Math.cos(angle) * 50;
          const y1 = 180 + Math.sin(angle) * 50;
          const x2 = 180 + Math.cos(angle) * 56;
          const y2 = 180 + Math.sin(angle) * 56;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              className="text-stone-400 dark:text-gray-500"
              strokeWidth="1"
              strokeLinecap="round"
            />
          );
        })}
        {/* vault pointer */}
        <line
          x1="180"
          y1="180"
          x2="180"
          y2="140"
          stroke="currentColor"
          className="text-gray-900 dark:text-gray-100"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="180"
          cy="180"
          r="3.5"
          className="fill-gray-900 dark:fill-gray-100"
        />
        {/* keyhole motif */}
        <circle
          cx="180"
          cy="170"
          r="4"
          className="fill-amber-500"
          opacity="0.8"
        />

        {/* orbiting successors */}
        {[
          { x: 180, y: 32, delay: 0.6 },
          { x: 308, y: 264, delay: 0.9 },
          { x: 52, y: 264, delay: 1.2 },
        ].map((s, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: s.delay }}
          >
            <circle
              cx={s.x}
              cy={s.y}
              r="18"
              className="fill-white dark:fill-gray-800"
              stroke="currentColor"
              strokeOpacity="0.08"
            />
            <circle
              cx={s.x}
              cy={s.y}
              r="18"
              stroke="currentColor"
              className="text-stone-300 dark:text-gray-600"
              strokeWidth="1"
            />
            <rect
              x={s.x - 8}
              y={s.y - 5}
              width="16"
              height="11"
              rx="1.5"
              stroke="currentColor"
              className="text-gray-700 dark:text-gray-300"
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d={`M ${s.x - 8} ${s.y - 5} L ${s.x} ${s.y + 1} L ${s.x + 8} ${
                s.y - 5
              }`}
              stroke="currentColor"
              className="text-gray-700 dark:text-gray-300"
              strokeWidth="1.4"
              fill="none"
              strokeLinejoin="round"
            />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}

// --- How it works (3-step flow) ---

function HowItWorks() {
  const steps = [
    {
      label: "Store",
      title: "Drop your secrets in.",
      body: "Passwords, keys, documents, notes. Encrypted on your device before they leave.",
      art: <VaultGlyph />,
    },
    {
      label: "Wait",
      title: "Check in, or don't.",
      body: "Every login resets your timer. We only act after you've been silent for the window you set.",
      art: <ClockGlyph />,
    },
    {
      label: "Hand over",
      title: "Successors get the key.",
      body: "When the timer runs out, the people you chose receive their share. Together, they unlock.",
      art: <EnvelopeKeyGlyph />,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-28 border-t border-stone-200/70 dark:border-gray-800 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeIn} className="max-w-2xl">
          <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Three things happen, in order.
          </h2>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
          {/* horizontal connector on md+ */}
          <div className="hidden md:block absolute left-[16%] right-[16%] top-[44px] h-px bg-stone-300 dark:bg-gray-700" />

          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              {...fadeIn}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="relative flex items-center justify-center md:justify-start mb-6">
                <div className="relative h-[88px] w-[88px] bg-[#FAF7F2] dark:bg-gray-900 flex items-center justify-center rounded-full ring-1 ring-stone-200 dark:ring-gray-700">
                  {step.art}
                </div>
              </div>
              <p className="text-xs font-medium tracking-wider uppercase text-gray-500 dark:text-gray-400">
                {step.label}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Principles ---

function Principles() {
  const items = [
    {
      title: "You hold the key.",
      body: "Your master password derives the key, in your browser. We store only ciphertext. If you forget it, we can't recover it either.",
      art: <KeyGlyph />,
    },
    {
      title: "Time is the trigger.",
      body: "No paperwork. No human approval. A countdown you control decides when handover begins.",
      art: <TimerGlyph />,
    },
    {
      title: "No one acts alone.",
      body: "Shamir's Secret Sharing splits the key. Only a quorum of your successors, together, can reconstruct it.",
      art: <SplitGlyph />,
    },
  ];

  return (
    <section className="py-20 sm:py-28 border-t border-stone-200/70 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeIn} className="max-w-2xl mb-14">
          <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
            Principles
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Three rules we don&rsquo;t break.
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              {...fadeIn}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="mb-5">{item.art}</div>
              <h3 className="text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Key Sharing (n / k diagrams) ---

function KeySharing() {
  const scenarios = [
    {
      title: "2 of 3",
      caption: "A family setup.",
      detail: "Any two out of three can unlock. One can be unreachable.",
      n: 3,
      k: 2,
    },
    {
      title: "3 of 5",
      caption: "A small team.",
      detail: "Majority required. Survives two absent successors.",
      n: 5,
      k: 3,
    },
    {
      title: "2 of 2",
      caption: "Strict pair.",
      detail:
        "Both must cooperate. If either is missing, the vault stays sealed.",
      n: 2,
      k: 2,
    },
  ];

  return (
    <section className="py-20 sm:py-28 border-t border-stone-200/70 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeIn} className="max-w-2xl mb-14">
          <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
            Key sharing
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            You choose the quorum.
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Pick how many of your successors need to combine their shares before
            the vault opens. More shares means more resilience; fewer means
            stricter control.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              {...fadeIn}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800/40 rounded-2xl p-7 ring-1 ring-stone-200 dark:ring-gray-700"
            >
              <ShareDiagram n={s.n} k={s.k} />
              <p className="mt-6 text-xs font-medium tracking-wider uppercase text-gray-500 dark:text-gray-400">
                {s.caption}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {s.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShareDiagram({ n, k }: { n: number; k: number }) {
  const radius = 38;
  const cx = 90;
  const cy = 52;
  const dots = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      filled: i < k,
    };
  });
  return (
    <svg viewBox="0 0 180 110" className="w-full h-[110px]" aria-hidden="true">
      {dots.map((d, i) =>
        dots
          .slice(i + 1)
          .map((d2, j) =>
            d.filled && d2.filled ? (
              <line
                key={`${i}-${j}`}
                x1={d.x}
                y1={d.y}
                x2={d2.x}
                y2={d2.y}
                stroke="currentColor"
                className="text-amber-400/70"
                strokeWidth="1"
              />
            ) : null,
          ),
      )}
      {dots.map((d, i) => (
        <g key={i}>
          <circle
            cx={d.x}
            cy={d.y}
            r="9"
            className={
              d.filled ? "fill-amber-500" : "fill-stone-200 dark:fill-gray-700"
            }
          />
          {d.filled && (
            <circle cx={d.x} cy={d.y} r="3" className="fill-white" />
          )}
        </g>
      ))}
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        className="fill-gray-900 dark:fill-gray-100 text-[14px] font-semibold"
      >
        {k}/{n}
      </text>
    </svg>
  );
}

// --- Lifecycle (annotated horizontal timeline) ---

function Lifecycle() {
  return (
    <section className="py-20 sm:py-28 border-t border-stone-200/70 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeIn} className="max-w-2xl mb-12">
          <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
            What if?
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            You stay in control until the end.
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Every stage is reversible until the last. Here&rsquo;s what happens,
            and what you can do at each point.
          </p>
        </motion.div>

        <motion.div
          {...fadeIn}
          className="bg-white dark:bg-gray-800/40 rounded-2xl ring-1 ring-stone-200 dark:ring-gray-700 p-6 sm:p-10"
        >
          <LifecycleDiagram />
        </motion.div>
      </div>
    </section>
  );
}

function LifecycleDiagram() {
  const stages = [
    {
      label: "Active",
      sub: "You're checking in.",
      note: "Daily life. Nothing happens.",
      color: "bg-emerald-500",
    },
    {
      label: "Reminders",
      sub: "75, 85, 95 %.",
      note: "We email. One click resets the timer.",
      color: "bg-amber-400",
    },
    {
      label: "Grace period",
      sub: "48 hours.",
      note: "Last chance. Log in once to cancel.",
      color: "bg-amber-600",
    },
    {
      label: "Handover",
      sub: "Successors notified.",
      note: "You can still cancel until they unlock.",
      color: "bg-rose-500",
    },
  ];
  return (
    <div>
      <div className="hidden sm:block relative">
        <div className="absolute left-[6%] right-[6%] top-[18px] h-px bg-stone-300 dark:bg-gray-600" />
        <div className="grid grid-cols-4 relative">
          {stages.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-center px-2"
            >
              <span
                className={`relative z-10 h-9 w-9 rounded-full ${s.color} ring-4 ring-white dark:ring-gray-800/40 flex items-center justify-center`}
              >
                <span className="h-2 w-2 rounded-full bg-white/90" />
              </span>
              <p className="mt-3 text-sm font-semibold tracking-tight">
                {s.label}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {s.sub}
              </p>
              <p className="mt-3 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed max-w-[180px]">
                {s.note}
              </p>
            </div>
          ))}
        </div>
      </div>
      <ul className="sm:hidden space-y-6">
        {stages.map((s) => (
          <li key={s.label} className="flex gap-4">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${s.color}`} />
            <div>
              <p className="text-sm font-semibold tracking-tight">
                {s.label}{" "}
                <span className="text-gray-500 dark:text-gray-400 font-normal">
                  &middot; {s.sub}
                </span>
              </p>
              <p className="mt-1 text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {s.note}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Pricing ---

const tiers = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    description: "Get started, no card needed.",
    features: [
      "5 vault entries",
      "1 successor",
      "Dead man's switch",
      "Zero-knowledge encryption",
    ],
    cta: "Get started",
    ctaLink: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 7,
    annual: 70,
    description: "Everything one person needs.",
    features: [
      "Unlimited entries",
      "Up to 5 successors",
      "Shamir's Secret Sharing",
      "Audit logs & export",
      "Priority support",
    ],
    cta: "Start Pro",
    ctaLink: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Family",
    monthly: 15,
    annual: 150,
    description: "For a household or small team.",
    features: [
      "Everything in Pro",
      "Unlimited successors",
      "Per-entry access",
      "Custom thresholds",
      "Webhooks",
    ],
    cta: "Start Family",
    ctaLink: "/register?plan=family",
    highlighted: false,
  },
];

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      className="py-20 sm:py-28 border-t border-stone-200/70 dark:border-gray-800 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeIn} className="max-w-2xl mb-12">
          <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Start free. Pay only when it&rsquo;s worth it.
          </h2>
        </motion.div>

        <div className="inline-flex items-center rounded-full bg-white dark:bg-gray-800/40 ring-1 ring-stone-200 dark:ring-gray-700 p-1 mb-10 text-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full transition ${
              !annual
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full transition ${
              annual
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Annual
            <span className="ml-1.5 text-[11px] text-amber-700 dark:text-amber-400">
              -17%
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              {...fadeIn}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`relative rounded-2xl p-7 ring-1 transition ${
                t.highlighted
                  ? "bg-amber-50/60 dark:bg-amber-900/10 ring-amber-200/80 dark:ring-amber-800/40"
                  : "bg-white dark:bg-gray-800/40 ring-stone-200 dark:ring-gray-700"
              }`}
            >
              {t.highlighted && (
                <span className="absolute top-4 right-4 text-[10px] font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold tracking-tight">{t.name}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t.description}
              </p>
              <div className="mt-6">
                <span className="text-4xl font-semibold tracking-tight">
                  ${annual ? Math.round(t.annual / 12) : t.monthly}
                </span>
                {t.monthly > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {" "}
                    / month
                  </span>
                )}
                {annual && t.annual > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Billed ${t.annual} yearly
                  </p>
                )}
              </div>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[14px] text-gray-700 dark:text-gray-300"
                  >
                    <CheckGlyph />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={t.ctaLink}
                className={`mt-8 ${
                  t.highlighted ? btnPrimary : btnGhost
                } w-full justify-center ring-1 ${
                  t.highlighted
                    ? "ring-transparent"
                    : "ring-stone-200 dark:ring-gray-700"
                }`}
              >
                {t.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- FAQ ---

const faqItems = [
  {
    q: "Can Handoverkey staff read my data?",
    a: "No. Your master password derives an encryption key inside your browser. The server only ever stores ciphertext. We never see your password, your key, or your data.",
  },
  {
    q: "What happens if I forget to check in?",
    a: "You'll receive email reminders at 75, 85, and 95 % of your inactivity window. After that, there's a 48-hour grace period where one login cancels everything. Only after the grace period passes are successors notified.",
  },
  {
    q: "Do my successors need a Handoverkey account?",
    a: "No. They're identified by email and verified through a one-time link. When handover triggers, they receive their key share and a secure access link. Decryption happens in their browser.",
  },
  {
    q: "What can I store?",
    a: "Passwords, API keys, crypto seed phrases, notes, legal documents, and files. Everything is encrypted client-side and can be searched, tagged, exported, and imported.",
  },
  {
    q: "What if Handoverkey shuts down?",
    a: "Handoverkey is open source, and the Export feature gives you your full encrypted vault as JSON anytime. Your data is never locked in.",
  },
  {
    q: "Can I pause it for vacation?",
    a: "Yes. Pause inactivity monitoring from Settings, indefinitely or until a specific date. While paused, the timer doesn't advance.",
  },
];

function FAQSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-stone-200/70 dark:border-gray-800">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <motion.div {...fadeIn} className="mb-12">
          <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
            Questions
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            The things people ask first.
          </h2>
        </motion.div>
        <div className="divide-y divide-stone-200 dark:divide-gray-800 border-y border-stone-200 dark:border-gray-800">
          {faqItems.map((item) => (
            <FAQItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
        <p className="mt-10 text-sm text-gray-600 dark:text-gray-400">
          Still curious?{" "}
          <Link
            to="/contact"
            className="text-gray-900 dark:text-white underline underline-offset-4 decoration-amber-500 hover:decoration-2"
          >
            Get in touch
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const id = `faq-${question.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
      >
        <span className="text-base font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition">
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-gray-400"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <p className="pb-5 pr-10 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Waitlist ---

function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await api.post("/waitlist", { email, source: "landing" });
      setStatus("success");
      setMessage("You're on the list. We'll write when Pro & Family open.");
      setEmail("");
    } catch (err: unknown) {
      setStatus("error");
      const error = err as { response?: { data?: { error?: string } } };
      setMessage(
        error.response?.data?.error || "Something went wrong. Try again.",
      );
    }
  };

  return (
    <section className="py-20 sm:py-24 border-t border-stone-200/70 dark:border-gray-800">
      <div className="max-w-xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
          Stay in touch
        </p>
        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Get a note when paid plans launch.
        </h3>
        <p className="mt-3 text-[15px] text-gray-600 dark:text-gray-400">
          Early access. No marketing list.
        </p>
        <form
          onSubmit={submit}
          className="mt-7 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder="you@example.com"
            required
            className="flex-1 rounded-full bg-white dark:bg-gray-800 ring-1 ring-stone-200 dark:ring-gray-700 px-5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className={`${btnPrimary} justify-center disabled:opacity-60`}
          >
            {status === "loading"
              ? "Joining…"
              : status === "success"
                ? "Joined"
                : "Join"}
          </button>
        </form>
        {message && (
          <p
            className={`mt-3 text-sm ${
              status === "success"
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

// --- Closing CTA ---

function ClosingCTA() {
  return (
    <section className="py-24 border-t border-stone-200/70 dark:border-gray-800">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
          A vault that opens
          <br />
          <span className="text-amber-700 dark:text-amber-400">
            only when it should.
          </span>
        </h2>
        <p className="mt-4 text-[15px] text-gray-600 dark:text-gray-400">
          Two minutes to set up. Decades of quiet protection.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <Link to="/register" className={btnPrimary}>
            Start a vault
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// --- Footer ---

function Footer() {
  return (
    <footer className="border-t border-stone-200/70 dark:border-gray-800 py-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <BrandMark className="h-5 w-5" />
          <span>Handoverkey &middot; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            to="/privacy"
            className="hover:text-gray-900 dark:hover:text-white transition"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-gray-900 dark:hover:text-white transition"
          >
            Terms
          </Link>
          <Link
            to="/contact"
            className="hover:text-gray-900 dark:hover:text-white transition"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ---------- Inline SVG glyphs ----------

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M12 2 4 5v7c0 4.5 3 8.5 8 10 5-1.5 8-5.5 8-10V5l-8-3Z"
        className="fill-amber-100 dark:fill-amber-900/40 stroke-amber-700 dark:stroke-amber-400"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="11" r="2.4" className="fill-amber-500" />
      <rect
        x="11.2"
        y="11"
        width="1.6"
        height="3.2"
        className="fill-amber-500"
      />
    </svg>
  );
}

function VaultGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="6"
        y="9"
        width="36"
        height="30"
        rx="3"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
      />
      <circle
        cx="24"
        cy="24"
        r="9"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="24" r="2.2" className="fill-amber-500" />
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="17"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12"
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="24"
        cy="24"
        r="15"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
      />
      <path
        d="M24 24V14"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 24l7 4"
        className="stroke-amber-500"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EnvelopeKeyGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="5"
        y="12"
        width="30"
        height="22"
        rx="2"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
      />
      <path
        d="M5 14l15 11 15-11"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="33" r="6" className="fill-amber-500" />
      <circle
        cx="36"
        cy="33"
        r="1.8"
        className="fill-[#FAF7F2] dark:fill-gray-900"
      />
      <rect x="35.2" y="33" width="1.6" height="6" className="fill-amber-500" />
    </svg>
  );
}

function KeyGlyph() {
  return (
    <svg
      viewBox="0 0 64 48"
      className="h-10 w-14"
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="14"
        cy="24"
        r="9"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
      />
      <circle cx="14" cy="24" r="3" className="fill-amber-500" />
      <path
        d="M23 24h28"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M44 24v6M50 24v8"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TimerGlyph() {
  return (
    <svg
      viewBox="0 0 64 48"
      className="h-10 w-14"
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="32"
        cy="26"
        r="13"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
      />
      <path
        d="M32 26V16"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M32 26l8 4"
        className="stroke-amber-500"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M27 9h10M32 9v4"
        className="stroke-gray-700 dark:stroke-gray-200"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SplitGlyph() {
  return (
    <svg
      viewBox="0 0 64 48"
      className="h-10 w-14"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="14" cy="24" r="6" className="fill-amber-500" />
      <circle
        cx="32"
        cy="12"
        r="5"
        className="fill-stone-300 dark:fill-gray-600"
      />
      <circle
        cx="32"
        cy="36"
        r="5"
        className="fill-stone-300 dark:fill-gray-600"
      />
      <circle cx="50" cy="24" r="6" className="fill-amber-500" />
      <line
        x1="14"
        y1="24"
        x2="50"
        y2="24"
        className="stroke-amber-400"
        strokeWidth="1"
      />
      <line
        x1="14"
        y1="24"
        x2="32"
        y2="12"
        className="stroke-stone-300 dark:stroke-gray-600"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="50"
        y1="24"
        x2="32"
        y2="36"
        className="stroke-stone-300 dark:stroke-gray-600"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 8 3.5 3.5L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
