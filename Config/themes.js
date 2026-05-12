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
    background: "#E9F7F7",
    surface: "#FFFFFF",
    primary: "#2E8F92",
    primaryDark: "#256B6D",
    accent: "#A7D7C5",
    muted: "#E6F0EF",
    text: "#0F2E31",
    subtext: "#476C6D",
    border: "#CFE7E6",
    danger: "#E86A6A"
  }
};

export const darkTheme = {
  ...base,
  colors: {
    background: "#0F1F1D",
    surface: "#182B29",
    primary: "#4AB2B3",
    primaryDark: "#0B2A29",
    accent: "#2D6E6A",
    muted: "#203735",
    text: "#E9F7F7",
    subtext: "#B8D0D1",
    border: "#2C4A48",
    danger: "#E86A6A"
  }
};
