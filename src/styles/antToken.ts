import { Inter } from 'next/font/google';

const interSans = Inter({
    variable: "--font-inter-sans",
    subsets: ["latin"],
});

const antdTokens = {
  token: {
    colorPrimary: "#c8102e",
    borderRadius: 10,
    fontSizeBase: '16px',
    controlHeight: 40,
    fontFamily: interSans.style.fontFamily,
  },
};

export default antdTokens;