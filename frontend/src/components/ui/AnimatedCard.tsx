import React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  delay = 0,
  duration = 300,
  hover = true,
  gradient = false,
  onClick,
}) => {
  return (
    <Card
      className={cn(
        'transition-all duration-300 ease-out cursor-pointer',
        gradient && 'bg-gradient-to-br from-orange/10 to-pink/10',
        hover && 'hover:shadow-xl hover:-translate-y-1',
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default AnimatedCard;