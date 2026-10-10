import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import InvestorWorkspace from "./pages/InvestorWorkspace";

function LandingPagePlaceholder() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-8">
      <div className="max-w-4xl w-full">
        <div className="border border-brand-accent text-brand-accent uppercase text-xs px-2 py-1 inline-block mb-4">
          ☀️ SOLAR CAPTURE ➔ CHARGING
        </div>
        <h1 className="text-6xl md:text-8xl font-bold leading-none mb-4 tracking-tighter">
          HARVEST<br/>LIGHT.<br/>
          <span className="text-brand-accent">REUSE<br/>ENERGY.</span>
        </h1>
        <p className="text-gray-300 max-w-xl text-lg mb-8">
          Never let the lights go out. Capture daily sunshine in beautiful organic arrays, send the excess to sleek storage grids, and watch nature burst into bloom through the night!
        </p>
        <Link 
          to="/investor" 
          className="inline-flex items-center text-sm font-bold tracking-widest border-b border-white hover:text-brand-accent hover:border-brand-accent transition-colors pb-1 uppercase"
        >
          Build the future ➔
        </Link>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-mono uppercase text-gray-500">
        <div>
          Local Battery Integrity<br/>
          <span className="text-brand-accent text-2xl">84%</span>
        </div>
        <div className="text-right">
          Network Base Time<br/>
          <span className="text-white text-xl">00:00:03.4</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPagePlaceholder />} />
        <Route path="/investor" element={<InvestorWorkspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
