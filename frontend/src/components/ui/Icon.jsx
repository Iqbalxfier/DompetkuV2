import React from 'react';
import * as LucideIcons from 'lucide-react';

export default function Icon({ name, size = 18, color, className, ...props }) {
  const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;
  return <IconComponent size={size} color={color} className={className} {...props} />;
}
