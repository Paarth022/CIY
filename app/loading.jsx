export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pixel-grid opacity-40 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
        <h1 className="font-pixel text-[14px] text-white tracking-[0.2em] uppercase mb-2">
          Generating World
        </h1>
        <p className="text-white/40 text-xs font-mono animate-pulse">
          Loading chunks...
        </p>
      </div>
    </div>
  );
}
