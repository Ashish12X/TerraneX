import React, { useState, useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { OverviewPage } from "./pages/OverviewPage";
import { CommandDeckPage } from "./pages/CommandDeckPage";
import { IntelligenceLabPage } from "./pages/IntelligenceLabPage";
import { DispatchHubPage } from "./pages/DispatchHubPage";
import { SimulationStudioPage } from "./pages/SimulationStudioPage";
import { api } from "./services/api";

export default function App() {
  // Navigation: "overview" | "command" | "intelligence" | "dispatch" | "simulator"
  const [activePage, setActivePage] = useState("overview");

  // Operational Mode: "live" | "simulation"
  const [mode, setMode] = useState("live");

  // Core Data States
  const [network, setNetwork] = useState(null);
  const [depots, setDepots] = useState([]);
  const [mlStatus, setMlStatus] = useState(null);

  // 24-Hour Timeline State (Live Mode)
  const [timelineData, setTimelineData] = useState(null);
  const [currentHour, setCurrentHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulation Sliders State
  const [simRain, setSimRain] = useState(85);
  const [simPrior1, setSimPrior1] = useState(10);
  const [simPrior2, setSimPrior2] = useState(5);
  const [simThreshold, setSimThreshold] = useState(0.5);

  // Computed Dispatch & Simulation Risk States
  const [dispatchPlan, setDispatchPlan] = useState(null);
  const [simulationRisk, setSimulationRisk] = useState(null);

  // Selected Segment State for Diagnostics
  const [selectedSegmentId, setSelectedSegmentId] = useState("E06");
  const [selectedSegmentData, setSelectedSegmentData] = useState(null);

  // 1. Initial Load: Network, Depots, ML Status
  useEffect(() => {
    api
      .getNetwork()
      .then((data) => setNetwork(data))
      .catch((err) => console.warn("Network fetch warning:", err));

    api
      .getDepots()
      .then((data) => setDepots(data.depots || []))
      .catch((err) => console.warn("Depots fetch warning:", err));

    api
      .getMLStatus()
      .then((data) => setMlStatus(data))
      .catch((err) => console.warn("ML status warning:", err));
  }, []);

  // 2. Fetch 24-Hour Timeline in Live Mode (auto-sync every 10 min)
  useEffect(() => {
    if (mode !== "live") return;
    const loadTimeline = () => {
      api
        .getTimeline(24, 0.5)
        .then((data) => setTimelineData(data))
        .catch((err) => console.warn("Timeline fetch warning:", err));
    };
    loadTimeline();
    const interval = setInterval(loadTimeline, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // 3. Play/Pause Stepper Animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentHour((prev) => (prev + 1) % 24);
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 4. Dynamic Dispatch Plan (Syncs with hour in Live, or sliders in Simulation)
  useEffect(() => {
    api
      .getDispatchPlan({
        mode,
        hour: currentHour,
        rainfall: simRain,
        prior1: simPrior1,
        prior2: simPrior2,
        threshold: simThreshold,
      })
      .then((data) => setDispatchPlan(data))
      .catch((err) => console.warn("Dispatch plan fetch warning:", err));
  }, [mode, currentHour, simRain, simPrior1, simPrior2, simThreshold]);

  // 5. Full Simulation Risk (Simulation mode)
  useEffect(() => {
    if (mode !== "simulation") return;
    api
      .getSimulationRisk({
        rainfall: simRain,
        prior1: simPrior1,
        prior2: simPrior2,
        threshold: simThreshold,
      })
      .then((data) => setSimulationRisk(data))
      .catch((err) => console.warn("Simulation risk warning:", err));
  }, [mode, simRain, simPrior1, simPrior2, simThreshold]);

  // 6. Selected Segment Diagnostic Details
  useEffect(() => {
    if (!selectedSegmentId) return;

    let rainVal = 0.0;
    let p1Val = 10.0;
    let p2Val = 5.0;

    if (mode === "live") {
      if (timelineData?.timeline && timelineData.timeline[currentHour]) {
        rainVal = timelineData.timeline[currentHour].rainfall_mm || 0.0;
      }
    } else {
      rainVal = simRain;
      p1Val = simPrior1;
      p2Val = simPrior2;
    }

    api
      .getSegmentRisk(selectedSegmentId, {
        rainfall: rainVal,
        prior1: p1Val,
        prior2: p2Val,
        threshold: simThreshold,
      })
      .then((data) => setSelectedSegmentData(data))
      .catch((err) => console.warn("Segment detail warning:", err));
  }, [selectedSegmentId, mode, currentHour, simRain, simPrior1, simPrior2, simThreshold, timelineData]);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Universal Luxury Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        mode={mode}
        setMode={setMode}
        systemStatus={mlStatus}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {activePage === "overview" && (
          <OverviewPage
            onNavigate={(page) => setActivePage(page)}
            network={network}
            depots={depots}
            timelineData={timelineData}
            currentHour={currentHour}
            mlStatus={mlStatus}
          />
        )}

        {activePage === "command" && (
          <CommandDeckPage
            network={network}
            depots={depots}
            mode={mode}
            timelineData={timelineData}
            currentHour={currentHour}
            setCurrentHour={setCurrentHour}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            simRain={simRain}
            setSimRain={setSimRain}
            simPrior1={simPrior1}
            setSimPrior1={setSimPrior1}
            simPrior2={simPrior2}
            setSimPrior2={setSimPrior2}
            simThreshold={simThreshold}
            setSimThreshold={setSimThreshold}
            dispatchPlan={dispatchPlan}
            simulationRisk={simulationRisk}
            selectedSegmentId={selectedSegmentId}
            setSelectedSegmentId={setSelectedSegmentId}
            selectedSegmentData={selectedSegmentData}
            onNavigate={(page) => setActivePage(page)}
          />
        )}

        {activePage === "intelligence" && (
          <IntelligenceLabPage
            network={network}
            onNavigate={(page) => setActivePage(page)}
          />
        )}

        {activePage === "dispatch" && (
          <DispatchHubPage
            dispatchPlan={dispatchPlan}
            depots={depots}
            onNavigate={(page) => setActivePage(page)}
            mode={mode}
            setMode={setMode}
          />
        )}

        {activePage === "simulator" && (
          <SimulationStudioPage
            simRain={simRain}
            setSimRain={setSimRain}
            simPrior1={simPrior1}
            setSimPrior1={setSimPrior1}
            simPrior2={simPrior2}
            setSimPrior2={setSimPrior2}
            simThreshold={simThreshold}
            setSimThreshold={setSimThreshold}
            onNavigate={(page) => setActivePage(page)}
          />
        )}
      </main>
    </div>
  );
}