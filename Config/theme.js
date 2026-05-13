export const colors = {
  background: "#F0FFFE",
  surface: "#FFFFFF",
  primary: "#4BA9A3",
  primaryDark: "#357A74",
  accent: "#7ECBC8",
  muted: "#E8F7F5",
  text: "#14242B",
  subtext: "#60727B",
  border: "#D0E9E5",
  danger: "#CB9DAE"
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  round: 999
};

export const typography = {
  h1: 32,
  h2: 24,
  h3: 18,
  body: 16,
  small: 13,
  weights: {
    regular: "400",
    medium: "600",
    bold: "700"
  }
};

export const elevation = {
  low: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  mid: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6
  }
};

export default { colors, spacing, radius, typography, elevation };
