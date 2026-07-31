type SvgProps = React.SVGProps<SVGSVGElement> & {
  width?: number | string;
  height?: number | string;
  accessibilityLabel?: string;
};

export default function Svg({ children, ...props }: SvgProps) {
  return <svg {...props}>{children}</svg>;
}

export function Rect({ onPress, ...props }: React.SVGProps<SVGRectElement> & { onPress?: () => void }) {
  return <rect {...props} onClick={onPress} />;
}

export function G(props: React.SVGProps<SVGGElement>) {
  return <g {...props} />;
}

export function Text(props: React.SVGProps<SVGTextElement>) {
  return <text {...props} />;
}
