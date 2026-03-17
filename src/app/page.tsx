"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Zap,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  ChevronDown,
  Instagram,
  Menu,
  X,
  Sparkles,
  Target,
  Users,
  TrendingUp,
} from "lucide-react";

// ============================================================
// MARKETING NAV
// ============================================================
function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">
              Comment<span className="text-primary">2DM</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1.5">
                Start free <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3">
            {["features", "how-it-works", "pricing", "faq"].map((item) => (
              <Link
                key={item}
                href={`#${item}`}
                className="block text-sm text-muted-foreground py-2 capitalize"
                onClick={() => setMobileOpen(false)}
              >
                {item.replace("-", " ")}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full">Start free</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-purple-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-100/30 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
        {/* Announcement pill */}
        <div className="flex justify-center mb-8">
          <Badge
            variant="default"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-full"
          >
            <Sparkles className="w-3 h-3" />
            Now supporting Instagram & Facebook
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
          Turn comments into{" "}
          <span className="gradient-text">conversations</span>
          <br />
          automatically.
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10 leading-relaxed">
          Automatically DM people on Instagram and Facebook when they comment
          your chosen keywords - capture leads, share offers, and grow
          engagement on autopilot.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/signup">
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/30 px-8">
              Start for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="gap-2 px-8">
            Watch demo
          </Button>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span>4.9/5 from early users</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>GDPR compliant</span>
          </div>
        </div>

        {/* Product preview card */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-1 shadow-2xl shadow-purple-200/50 border border-white/60">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-slate-700 rounded-md px-4 py-1 text-xs text-slate-400 text-left">
                  comment2dm.com/dashboard
                </div>
              </div>

              {/* Mock dashboard */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "DMs Sent", value: "12,847", up: true },
                  { label: "Keywords Matched", value: "18,293", up: true },
                  { label: "Active Rules", value: "24", up: false },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-slate-800/80 rounded-xl p-3 text-left"
                  >
                    <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className="text-green-400 text-xs mt-1">
                      up 23% this month
                    </p>
                  </div>
                ))}
              </div>

              {/* Mock rule card */}
              <div className="bg-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">
                      Send pricing info
                    </p>
                    <p className="text-slate-400 text-xs">
                      Keywords: price, pricing, cost, how much
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                  <span className="text-slate-400 text-xs">4,201 sent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HOW IT WORKS
// ============================================================
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: <Instagram className="w-6 h-6" />,
      title: "Connect your accounts",
      description:
        "Link your Facebook Page and Instagram Professional account securely through Meta's official OAuth.",
    },
    {
      number: "02",
      icon: <Target className="w-6 h-6" />,
      title: "Set your keywords",
      description:
        "Define the keywords that trigger automation. When someone comments 'price', 'join', or any word you choose - it fires.",
    },
    {
      number: "03",
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Auto-send your DM",
      description:
        "Your personalized message is automatically sent to every commenter who matches your keywords. Instantly.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            How it works
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Set up in under 5 minutes
          </h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            No coding required. No complex setup. Just connect, configure, and
            watch leads roll in.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative flex flex-col items-start p-8 rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100"
            >
              <span className="text-6xl font-black text-violet-100 absolute top-6 right-6">
                {step.number}
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES
// ============================================================
function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Instant keyword matching",
      description:
        "Real-time webhook processing means DMs are sent within seconds of a comment being posted.",
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Personalized message templates",
      description:
        "Use dynamic variables like {{commenter_name}} and {{keyword}} to make every message feel personal.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Smart deduplication",
      description:
        "Built-in cooldown logic prevents spamming the same person. Configurable per rule.",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Analytics dashboard",
      description:
        "Track every comment, match, and sent DM. See what's working and optimize your funnels.",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Multi-account support",
      description:
        "Connect multiple Facebook Pages and Instagram accounts. Manage everything from one workspace.",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Delivery logs",
      description:
        "Full audit trail of every outbound message - status, retry count, and failure reasons included.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Everything you need to automate
          </h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            A complete automation platform built for creators, marketers, and
            growing businesses.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// USE CASES
// ============================================================
function UseCasesSection() {
  const cases = [
    {
      keyword: '"price"',
      message: "Hey! Thanks for asking  Here's our pricing: link.to/pricing",
      color: "from-violet-500 to-purple-600",
    },
    {
      keyword: '"guide"',
      message:
        "Here's the free guide you asked for! Download it here: link.to/guide",
      color: "from-blue-500 to-cyan-600",
    },
    {
      keyword: '"join"',
      message:
        "Welcome! Here's your invitation link to join our community: link.to/join",
      color: "from-green-500 to-emerald-600",
    },
    {
      keyword: '"course"',
      message:
        "Awesome! Here's how to enroll in our course: link.to/enroll ",
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Use cases
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Works for any offer or funnel
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-lg bg-gradient-to-r text-white text-sm font-bold shrink-0",
                    c.color
                  )}
                >
                  Comment {c.keyword}
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-foreground border border-slate-100">
                  Message: {c.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PRICING
// ============================================================
function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect to get started",
      features: [
        "1 connected account",
        "3 automation rules",
        "100 actions/month",
        "Email support",
      ],
      cta: "Get started free",
      highlight: false,
    },
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "For growing creators",
      features: [
        "3 connected accounts",
        "5 automation rules",
        "1,000 actions/month",
        "Priority email support",
        "Analytics dashboard",
      ],
      cta: "Start with Starter",
      highlight: true,
      badge: "Most popular",
    },
    {
      name: "Pro",
      price: "$79",
      period: "/month",
      description: "For serious businesses",
      features: [
        "Unlimited connected accounts",
        "Unlimited automation rules",
        "10,000 actions/month",
        "Priority support",
        "Advanced analytics",
        "API access",
        "Custom branding (soon)",
      ],
      cta: "Go Pro",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free. Scale when you are ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn(
                "relative flex flex-col rounded-2xl p-8",
                plan.highlight
                  ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 scale-105"
                  : "bg-white border border-border shadow-sm"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={cn(
                    "text-lg font-bold mb-1",
                    plan.highlight
                      ? "text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    "text-sm mb-4",
                    plan.highlight ? "text-white/70" : "text-muted-foreground"
                  )}
                >
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-4xl font-black",
                      plan.highlight ? "text-white" : "text-foreground"
                    )}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      plan.highlight ? "text-white/70" : "text-muted-foreground"
                    )}
                  >
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle
                      className={cn(
                        "w-4 h-4 shrink-0",
                        plan.highlight ? "text-white/70" : "text-green-500"
                      )}
                    />
                    <span
                      className={
                        plan.highlight ? "text-white/90" : "text-foreground"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <Button
                  className={cn(
                    "w-full",
                    plan.highlight
                      ? "bg-white text-primary hover:bg-white/90"
                      : ""
                  )}
                  variant={plan.highlight ? "outline" : "default"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Does this use official Meta APIs?",
      a: "Yes. Comment2DM uses only the official Meta Graph API through their approved webhook system. No scraping, no unofficial methods.",
    },
    {
      q: "Will my Instagram account get banned?",
      a: "No. We use official Meta Messenger and Instagram Direct APIs. Your account is never at risk of being flagged for using our service.",
    },
    {
      q: "What types of accounts are supported?",
      a: "Facebook Pages and Instagram Professional accounts (Business or Creator) that are connected to a Facebook Page.",
    },
    {
      q: "How fast are DMs sent after a comment?",
      a: "Within seconds. Our webhook system processes Meta events in real time and queues messages immediately.",
    },
    {
      q: "Can I prevent sending duplicate DMs?",
      a: "Yes. Each rule has configurable cooldown settings - once per post per user, or once per 24 hours per user.",
    },
    {
      q: "Can I use multiple keywords per rule?",
      a: "Absolutely. Each rule supports multiple keywords, and you can choose between 'contains' and 'exact match' modes.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-foreground">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform duration-200",
                    open === i ? "rotate-180" : ""
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER CTA
// ============================================================
function FooterCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-violet-600 to-purple-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Ready to automate your engagement?
        </h2>
        <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
          Join hundreds of creators turning comment engagement into real business
          results.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg px-8"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <p className="text-white/60 text-sm mt-6">
          No credit card required �- Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">
                Comment<span className="text-violet-400">2DM</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Turn comments into conversations automatically.
            </p>
          </div>
          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Changelog", "Roadmap"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">�(c) 2026 Comment2DM. All rights reserved.</p>
          <p className="text-sm">Built with love for creators everywhere.</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// PAGE EXPORT
// ============================================================
export default function LandingPage() {
  return (
    <div className="bg-white">
      <MarketingNav />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <UseCasesSection />
      <PricingSection />
      <FAQSection />
      <FooterCTA />
      <Footer />
    </div>
  );
}



