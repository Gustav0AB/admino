type IconProps = { name?: string; size?: number; color?: string };

function Icon({ name, size = 20, color = "currentColor" }: IconProps) {
  return <span style={{ color, fontSize: size, lineHeight: 1 }}>{name ? name.slice(0, 1).toUpperCase() : "•"}</span>;
}

export const MaterialIcons = Icon;
export const MaterialCommunityIcons = Icon;
export const FontAwesome5 = Icon;
export const Feather = Icon;
