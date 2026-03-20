import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./components/Layout"
import Home from "./pages/Home"
import Inbox from "./pages/Inbox"
import Search from "./pages/Search"
import Explore from "./pages/Explore"
import History from "./pages/History"
import Settings from "./pages/Settings"

function App(){
 return(
  <BrowserRouter>

    <Routes>

      {/* 🔥 ГОЛОВНЕ */}
      <Route path="/" element={<Layout />}>

        <Route index element={<Home />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="search" element={<Search />} />
        <Route path="explore" element={<Explore />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />

      </Route>

    </Routes>

  </BrowserRouter>
 )
}

export default App