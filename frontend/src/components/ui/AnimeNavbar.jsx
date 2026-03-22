import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export function AnimeNavBar({ items, className }) {
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState(null);
  const [activeTab, setActiveTab] = useState(
    () => items.find((i) => i.url === location.pathname)?.name || items[0]?.name
  );

  useEffect(() => {
    const found = items.find((i) => i.url === location.pathname);
    if (found) setActiveTab(found.name);
  }, [location.pathname, items]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#fff7f8]">
      <div className="flex justify-center pt-14 pb-3">
        <motion.div
          className={`flex items-center gap-1 sm:gap-3 bg-rose-700/90 border border-rose-400/30 backdrop-blur-lg py-2 px-2 rounded-full shadow-lg relative ${className || ''}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            const isHovered = hoveredTab === item.name;

            return (
              <Link
                key={item.name}
                to={item.url}
                onClick={() => setActiveTab(item.name)}
                onMouseEnter={() => setHoveredTab(item.name)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`relative cursor-pointer text-sm font-semibold px-3 py-2 sm:px-6 sm:py-3 rounded-full transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-rose-200 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md" />
                    <div className="absolute inset-[-4px] bg-white/15 rounded-full blur-xl" />
                    <div className="absolute inset-[-8px] bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute inset-[-12px] bg-white/5 rounded-full blur-3xl" />
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0"
                      style={{ animation: 'shine 3s ease-in-out infinite' }}
                    />
                  </motion.div>
                )}

                <motion.span
                  className="hidden md:inline relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
                <motion.span
                  className="md:hidden relative z-10"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon size={18} strokeWidth={2.5} />
                </motion.span>

                <AnimatePresence>
                  {isHovered && !isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-white/10 rounded-full -z-10"
                    />
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    layoutId="anime-mascot"
                    className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <div className="relative w-12 h-12">
                      <motion.div
                        className="absolute w-10 h-10 bg-white rounded-full left-1/2 -translate-x-1/2"
                        animate={
                          hoveredTab
                            ? {
                                scale: [1, 1.1, 1],
                                rotate: [0, -5, 5, 0],
                                transition: { duration: 0.5, ease: 'easeInOut' },
                              }
                            : {
                                y: [0, -3, 0],
                                transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                              }
                        }
                      >
                        {/* Eyes */}
                        <motion.div
                          className="absolute w-2 h-2 bg-gray-800 rounded-full"
                          animate={
                            hoveredTab
                              ? { scaleY: [1, 0.2, 1], transition: { duration: 0.2, times: [0, 0.5, 1] } }
                              : {}
                          }
                          style={{ left: '25%', top: '40%' }}
                        />
                        <motion.div
                          className="absolute w-2 h-2 bg-gray-800 rounded-full"
                          animate={
                            hoveredTab
                              ? { scaleY: [1, 0.2, 1], transition: { duration: 0.2, times: [0, 0.5, 1] } }
                              : {}
                          }
                          style={{ right: '25%', top: '40%' }}
                        />
                        {/* Blush */}
                        <motion.div
                          className="absolute w-2 h-1.5 bg-rose-300 rounded-full"
                          animate={{ opacity: hoveredTab ? 0.8 : 0.6 }}
                          style={{ left: '15%', top: '55%' }}
                        />
                        <motion.div
                          className="absolute w-2 h-1.5 bg-rose-300 rounded-full"
                          animate={{ opacity: hoveredTab ? 0.8 : 0.6 }}
                          style={{ right: '15%', top: '55%' }}
                        />
                        {/* Mouth */}
                        <motion.div
                          className="absolute w-4 h-2 border-b-2 border-gray-800 rounded-full"
                          animate={hoveredTab ? { scaleY: 1.5, y: -1 } : { scaleY: 1, y: 0 }}
                          style={{ left: '30%', top: '60%' }}
                        />
                        <AnimatePresence>
                          {hoveredTab && (
                            <>
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute -top-1 -right-1 w-2 h-2 text-yellow-300"
                              >
                                ✨
                              </motion.div>
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ delay: 0.1 }}
                                className="absolute -top-2 left-0 w-2 h-2 text-yellow-300"
                              >
                                ✨
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      {/* Diamond connector */}
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-4 h-4 -translate-x-1/2"
                        animate={
                          hoveredTab
                            ? {
                                y: [0, -4, 0],
                                transition: { duration: 0.3, repeat: Infinity, repeatType: 'reverse' },
                              }
                            : {
                                y: [0, 2, 0],
                                transition: { duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                              }
                        }
                      >
                        <div className="w-full h-full bg-white rotate-45 transform origin-center" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
