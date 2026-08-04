export const useSharedValue = <T,>(value: T) => ({ value });
export const useAnimatedStyle = (factory: () => object) => factory();
export const withRepeat = <T,>(value: T, ..._args: unknown[]) => value;
export const withTiming = <T,>(value: T, ..._args: unknown[]) => value;
export const Easing = {
  inOut: (_easing?: unknown) => "ease-in-out",
  ease: "ease"
};

const Animated = {
  View: "div" as any
};

export default Animated;
