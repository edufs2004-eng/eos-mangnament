import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Servicios EOS - Management System',
  description: 'Control de caja, servicios legales y tecnológicos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 font-sans antialiased text-slate-900">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}