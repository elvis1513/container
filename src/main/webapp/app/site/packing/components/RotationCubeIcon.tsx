/**
 * RotationCubeIcon Component
 * Displays pre-cropped PNG icons for each rotation orientation
 */

import React from 'react';

export interface RotationCubeIconProps {
  orientation: 'LWH' | 'WLH' | 'LHW' | 'WHL' | 'HLW' | 'HWL';
  size?: number;
}

export const RotationCubeIcon: React.FC<RotationCubeIconProps> = ({ orientation, size = 80 }) => {
  // Use content directory URLs
  const imagePath = `/content/rotation_${orientation}.png`;

  return (
    <img src={imagePath} alt={`${orientation} orientation`} width={size} height={size} style={{ display: 'block', objectFit: 'contain' }} />
  );
};

export default RotationCubeIcon;
