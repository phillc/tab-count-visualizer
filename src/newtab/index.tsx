import { useState, useEffect } from "react"
import "../style.css"

function IndexNewtab() {
  const [tabsNow, setTabsNow] = useState<any>()
  const [tabsHistory, setTabsHistory] = useState<any>()
  const [windowsNow, setWindowsNow] = useState<any>()
  const [windowsHistory, setWindowsHistory] = useState<any>()
  useEffect(() => {
    const fetch = async () => {
      const windows = await chrome.windows.getAll({populate: true});
      setWindowsNow(windows);
      const tabs = await chrome.tabs.query({windowType:'normal'});
      setTabsNow(tabs);

      const data = JSON.parse(localStorage.getItem('app')) || {tabs: {}, windows: {}};

      data.tabs[today] = Math.max(tabs.length, data.tabs[today]);
      data.windows[today] = Math.max(windows.length, data.tabs[today]);
      localStorage.setItem('app', JSON.stringify(data));
      setTabsHistory(data.tabs);
      setWindowsHistory(data.windows);
    }
    fetch();
  });
  const today = new Date().toJSON().slice(0, 10);

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
        <div className="text-center flex flex-col justify-center items-center">across</div>
        <div className="col-span-3">
          <div className="shadow-xl w-64 h-64 bg-gradient-to-b from-blue-500 to-cyan-500">
            {badge("windows", windowsNow)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexNewtab