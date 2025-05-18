import '@ant-design/v5-patch-for-react-19';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import antTokens from '@/styles/antToken';
import '@/styles/globals.css';
import Header from '@/components/header/Header';
import { AuthProvider } from '@/context/AuthContext';
const inter = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Lucky7Agency Backoffice Yönetim Paneli',
  description: 'Lucky7Agency yönetim paneli',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ConfigProvider theme={antTokens}>
          <AuthProvider>
            <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
              <Header />
              {children}
            </div>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}