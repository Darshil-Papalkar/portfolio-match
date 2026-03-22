import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const AnimatedLoadingSkeleton = () => {
  const [windowWidth, setWindowWidth] = useState(0);
  const controls = useAnimation();

  const getGridConfig = (width) => {
    const numCards = 6;
    const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
    return { numCards, cols, xBase: 40, yBase: 60, xStep: 210, yStep: 230 };
  };

  const generateSearchPath = (config) => {
    const { numCards, cols, xBase, yBase, xStep, yStep } = config;
    const rows = Math.ceil(numCards / cols);
    const allPositions = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (row * cols + col < numCards) {
          allPositions.push({ x: xBase + col * xStep, y: yBase + row * yStep });
        }
      }
    }

    const shuffled = allPositions.sort(() => Math.random() - 0.5).slice(0, 4);
    shuffled.push(shuffled[0]);

    return {
      x: shuffled.map((p) => p.x),
      y: shuffled.map((p) => p.y),
      scale: Array(shuffled.length).fill(1.2),
      transition: {
        duration: shuffled.length * 2,
        repeat: Infinity,
        ease: [0.4, 0, 0.2, 1],
        times: shuffled.map((_, i) => i / (shuffled.length - 1)),
      },
    };
  };

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (windowWidth === 0) return;
    const config = getGridConfig(windowWidth);
    controls.start(generateSearchPath(config));
  }, [windowWidth, controls]);

  const frameVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        '0 0 20px rgba(225, 29, 72, 0.2)',
        '0 0 35px rgba(225, 29, 72, 0.5)',
        '0 0 20px rgba(225, 29, 72, 0.2)',
      ],
      scale: [1, 1.1, 1],
      transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const config = getGridConfig(windowWidth);

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg"
      variants={frameVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-rose-50 to-gray-100 p-8">
        {/* Animated search icon */}
        <motion.div
          className="absolute z-10 pointer-events-none"
          animate={controls}
          style={{ left: 24, top: 24 }}
        >
          <motion.div
            className="bg-rose-500/20 p-3 rounded-full backdrop-blur-sm"
            variants={glowVariants}
            animate="animate"
          >
            <svg
              className="w-6 h-6 text-rose-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Skeleton cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(config.numCards)].map((_, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-sm p-4"
            >
              {/* Photo placeholder */}
              <motion.div
                className="h-32 bg-gray-200 rounded-md mb-3"
                animate={{ background: ['#f3f4f6', '#e5e7eb', '#f3f4f6'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {/* Name placeholder */}
              <motion.div
                className="h-3 w-3/4 bg-gray-200 rounded mb-2"
                animate={{ background: ['#f3f4f6', '#e5e7eb', '#f3f4f6'] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
              {/* Detail placeholder */}
              <motion.div
                className="h-3 w-1/2 bg-gray-200 rounded"
                animate={{ background: ['#f3f4f6', '#e5e7eb', '#f3f4f6'] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedLoadingSkeleton;
