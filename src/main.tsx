import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import HomePage from './HomePage'
import neroConfig from '../nerowallet.config'
import { SocialWallet } from './index'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'
import PollAdminDashboard from '@/components/poll-admin-dashboard'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <SocialWallet config={neroConfig} mode='sidebar'>
      <PollAdminDashboard />
    </SocialWallet>
  </BrowserRouter>,
)
