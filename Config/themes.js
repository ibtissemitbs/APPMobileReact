const base = {
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    round: 999
  },
  typography: {
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
  },
  elevation: {
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
  }
};

export const lightTheme = {
  ...base,
  colors: {
    background: "#F0FFFE",
    surface: "#FFFFFF",
    primary: "#4BA9A3",
    primaryDark: "#357A74",
    secondary: "#CB9DAE",
    highlight: "#D9ADB8",
    accent: "#7ECBC8",
    muted: "#E8F7F5",
    text: "#14242B",
    subtext: "#60727B",
    border: "#D0E9E5",
    success: "#4BA9A3",
    warning: "#F5A524",
    danger: "#E9576B",
    glass: "rgba(255,255,255,0.78)"
  }
};

export const darkTheme = {
  ...base,
  colors: {
    background: "#0F2926",
    surface: "#1A3F3A",
    primary: "#6FBEB8",
    primaryDark: "#4BA9A3",
    secondary: "#DEB0C4",
    highlight: "#E5C1D1",
    accent: "#9FDBDA",
    muted: "#274540",
    text: "#EEF7FA",
    subtext: "#AABBC3",
    border: "#3A6560",
    success: "#6FBEB8",
    warning: "#F5B84B",
    danger: "#FF8B88",
    glass: "rgba(31,63,60,0.78)"
  }
};
