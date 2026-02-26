import React from 'react';
import { motion } from 'framer-motion';
import zentimeLogo from '@/assets/zentime-logo.png';

interface LogoProps {
  onClick?: () => void;
  variant?: 'default' | 'admin' | 'light';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  onClick, 
  variant = 'default', 
  showText = true,
  className = '' 
}) => {
  const isClickable = !!onClick;
  const heightClass = variant === 'light' ? 'h-16' : 'h-14';
  
  const logoContent = (
    <img 
      src={zentimeLogo} 
      alt="ZenTime" 
      className={`${heightClass} w-auto object-contain`}
    />
  );

  if (isClickable) {
    return (
      <motion.button
        onClick={onClick}
        className={`flex items-center cursor-pointer ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {logoContent}
      </motion.button>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {logoContent}
    </div>
  );
};

export default Logo;