import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DustTextProps {
  text: string;
  className?: string;
}

const DustText: React.FC<DustTextProps> = ({ text, className }) => {
  const characters = useMemo(() => {
    return text.split('').map((char, index) => ({
      char,
      id: index,
      // Generate random drift values once
      // Start -> Drift Away -> Drift Back -> End
      // x: [0, random_drift_1, random_drift_2, 0]
      x: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 30, 0],
      y: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 30, 0],
      rotate: [(Math.random() - 0.5) * 45, (Math.random() - 0.5) * 20, 0],
    }));
  }, [text]);

  return (
    <div className={`flex justify-center flex-wrap ${className}`}>
      {characters.map((item, index) => (
        <motion.span
          key={item.id}
          initial={{ opacity: 1, filter: 'blur(0px)', x: 0, y: 0 }}
          animate={{
            opacity: [1, 0.3, 0.8, 1], // Fade out partially then in
            filter: ['blur(0px)', 'blur(4px)', 'blur(2px)', 'blur(0px)'],
            x: [0, ...item.x],
            y: [0, ...item.y],
            rotate: [0, ...item.rotate],
            scale: [1, 1.5, 0.8, 1],
          }}
          transition={{
            duration: 6, // Animation duration back to 6s
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 10, // Stay for 10 seconds after re-assembling
            delay: index * 0.08, // Stagger effect
            times: [0, 0.4, 0.7, 1]
          }}
          className="inline-block whitespace-pre origin-center"
        >
          {item.char}
        </motion.span>
      ))}
    </div>
  );
};

export default DustText;
