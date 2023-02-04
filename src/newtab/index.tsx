import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import "../style.css"

import {
  Chart as ChartJS,
  ChartData,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const chartOptions = {
  responsive: true,
};

function IndexNewtab() {
  const [tabsNow, setTabsNow] = useState<any>()
  const [windowsNow, setWindowsNow] = useState<any>()
  const [history, setHistory] = useState<any>()

  useEffect(() => {
    const fetch = async () => {
      const windows = await chrome.windows.getAll({populate: true});
      setWindowsNow(windows);
      const tabs = await chrome.tabs.query({windowType:'normal'});
      setTabsNow(tabs);

      const storage = new Storage();
      const data = await storage.get('history') || {};
      const today = new Date().toJSON().slice(0, 10);
      data[today] = data[today] || {maxTabs: 0, maxWindows: 0}
      data[today].maxTabs = Math.max(tabs.length, data[today].maxTabs);
      data[today].maxWindows = Math.max(windows.length, data[today].maxWindows);

      await storage.set('history', data)
      setHistory(data);
    }
    fetch();
  }, []);

  const chartData: ChartData = history && Object.keys(history).length > 1 && {
    labels: Object.keys(history),
    datasets: [{
      label: "tabs",
      data: Object.values(history).map((v: any) => v.maxTabs)
    }]
  }

  const badge = (title, collection) => {
    if(collection && collection.length) {
      return (
        <div className="grid grid-cols-1 h-full content-center">
          <div className="text-center text-white text-8xl">{collection.length}</div>
          <div className="text-center text-white">{title}</div>
        </div>
      )
    }
  }
  return (
    <div className="container mx-auto">
      <h2 className="text-center text-xl mt-10 mb-10">You have</h2>
      <div className="grid grid-cols-7 gap-4">
        <div className="col-span-3">
          <div className="float-right shadow-xl w-64 h-64 bg-gradient-to-b from-cyan-500 to-blue-500">
            {badge("tabs", tabsNow)}
          </div>
        </div>
        <div className="col-span-1 text-center flex flex-col justify-center items-center">across</div>
        <div className="col-span-3">
          <div className="shadow-xl w-64 h-64 bg-gradient-to-b from-blue-500 to-cyan-500">
            {badge("windows", windowsNow)}
          </div>
        </div>
        <div className="mt-8 col-start-3 col-span-3">
          {chartData &&
            <Line options={chartOptions} data={chartData} />
          }
        </div>
      </div>
    </div>
  )
}

export default IndexNewtab