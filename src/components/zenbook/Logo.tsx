import React from 'react';
import { motion } from 'framer-motion';

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
  
  const logoContent = (
    <>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-sm ${
        variant === 'admin' 
          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
          : variant === 'light'
          ? 'bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground shadow-lg shadow-primary/30'
          : 'bg-primary/10 border border-border text-primary'
      }`}>
        Z
      </div>
      {showText && (
        <span className={`text-xl font-black tracking-tighter ${
          variant === 'admin' 
            ? 'text-foreground'
            : variant === 'light'
            ? 'text-2xl tracking-tight text-foreground'
            : 'text-foreground'
        }`}>
          ZenTime
          {variant === 'admin' && <span className="text-primary">Admin</span>}
          {variant === 'light' && (
            <span className="text-accent">Beauty</span>
          )}
        </span>
      )}
    </>
  );

  if (isClickable) {
    return (
      <motion.button
        onClick={onClick}
        className={`flex items-center gap-3 cursor-pointer ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {logoContent}
      </motion.button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoContent}
    </div>
  );
};

export default Logo;