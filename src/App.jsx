import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"

import Layout from "./components/Layout"
import Home from "./pages/Home"
import Inbox from "./pages/Inbox"
import Search from "./pages/Search"
import Explore from "./pages/Explore"
import History from "./pages/History"
import Settings from "./pages/Settings"
import RequestDetails from "./pages/RequestDetails"

function App(){
 return(
  <BrowserRouter>

    <Routes>

  <Route path="/" element={<Layout/>}>
    <Route index element={<Home/>} />
    <Route path="inbox" element={<Inbox/>} />
    <Route path="search" element={<Search/>} />
    <Route path="explore" element={<Explore/>} />
    <Route path="history" element={<History/>} />
    <Route path="settings" element={<Settings/>} />
    <Route path="request/:id" element={<RequestDetails/>} />
  </Route>

  {/* 🔥 ОКРЕМО */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot" element={<ForgotPassword />} />

</Routes>

  </BrowserRouter>
 )
}

export default App