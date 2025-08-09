import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, TrendingUp, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function Welcome() {
  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          From Idea to{" "}
          <span className="relative">
            Viral
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="absolute bottom-2 left-0 right-0 h-2 bg-white/30 rounded-full"
            />
          </span>
          <br />
          in Minutes
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          AI-powered short-form video creation that turns your ideas into viral content across TikTok, Instagram, and YouTube
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto"
        >
          <div className="glass text-center p-6 rounded-xl">
            <Zap className="w-8 h-8 text-white mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-white/80 text-sm">Generate viral videos in under 60 seconds</p>
          </div>
          <div className="glass text-center p-6 rounded-xl">
            <TrendingUp className="w-8 h-8 text-white mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Trend-Aware</h3>
            <p className="text-white/80 text-sm">Auto-syncs with latest trends and sounds</p>
          </div>
          <div className="glass text-center p-6 rounded-xl">
            <Play className="w-8 h-8 text-white mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Multi-Platform</h3>
            <p className="text-white/80 text-sm">Publish to TikTok, Instagram & YouTube</p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/onboarding">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-4 text-lg shadow-creator-lg group"
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
              Start Here
            </Button>
          </Link>
          
          <Link to="/home">
            <Button 
              variant="ghost" 
              size="lg" 
              className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg border border-white/20"
            >
              Explore Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white">10M+</div>
            <div className="text-white/70 text-sm">Videos Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">98%</div>
            <div className="text-white/70 text-sm">Go Viral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">2.5B</div>
            <div className="text-white/70 text-sm">Total Views</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}