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
      ticks: {
        precision: 0,
      },
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

const TabLink = ({ prefix, title, tab }) => {
  const handleTabClick = async (e, tab) => {
    e.preventDefault();
    const extensionTabs = await chrome.tabs.query({ title: "Tab Count Visualizer", url: "chrome://newtab/" })
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    for (let tab of extensionTabs) {
      chrome.tabs.remove(tab.id);
    }
  }
  return (
    <div className="tab-link">
      <a
        href=""
        onClick={event =>
          handleTabClick(event, tab)
        }
        style={{
          backgroundImage: `url("${tab.favIconUrl}")`
        }}
        className="tab-link inline-block max-w-full p-1 pl-9 pr-5 font-medium hover:underline bg-slate-200 rounded-full bg-no-repeat bg-left bg-contain truncate"
      >
        {prefix} <span className="tab-link-title">{title}</span>
      </a>
    </div>
  )
}

function IndexNewtab() {
  const [tabsNow, setTabsNow] = useState<any>()
  const [windowsNow, setWindowsNow] = useState<any>()
  const [suggestedTabs, setSuggestedTabs] = useState<any>([])
  const [history, setHistory] = useState<any>()

  useEffect(() => {
    const fetch = async () => {
      const windows = await chrome.windows.getAll({ populate: true });
      setWindowsNow(windows);
      const tabs = await chrome.tabs.query({ windowType: 'normal' });
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
      data[today] = data[today] || { maxTabs: 0, maxWindows: 0 }
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

  let repeatTabs = [];
  if (tabsNow && tabsNow.length) {
    const tabsByUrl = tabsNow.reduce((acc, tab) => {
      if (tab.url) {
        acc[tab.url] = acc[tab.url] || { tab: tab, count: 0 }
        acc[tab.url].count++;
      }
      return acc
    }, {})
    repeatTabs = Object.entries(tabsByUrl)
      .reduce((acc, tuple: any) => {
        if (tuple[1].count > 1) {
          acc.push(tuple[1]);
        }
        return acc;
      }, [])
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 3)
  }

  const badge = (title, collection) => {
    if (collection && collection.length) {
      return (
        <div className="grid grid-cols-1 h-full content-center">
          <div className="text-center text-white text-8xl">{collection.length}</div>
          <div className="text-center text-white">{title}</div>
        </div>
      )
    }
  }
  const suggestRandom = () => {
    if (suggestedTabs.length <= 1) {
      return;
    }

    return (
      <>
        <h4>Consider visiting one of these tabs: </h4>
        <ul>
          {suggestedTabs.map((tab, i) =>
            <li key={i} className="my-3">
              <TabLink title={tab.title} tab={tab} />
            </li>
          )}
        </ul>
      </>
    )
  }

  const suggestDuplicate = () => {
    if (repeatTabs.length == 0) {
      return;
    }

    return (
      <>
        <h4>Consider visiting one of these duplicate tabs: </h4>
        <ul>
          {repeatTabs.map((tabCount, i) =>
            <li key={i} className="my-3">
              <TabLink prefix={`(${tabCount.count})`} title={tabCount.tab.title} tab={tabCount.tab} />
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
          {suggestRandom()}
        </div>
        <div className="mt-8 col-start-3 col-span-3">
          {suggestDuplicate()}
        </div>
        <div className="mt-8 col-start-3 col-span-3">
          {(chartData &&
            <Line options={chartOptions} data={chartData} />) ||
            <p>Check back tomorrow for a chart of tabs over time</p>
          }
        </div>
      </div>
    </div>
  )
}

export default IndexNewtab