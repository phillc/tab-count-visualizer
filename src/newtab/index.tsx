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
  TimeSeriesScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeSeriesScale,
);

export const chartOptions = {
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    title: {
      display: true,
      text: 'Maximum per day',
    },
  },
  scales: {
    x: {
        type: 'timeseries',
        time: {
            unit: 'day',
            tooltipFormat: 'yyyy-MM-dd',
        }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
    },
    y2: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        precision: 0,
      },
    },
  },
};

function IndexNewtab() {
  const [tabsNow, setTabsNow] = useState<any>()
  const [windowsNow, setWindowsNow] = useState<any>()
  const [suggestedTabs, setSuggestedTabs] = useState<any>([])
  const [history, setHistory] = useState<any>()

  useEffect(() => {
    const fetch = async () => {
      const windows = await chrome.windows.getAll({populate: true});
      setWindowsNow(windows);
      const tabs = await chrome.tabs.query({windowType:'normal'});
      setTabsNow(tabs);
      const closable = tabs
        .filter(tab => !tab.pinned && !tab.active) 
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
        .slice(0, 3)
      setSuggestedTabs(closable);

      const storage = new Storage();
      const data = await storage.get('history') || {};
      // console.log(">>>>", data)
      // data["2023-01-14"] = {
      //   maxTabs: 132,
      //   maxWindows: 4
      // }
      // data["2023-02-02"] = {
      //   maxTabs: 145,
      //   maxWindows: 2
      // }
      // data["2023-02-03"] = {
      //   maxTabs: 152,
      //   maxWindows: 2
      // }
      // data["2023-02-04"] = {
      //   maxTabs: 162,
      //   maxWindows: 3
      // }
      const today = new Date().toJSON().slice(0, 10);
      data[today] = data[today] || {maxTabs: 0, maxWindows: 0}
      data[today].maxTabs = Math.max(tabs.length, data[today].maxTabs);
      data[today].maxWindows = Math.max(windows.length, data[today].maxWindows);

      await storage.set('history', data)
      setHistory(data);
    }
    fetch();
  }, []);

  let labels;
  let chartData: ChartData;
  if (history && Object.keys(history).length > 1) {
    labels = Object.keys(history).sort();

    chartData = {
      labels: labels,
      datasets: [
        {
          label: "tabs",
          data: labels.map((label: any) => history[label].maxTabs),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgb(59, 130, 246, 0.5)',
          yAxisID: 'y1',
          tension: 0.1,
        },
        {
          label: "windows",
          data: labels.map((label: any) => history[label].maxWindows),
          borderColor: 'rgb(6, 182, 212)',
          backgroundColor: 'rgb(6, 182, 212, 0.5)',
          yAxisID: 'y2',
          tension: 0.1,
        }
      ]
    }
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
  const suggest = () => {
    if(suggestedTabs.length <= 1) {
      return;
    }
    const handleTabClick = async (e, tab) => {
      e.preventDefault();
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
    }

    return (
      <>
      <h4>Try closing one of these: </h4>
        <ul>
          {suggestedTabs.map((tab, i) =>
            <li key={i} className="my-3">
              <a
                href=""
                onClick={event =>
                  handleTabClick(event, tab)
                }
                style={{ 
                  backgroundImage: `url("${tab.favIconUrl}")`
                }}
                className="p-0.5 pl-7 pr-2 font-medium hover:underline bg-slate-200 rounded-full bg-no-repeat bg-left bg-contain"
              >
                {tab.title}
              </a>
            </li>
          )}
        </ul>
      </>
    )
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
          {suggest()}
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