import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import api from "../services/api";
import BrandMark from "../components/BrandMark";
import Footer from "../components/Footer";

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
      <WhatItIs />
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

// --- What it is (plain-English intro with a 4-actor flow diagram) ---

function WhatItIs() {
  return (
    <section className="py-20 sm:py-28 border-t border-stone-200/70 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <motion.div {...fadeIn}>
              <p className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400 mb-3">
                What it is
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
                A safety net for the things only you can unlock.
              </h2>
              <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                If you go missing, get hospitalized, or simply stop responding,
                the passwords and keys in your head go with you. Handoverkey is
                the boring, durable plan B: an encrypted vault that quietly
                hands itself to the people you chose &mdash; only after enough
                time has passed.
              </p>
              <ul className="mt-7 space-y-3 text-[15px] text-gray-700 dark:text-gray-300">
                <li className="flex gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[11px] font-semibold shrink-0">
                    1
                  </span>
                  <span>
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      You
                    </strong>{" "}
                    store encrypted secrets and pick your successors.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[11px] font-semibold shrink-0">
                    2
                  </span>
                  <span>
                    A{" "}
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      timer
                    </strong>{" "}
                    waits for your silence. Every login resets it.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[11px] font-semibold shrink-0">
                    3
                  </span>
                  <span>
                    When the timer expires, your{" "}
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      successors
                    </strong>{" "}
                    each get a piece. Combined, they unlock the vault.
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>
          <div className="lg:col-span-7">
            <FlowDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}

// A 4-stage horizontal flow: You -> Vault -> Silence -> Successors
function FlowDiagram() {
  const ringStroke = "stroke-stone-300 dark:stroke-gray-600";
  const labelClass =
    "fill-gray-900 dark:fill-gray-100 text-[11px] font-semibold";
  const subLabelClass = "fill-gray-500 dark:fill-gray-400 text-[9px]";

  return (
    <motion.div {...fadeIn} className="relative">
      <svg
        viewBox="0 0 560 280"
        className="w-full h-auto"
        aria-label="You store secrets in a vault; a timer waits for your silence; if the timer expires, your successors combine their shares to unlock the vault."
      >
        {/* connecting line */}
        <line
          x1="70"
          y1="140"
          x2="490"
          y2="140"
          className={ringStroke}
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {/* arrowheads between nodes */}
        {[180, 320, 460].map((x) => (
          <path
            key={x}
            d={`M ${x - 5} 136 L ${x + 1} 140 L ${x - 5} 144`}
            className="fill-none stroke-stone-400 dark:stroke-gray-500"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* 1. You */}
        <g>
          <circle
            cx="70"
            cy="140"
            r="36"
            className="fill-white dark:fill-gray-800"
          />
          <circle
            cx="70"
            cy="140"
            r="36"
            className={ringStroke}
            fill="none"
            strokeWidth="1.5"
          />
          {/* person silhouette */}
          <circle
            cx="70"
            cy="130"
            r="6"
            className="fill-gray-700 dark:fill-gray-200"
          />
          <path
            d="M 56 156 C 56 146, 84 146, 84 156 L 84 158 L 56 158 Z"
            className="fill-gray-700 dark:fill-gray-200"
          />
          <text x="70" y="208" textAnchor="middle" className={labelClass}>
            You
          </text>
          <text x="70" y="222" textAnchor="middle" className={subLabelClass}>
            store secrets
          </text>
        </g>

        {/* 2. Vault */}
        <g>
          <circle
            cx="250"
            cy="140"
            r="36"
            className="fill-white dark:fill-gray-800"
          />
          <circle
            cx="250"
            cy="140"
            r="36"
            className={ringStroke}
            fill="none"
            strokeWidth="1.5"
          />
          {/* vault face: dial */}
          <circle
            cx="250"
            cy="140"
            r="18"
            className="fill-stone-100 dark:fill-gray-700"
          />
          <circle
            cx="250"
            cy="140"
            r="18"
            className={ringStroke}
            fill="none"
            strokeWidth="1"
          />
          <line
            x1="250"
            y1="140"
            x2="250"
            y2="128"
            className="stroke-gray-900 dark:stroke-gray-100"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle
            cx="250"
            cy="140"
            r="2"
            className="fill-gray-900 dark:fill-gray-100"
          />
          <text x="250" y="208" textAnchor="middle" className={labelClass}>
            Vault
          </text>
          <text x="250" y="222" textAnchor="middle" className={subLabelClass}>
            zero-knowledge
          </text>
        </g>

        {/* 3. Timer (silence) */}
        <g>
          <circle
            cx="390"
            cy="140"
            r="36"
            className="fill-white dark:fill-gray-800"
          />
          <circle
            cx="390"
            cy="140"
            r="36"
            className={ringStroke}
            fill="none"
            strokeWidth="1.5"
          />
          {/* timer ring fill */}
          <motion.circle
            cx="390"
            cy="140"
            r="22"
            stroke="currentColor"
            className="text-stone-200 dark:text-gray-700"
            strokeWidth="3"
            fill="none"
          />
          <motion.circle
            cx="390"
            cy="140"
            r="22"
            stroke="currentColor"
            className="text-amber-500"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="138"
            initial={{ strokeDashoffset: 138 }}
            whileInView={{ strokeDashoffset: 35 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            transform="rotate(-90 390 140)"
          />
          <text
            x="390"
            y="144"
            textAnchor="middle"
            className="fill-gray-900 dark:fill-gray-100 text-[10px] font-semibold"
          >
            75%
          </text>
          <text x="390" y="208" textAnchor="middle" className={labelClass}>
            Silence
          </text>
          <text x="390" y="222" textAnchor="middle" className={subLabelClass}>
            timer counts down
          </text>
        </g>

        {/* 4. Successors */}
        <g>
          <circle
            cx="510"
            cy="140"
            r="36"
            className="fill-white dark:fill-gray-800"
          />
          <circle
            cx="510"
            cy="140"
            r="36"
            className={ringStroke}
            fill="none"
            strokeWidth="1.5"
          />
          {/* three small avatars */}
          <circle cx="498" cy="135" r="7" className="fill-amber-500" />
          <circle cx="510" cy="130" r="7" className="fill-amber-500" />
          <circle cx="522" cy="135" r="7" className="fill-amber-500" />
          <circle
            cx="498"
            cy="148"
            r="3"
            className="fill-stone-300 dark:fill-gray-600"
          />
          <circle
            cx="510"
            cy="143"
            r="3"
            className="fill-stone-300 dark:fill-gray-600"
          />
          <circle
            cx="522"
            cy="148"
            r="3"
            className="fill-stone-300 dark:fill-gray-600"
          />
          <text x="510" y="208" textAnchor="middle" className={labelClass}>
            Successors
          </text>
          <text x="510" y="222" textAnchor="middle" className={subLabelClass}>
            unlock together
          </text>
        </g>
      </svg>
    </motion.div>
  );
}

// --- How it works (three illustrated scenes) ---

function HowItWorks() {
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
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1]">
            Set it up once. It quietly does its job for years.
          </h2>
        </motion.div>

        <div className="mt-16 space-y-24 sm:space-y-32">
          <Step
            index={1}
            label="Store"
            title="Your secrets are encrypted before they ever leave your browser."
            body={[
              "Add passwords, recovery phrases, files, and notes to your vault. Your master password derives an encryption key locally — the server only sees ciphertext.",
              "If we get hacked, breached, or subpoenaed, attackers and lawyers see the same thing: encrypted blobs we cannot decrypt.",
            ]}
            scene={<EncryptionScene />}
            highlight={[
              "Argon2id key derivation",
              "AES-256-GCM",
              "No plaintext leaves your device",
            ]}
            align="left"
          />

          <Step
            index={2}
            label="Wait"
            title="The dead man's switch watches for your silence."
            body={[
              "You set the inactivity window — 30 days, 6 months, 5 years. Every time you log in, click a check-in link, or use the vault, the timer resets to zero.",
              "As the window closes, you get email reminders at 75%, 85%, and 95%. One click is enough to reset the timer for another full cycle.",
            ]}
            scene={<CountdownScene />}
            highlight={[
              "30-365 day window",
              "Three graduated reminders",
              "Pause anytime for vacation",
            ]}
            align="right"
          />

          <Step
            index={3}
            label="Hand over"
            title="The vault opens only when enough successors agree."
            body={[
              "When the timer fully expires and a 48-hour grace period passes, each successor receives a unique encrypted share and a secure link.",
              "Using Shamir's Secret Sharing, the key is mathematically split: any quorum (say, 3 of 5) can reconstruct it together — but no single successor ever holds enough to act alone.",
            ]}
            scene={<ReconstructScene />}
            highlight={[
              "Shamir's Secret Sharing",
              "Quorum you choose (k-of-n)",
              "Decrypted in their browser, not ours",
            ]}
            align="left"
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  index,
  label,
  title,
  body,
  scene,
  highlight,
  align,
}: {
  index: number;
  label: string;
  title: string;
  body: string[];
  scene: React.ReactNode;
  highlight: string[];
  align: "left" | "right";
}) {
  return (
    <motion.div
      {...fadeIn}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
    >
      <div className={`lg:col-span-6 ${align === "right" ? "lg:order-2" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold">
            {index}
          </span>
          <span className="text-xs font-medium tracking-wider uppercase text-amber-700 dark:text-amber-400">
            {label}
          </span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-[1.15]">
          {title}
        </h3>
        <div className="mt-5 space-y-4">
          {body.map((p, i) => (
            <p
              key={i}
              className="text-[15px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              {p}
            </p>
          ))}
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
          {highlight.map((h) => (
            <li
              key={h}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {h}
            </li>
          ))}
        </ul>
      </div>
      <div className={`lg:col-span-6 ${align === "right" ? "lg:order-1" : ""}`}>
        <div className="relative rounded-2xl bg-white dark:bg-gray-800/40 ring-1 ring-stone-200 dark:ring-gray-700 p-6 sm:p-8 overflow-hidden">
          {scene}
        </div>
      </div>
    </motion.div>
  );
}

// Scene 1: encryption in browser — input fields turning into ciphertext
function EncryptionScene() {
  return (
    <svg viewBox="0 0 400 260" className="w-full h-auto" aria-hidden="true">
      {/* browser chrome */}
      <rect
        x="20"
        y="20"
        width="360"
        height="220"
        rx="10"
        className="fill-stone-50 dark:fill-gray-900 stroke-stone-200 dark:stroke-gray-700"
        strokeWidth="1"
      />
      <rect
        x="20"
        y="20"
        width="360"
        height="26"
        rx="10"
        className="fill-stone-100 dark:fill-gray-800"
      />
      <circle cx="34" cy="33" r="3" className="fill-rose-400" />
      <circle cx="46" cy="33" r="3" className="fill-amber-400" />
      <circle cx="58" cy="33" r="3" className="fill-emerald-400" />
      <rect
        x="80"
        y="27"
        width="280"
        height="12"
        rx="6"
        className="fill-white dark:fill-gray-700"
      />
      <text
        x="92"
        y="36"
        className="fill-gray-400 dark:fill-gray-500 text-[9px] font-mono"
      >
        handoverkey.app
      </text>

      {/* left: plaintext input */}
      <g>
        <text
          x="40"
          y="70"
          className="fill-gray-500 dark:fill-gray-400 text-[10px] font-medium tracking-wider uppercase"
        >
          Your secret
        </text>
        <rect
          x="40"
          y="78"
          width="140"
          height="26"
          rx="6"
          className="fill-white dark:fill-gray-800 stroke-stone-200 dark:stroke-gray-700"
          strokeWidth="1"
        />
        <text
          x="50"
          y="95"
          className="fill-gray-700 dark:fill-gray-200 text-[11px] font-mono"
        >
          BTC seed phrase
        </text>
        <rect
          x="40"
          y="112"
          width="140"
          height="26"
          rx="6"
          className="fill-white dark:fill-gray-800 stroke-stone-200 dark:stroke-gray-700"
          strokeWidth="1"
        />
        <text
          x="50"
          y="129"
          className="fill-gray-700 dark:fill-gray-200 text-[11px] font-mono"
        >
          witch tornado…
        </text>

        {/* "encrypted in browser" label */}
        <rect
          x="40"
          y="160"
          width="140"
          height="50"
          rx="8"
          className="fill-amber-50 dark:fill-amber-900/20 stroke-amber-200 dark:stroke-amber-800/40"
          strokeWidth="1"
        />
        <text
          x="50"
          y="178"
          className="fill-amber-700 dark:fill-amber-400 text-[10px] font-semibold tracking-wider uppercase"
        >
          Encrypted here
        </text>
        <text
          x="50"
          y="194"
          className="fill-gray-600 dark:fill-gray-300 text-[10px]"
        >
          Argon2id → AES-256
        </text>
        <text
          x="50"
          y="206"
          className="fill-gray-500 dark:fill-gray-400 text-[9px]"
        >
          Your password never leaves
        </text>
      </g>

      {/* arrow */}
      <motion.g
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <line
          x1="190"
          y1="120"
          x2="220"
          y2="120"
          className="stroke-gray-400 dark:stroke-gray-500"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d="M 218 116 L 222 120 L 218 124"
          className="fill-none stroke-gray-400 dark:stroke-gray-500"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* right: ciphertext */}
      <g>
        <text
          x="232"
          y="70"
          className="fill-gray-500 dark:fill-gray-400 text-[10px] font-medium tracking-wider uppercase"
        >
          What we store
        </text>
        <rect
          x="232"
          y="78"
          width="128"
          height="132"
          rx="6"
          className="fill-gray-900 dark:fill-gray-950"
        />
        <text x="240" y="96" className="fill-emerald-400 text-[9px] font-mono">
          c4f9 2e1a 8d7b
        </text>
        <text x="240" y="110" className="fill-emerald-400 text-[9px] font-mono">
          5a3c 9f4e 7b21
        </text>
        <text x="240" y="124" className="fill-emerald-400 text-[9px] font-mono">
          ee08 d3a7 b69c
        </text>
        <text x="240" y="138" className="fill-emerald-400 text-[9px] font-mono">
          11fd 470a 8c52
        </text>
        <text x="240" y="152" className="fill-emerald-400 text-[9px] font-mono">
          93ab 6e2f 04d8
        </text>
        <text x="240" y="166" className="fill-emerald-400 text-[9px] font-mono">
          f5c1 a704 9e3b
        </text>
        <text x="240" y="180" className="fill-emerald-400 text-[9px] font-mono">
          27bd 84f6 c0a9
        </text>
        <text x="240" y="194" className="fill-emerald-400 text-[9px] font-mono">
          1e6c 32db 7740
        </text>
        <text x="240" y="206" className="fill-gray-500 text-[8px] font-mono">
          ...
        </text>
      </g>
    </svg>
  );
}

// Scene 2: countdown ring with stacked reminder emails
function CountdownScene() {
  return (
    <svg viewBox="0 0 400 260" className="w-full h-auto" aria-hidden="true">
      {/* large timer */}
      <g transform="translate(140 130)">
        <circle
          r="80"
          className="stroke-stone-200 dark:stroke-gray-700"
          fill="none"
          strokeWidth="2"
        />
        <motion.circle
          r="80"
          className="stroke-amber-500"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="503"
          initial={{ strokeDashoffset: 503 }}
          whileInView={{ strokeDashoffset: 75 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          transform="rotate(-90)"
        />
        {/* tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 64}
              y1={Math.sin(a) * 64}
              x2={Math.cos(a) * 70}
              y2={Math.sin(a) * 70}
              className="stroke-stone-300 dark:stroke-gray-600"
              strokeWidth="1"
              strokeLinecap="round"
            />
          );
        })}
        <text
          textAnchor="middle"
          y="-2"
          className="fill-gray-900 dark:fill-gray-100 text-[24px] font-semibold"
        >
          82
        </text>
        <text
          textAnchor="middle"
          y="14"
          className="fill-gray-500 dark:fill-gray-400 text-[10px] tracking-wider uppercase"
        >
          days left
        </text>
      </g>

      {/* reminder envelopes stack */}
      <g transform="translate(260 50)">
        <text
          x="0"
          y="-6"
          className="fill-gray-500 dark:fill-gray-400 text-[10px] font-medium tracking-wider uppercase"
        >
          Reminders
        </text>
        {[
          { y: 0, pct: "75%", color: "stroke-amber-300 dark:stroke-amber-600" },
          {
            y: 56,
            pct: "85%",
            color: "stroke-amber-400 dark:stroke-amber-500",
          },
          {
            y: 112,
            pct: "95%",
            color: "stroke-amber-500 dark:stroke-amber-400",
          },
        ].map((r, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.15 }}
          >
            <rect
              x="0"
              y={r.y}
              width="110"
              height="44"
              rx="6"
              className="fill-white dark:fill-gray-800 stroke-stone-200 dark:stroke-gray-700"
              strokeWidth="1"
            />
            <rect
              x="0"
              y={r.y}
              width="4"
              height="44"
              rx="2"
              className={`fill-current ${r.color.replace("stroke-", "text-")}`}
            />
            {/* mini envelope icon */}
            <rect
              x="12"
              y={r.y + 14}
              width="18"
              height="14"
              rx="1.5"
              className="fill-none stroke-gray-600 dark:stroke-gray-300"
              strokeWidth="1.2"
            />
            <path
              d={`M 12 ${r.y + 14} L 21 ${r.y + 23} L 30 ${r.y + 14}`}
              className="fill-none stroke-gray-600 dark:stroke-gray-300"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <text
              x="40"
              y={r.y + 20}
              className="fill-gray-900 dark:fill-gray-100 text-[10px] font-semibold"
            >
              Check in?
            </text>
            <text
              x="40"
              y={r.y + 32}
              className="fill-gray-500 dark:fill-gray-400 text-[9px]"
            >
              Timer at {r.pct}
            </text>
          </motion.g>
        ))}
      </g>
    </svg>
  );
}

// Scene 3: three key shares combining into one master key
function ReconstructScene() {
  const sx = (i: number) => 60 + i * 110;
  return (
    <svg viewBox="0 0 400 260" className="w-full h-auto" aria-hidden="true">
      {/* three successor cards with key fragments */}
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <rect
            x={sx(i) - 38}
            y="30"
            width="76"
            height="80"
            rx="8"
            className="fill-white dark:fill-gray-800 stroke-stone-200 dark:stroke-gray-700"
            strokeWidth="1"
          />
          {/* avatar */}
          <circle
            cx={sx(i)}
            cy="52"
            r="11"
            className="fill-amber-100 dark:fill-amber-900/40"
          />
          <text
            x={sx(i)}
            y="56"
            textAnchor="middle"
            className="fill-amber-700 dark:fill-amber-300 text-[11px] font-semibold"
          >
            {["A", "B", "C"][i]}
          </text>
          {/* "share" key icon */}
          <g transform={`translate(${sx(i) - 22} 74)`}>
            <circle
              cx="6"
              cy="8"
              r="5"
              className="fill-none stroke-gray-700 dark:stroke-gray-200"
              strokeWidth="1.4"
            />
            <line
              x1="10"
              y1="8"
              x2="30"
              y2="8"
              className="stroke-gray-700 dark:stroke-gray-200"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <line
              x1="26"
              y1="8"
              x2="26"
              y2="12"
              className="stroke-gray-700 dark:stroke-gray-200"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <line
              x1="30"
              y1="8"
              x2="30"
              y2="14"
              className="stroke-gray-700 dark:stroke-gray-200"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>
          <text
            x={sx(i)}
            y="103"
            textAnchor="middle"
            className="fill-gray-500 dark:fill-gray-400 text-[9px] font-mono"
          >
            share {i + 1}/3
          </text>
        </motion.g>
      ))}

      {/* converging lines */}
      {[0, 1, 2].map((i) => (
        <motion.line
          key={i}
          x1={sx(i)}
          y1="115"
          x2="200"
          y2="190"
          className="stroke-amber-400/70"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        />
      ))}

      {/* combined vault key */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <circle cx="200" cy="200" r="34" className="fill-amber-500" />
        <circle
          cx="200"
          cy="200"
          r="34"
          className="fill-none stroke-amber-600"
          strokeWidth="1.5"
        />
        {/* large key */}
        <g transform="translate(178 192)">
          <circle
            cx="6"
            cy="8"
            r="6"
            className="fill-none stroke-white"
            strokeWidth="2"
          />
          <circle cx="6" cy="8" r="2" className="fill-white" />
          <line
            x1="11"
            y1="8"
            x2="40"
            y2="8"
            className="stroke-white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="34"
            y1="8"
            x2="34"
            y2="13"
            className="stroke-white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="40"
            y1="8"
            x2="40"
            y2="15"
            className="stroke-white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </motion.g>

      <text
        x="200"
        y="252"
        textAnchor="middle"
        className="fill-gray-900 dark:fill-gray-100 text-[11px] font-semibold"
      >
        Vault unlocked
      </text>
    </svg>
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
// Footer is the shared `<Footer />` component imported at the top of the file.

// ---------- Inline SVG glyphs ----------

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
