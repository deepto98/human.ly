import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "../ui/logo";
import { cn } from "@/utils/misc";
import { buttonVariants } from "@/ui/button-util";
import { Loader2, ArrowRight, Sparkles, Users, Brain } from "lucide-react";
import { Button } from "@/ui/button";
import siteConfig from "~/site.config";
import { useConvexAuth } from "@convex-dev/react-query";
import { Route as DashboardRoute } from "@/routes/_app/_auth/dashboard/_layout.index";
import { motion } from "framer-motion";
import { AuthModal } from "@/ui/auth-modal";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate({ to: DashboardRoute.fullPath });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="relative min-h-screen w-full bg-amber-50">
      {/* Navigation - Neobrutalist style */}
      <nav className="sticky top-0 z-50 border-b-[4px] border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <Link to="/" className="flex items-center">
            <Logo showText={true} />
            {/* Underline */}
            <div className="absolute left-0 top-full h-[2px] w-24 bg-orange-400"></div>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to={DashboardRoute.fullPath}
                className={cn(
                  "relative border-[3px] border-black bg-orange-400 px-6 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] text-black"
                )}
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                disabled={isLoading}
                className={cn(
                  "relative border-[3px] border-black bg-orange-400 px-6 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] text-black"
                )}
              >
                {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2 inline text-black" />}
                {!isLoading && "Get Started"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="mb-8 inline-block">
              <div className="relative">
                <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                <div className="relative border-[3px] border-black bg-cyan-300 px-4 py-2">
                  <span className="flex items-center gap-2 font-bold uppercase text-black">
                    <Sparkles className="h-4 w-4" />
                    Reinventing Interviews
                  </span>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-6xl font-black leading-tight text-black md:text-8xl lg:text-9xl">
              Interview
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Humanly</span>
                <span className="absolute -bottom-2 left-0 h-6 w-full bg-orange-400 -rotate-1"></span>
              </span>
            </h1>

            {/* Subheading */}
            <p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-gray-800 md:text-2xl">
              Create AI-powered interview agents that adapt, evaluate, and
              engage. Transform how you assess talent with intelligent,
              conversational interviews.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => setShowAuthModal(true)}
                className="group relative"
              >
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-orange-400 px-8 py-4 font-bold uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px]">
                  <span className="flex items-center gap-2 text-lg">
                    Create Your Agent
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 h-20 w-20 border-[4px] border-black bg-lime-300 rotate-12 hidden lg:block"></div>
          <div className="absolute bottom-20 right-10 h-24 w-24 border-[4px] border-black bg-pink-300 -rotate-6 hidden lg:block"></div>
          <div className="absolute top-40 right-20 h-16 w-16 rounded-full border-[4px] border-black bg-yellow-300 hidden lg:block"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white border-y-[4px] border-black">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-5xl font-black text-black md:text-6xl">
            Why Humanly?
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-cyan-200 p-8 h-full">
                <div className="mb-4 inline-block rounded-full border-[3px] border-black bg-white p-3">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-black">
                  AI-Powered Agents
                </h3>
                <p className="text-gray-800 font-medium">
                  Design intelligent interview agents with custom knowledge sources,
                  personalities, and evaluation criteria.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-lime-200 p-8 h-full">
                <div className="mb-4 inline-block rounded-full border-[3px] border-black bg-white p-3">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-black">
                  Interactive Interviews
                </h3>
                <p className="text-gray-800 font-medium">
                  Candidates engage with human-like avatars that speak, listen,
                  and adapt based on their responses.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
              <div className="relative border-[4px] border-black bg-pink-200 p-8 h-full">
                <div className="mb-4 inline-block rounded-full border-[3px] border-black bg-white p-3">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-black">
                  Smart Evaluation
                </h3>
                <p className="text-gray-800 font-medium">
                  Multi-agent AI system evaluates responses, asks follow-ups,
                  and provides detailed scoring insights.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-amber-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-5xl font-black text-black md:text-6xl">
            How It Works
          </h2>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative flex-shrink-0">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-orange-300 p-6 w-24 h-24 flex items-center justify-center">
                  <span className="text-5xl font-black">1</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-3xl font-bold text-black">
                  Define Knowledge Sources
                </h3>
                <p className="text-lg text-gray-800 font-medium">
                  Choose from topics, URLs, web search, or upload documents.
                  Our AI scrapes and understands the content to generate relevant questions.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="relative flex-shrink-0">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-cyan-300 p-6 w-24 h-24 flex items-center justify-center">
                  <span className="text-5xl font-black">2</span>
                </div>
              </div>
              <div className="flex-1 text-right md:text-right">
                <h3 className="mb-2 text-3xl font-bold text-black">
                  Build Your Questionnaire
                </h3>
                <p className="text-lg text-gray-800 font-medium">
                  Generate MCQ and subjective questions automatically.
                  Edit, customize, and set marks for each question.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative flex-shrink-0">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-lime-300 p-6 w-24 h-24 flex items-center justify-center">
                  <span className="text-5xl font-black">3</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-3xl font-bold text-black">
                  Configure Agent Behavior
                </h3>
                <p className="text-lg text-gray-800 font-medium">
                  Customize your agent's name, voice, appearance, and conversational
                  style. Set follow-up preferences and publish.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="relative flex-shrink-0">
                <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
                <div className="relative border-[4px] border-black bg-pink-300 p-6 w-24 h-24 flex items-center justify-center">
                  <span className="text-5xl font-black">4</span>
                </div>
              </div>
              <div className="flex-1 text-right md:text-right">
                <h3 className="mb-2 text-3xl font-bold text-black">
                  Share & Analyze
                </h3>
                <p className="text-lg text-gray-800 font-medium">
                  Share the interview link with candidates. Review their performance,
                  scores, and recorded sessions in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-white border-t-[4px] border-black">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-5xl font-black text-black md:text-6xl">
            Ready to Transform
            <br />
            Your Interviews?
          </h2>
          <p className="mb-12 text-xl text-gray-800 font-medium">
            Join the future of talent assessment. Create your first AI interview
            agent in minutes.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="group inline-block relative"
          >
            <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
            <div className="relative border-[4px] border-black bg-orange-400 px-12 py-5 font-bold uppercase text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px]">
              <span className="flex items-center gap-2">
                Start Free Today
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[4px] border-black bg-amber-50 py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Logo showText={true} />
            <p className="text-sm font-medium text-gray-700">
              © 2024 {siteConfig.siteTitle}. Reinventing interviews with AI.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
