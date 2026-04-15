import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="font-pixel text-6xl text-primary mb-6 animate-bounce">404</h1>
        <h2 className="text-2xl text-white font-bold mb-4">Block Not Found</h2>
        <p className="text-white/60 mb-8 max-w-md text-center">
          It looks like the page or plugin you're trying to find has been blown up by a creeper.
        </p>
        <Link 
          href="/"
          className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
        >
          Return to Hub →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
