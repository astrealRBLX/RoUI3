import { config, SpringOptions } from '@rbxts/ripple';

export const springs = {
  ...config.spring,
  bubbly: { tension: 300, friction: 20, mass: 1.2 },
  responsive: { tension: 600, friction: 34, mass: 0.7 },
} satisfies { [config: string]: SpringOptions };
